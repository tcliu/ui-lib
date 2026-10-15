<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import TextArea from '$lib/components/TextArea.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { textField, boolField, sizeField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import { buildTextAreaSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  const INITIAL = {
    value: '',
    valueOn: true,
    ariaLabel: 'Apply',
    ariaLabelOn: true,
    placeholder: '',
    placeholderOn: false,
    rows: '3',
    rowsOn: false,
    size: 'md',
    sizeOn: false,
    disabled: 'no' as TriState,
    disabledOn: false,
    readonly: 'no' as TriState,
    readonlyOn: false,
    id: '',
    idOn: false,
    inputClass: '',
    inputClassOn: false,
  }
  let pg = $state(structuredClone(INITIAL))

  function asRows(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }

  const demoAriaLabel = $derived(pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : i18n.t('common.apply'))
  const demoRows = $derived(pg.rowsOn ? asRows(pg.rows) : undefined)
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const disabled = $derived(pg.disabledOn ? flagOn(pg.disabled) : undefined)
  const readonly = $derived(pg.readonlyOn ? flagOn(pg.readonly) : undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildTextAreaSnippet({
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      value: pg.value,
      placeholder: pg.placeholder,
      placeholderOn: pg.placeholderOn,
      rows: pg.rows,
      rowsOn: pg.rowsOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      disabled: pg.disabled,
      disabledOn: pg.disabledOn,
      readonly: pg.readonly,
      readonlyOn: pg.readonlyOn,
      id: pg.id,
      idOn: pg.idOn,
      inputClass: pg.inputClass,
      inputClassOn: pg.inputClassOn,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). The bound value edits through the Value column like the
  // TextInput's.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.', editor: 'text', clearable: true, value: pg.ariaLabel, onChange: value => { pg.ariaLabel = value; pg.ariaLabelOn = true; }, toggle: snippetToggle(pg.ariaLabelOn, enabled => (pg.ariaLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the field.', value: pg.disabled, onChange: v => (pg.disabled = v as TriState), enabled: pg.disabledOn, setEnabled: v => (pg.disabledOn = v) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native textarea id.', value: pg.id, onChange: v => (pg.id = v), clearable: true, enabled: pg.idOn, setEnabled: v => (pg.idOn = v) }),
    textField({ name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default textarea classes.', value: pg.inputClass, onChange: v => (pg.inputClass = v), clearable: true, enabled: pg.inputClassOn, setEnabled: v => (pg.inputClassOn = v) }),
    { name: 'inputRef', type: 'HTMLTextAreaElement | null', defaultValue: 'null', note: 'Bindable native textarea.' },
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', value: pg.placeholder, onChange: v => (pg.placeholder = v), clearable: true, enabled: pg.placeholderOn, setEnabled: v => (pg.placeholderOn = v) }),
    boolField({ name: 'readonly', defaultValue: 'false', note: 'Read-only field.', value: pg.readonly, onChange: v => (pg.readonly = v as TriState), enabled: pg.readonlyOn, setEnabled: v => (pg.readonlyOn = v) }),
    { name: 'rows', type: 'number?', defaultValue: '3', editorDefaultValue: '3', note: 'Visible text rows.', editor: 'number', clearable: true, value: pg.rows, onChange: value => { pg.rows = value; pg.rowsOn = true; }, placeholder: '3', toggle: snippetToggle(pg.rowsOn, enabled => (pg.rowsOn = enabled)), sync: { kind: 'number', pattern: /^\d+$/ } },
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value; the eye resets it to empty.', editor: 'text', clearable: true, value: pg.value, onChange: value => { pg.value = value; pg.valueOn = true; }, toggle: resetToggle(pg.valueOn, enabled => (pg.valueOn = enabled), () => (pg.value = '')), sync: { kind: 'script' } },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'onfocus', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Focus callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback.' },
  ])

</script>

<ShowcasePage
    {fields}
    title="TextArea"
    {code}
    onReset={clearPlayground}
    scope={{ applyLabel: i18n.t('common.apply') }}

    sync={{ tag: 'TextArea' }}
  >
    <div class="flex flex-col gap-1">
      <TextArea
        bind:value={pg.value}
        ariaLabel={demoAriaLabel}
        placeholder={pg.placeholderOn && pg.placeholder ? pg.placeholder : undefined}
        rows={demoRows}
        size={demoSize}
        {disabled}
        {readonly}
        id={pg.idOn && pg.id ? pg.id : undefined}
        inputClass={pg.inputClassOn && pg.inputClass ? pg.inputClass : undefined} />
      <span class="text-sm text-slate-400">value: {pg.value || '—'}</span>
    </div>
  </ShowcasePage>
