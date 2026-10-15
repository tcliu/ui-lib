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
  let pgValue = $state('')
  let pgValueOn = $state(true)
  let pgAriaLabel = $state('Apply')
  let pgAriaLabelOn = $state(true)
  let pgPlaceholder = $state('')
  let pgPlaceholderOn = $state(false)
  let pgRows = $state('3')
  let pgRowsOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgDisabled = $state<TriState>('no')
  let pgDisabledOn = $state(false)
  let pgReadonly = $state<TriState>('no')
  let pgReadonlyOn = $state(false)
  let pgId = $state('')
  let pgIdOn = $state(false)
  let pgInputClass = $state('')
  let pgInputClassOn = $state(false)

  function asRows(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }

  const demoAriaLabel = $derived(pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : i18n.t('common.apply'))
  const demoRows = $derived(pgRowsOn ? asRows(pgRows) : undefined)
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const disabled = $derived(pgDisabledOn ? flagOn(pgDisabled) : undefined)
  const readonly = $derived(pgReadonlyOn ? flagOn(pgReadonly) : undefined)

  function clearPlayground() {
    pgValue = ''
    pgValueOn = true
    pgAriaLabel = 'Apply'
    pgAriaLabelOn = true
    pgPlaceholder = ''
    pgPlaceholderOn = false
    pgRows = '3'
    pgRowsOn = false
    pgSize = 'md'
    pgSizeOn = false
    pgDisabled = 'no'
    pgDisabledOn = false
    pgReadonly = 'no'
    pgReadonlyOn = false
    pgId = ''
    pgIdOn = false
    pgInputClass = ''
    pgInputClassOn = false
  }

  const code = $derived.by(() =>
    buildTextAreaSnippet({
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      value: pgValue,
      placeholder: pgPlaceholder,
      placeholderOn: pgPlaceholderOn,
      rows: pgRows,
      rowsOn: pgRowsOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      disabled: pgDisabled,
      disabledOn: pgDisabledOn,
      readonly: pgReadonly,
      readonlyOn: pgReadonlyOn,
      id: pgId,
      idOn: pgIdOn,
      inputClass: pgInputClass,
      inputClassOn: pgInputClassOn,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). The bound value edits through the Value column like the
  // TextInput's.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the field.', value: pgDisabled, onChange: v => (pgDisabled = v as TriState), enabled: pgDisabledOn, setEnabled: v => (pgDisabledOn = v) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native textarea id.', value: pgId, onChange: v => (pgId = v), clearable: true, enabled: pgIdOn, setEnabled: v => (pgIdOn = v) }),
    textField({ name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default textarea classes.', value: pgInputClass, onChange: v => (pgInputClass = v), clearable: true, enabled: pgInputClassOn, setEnabled: v => (pgInputClassOn = v) }),
    { name: 'inputRef', type: 'HTMLTextAreaElement | null', defaultValue: 'null', note: 'Bindable native textarea.' },
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', value: pgPlaceholder, onChange: v => (pgPlaceholder = v), clearable: true, enabled: pgPlaceholderOn, setEnabled: v => (pgPlaceholderOn = v) }),
    boolField({ name: 'readonly', defaultValue: 'false', note: 'Read-only field.', value: pgReadonly, onChange: v => (pgReadonly = v as TriState), enabled: pgReadonlyOn, setEnabled: v => (pgReadonlyOn = v) }),
    { name: 'rows', type: 'number?', defaultValue: '3', editorDefaultValue: '3', note: 'Visible text rows.', editor: 'number', clearable: true, value: pgRows, onChange: value => { pgRows = value; pgRowsOn = true; }, placeholder: '3', toggle: snippetToggle(pgRowsOn, enabled => (pgRowsOn = enabled)), sync: { kind: 'number', pattern: /^\d+$/ } },
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value; the eye resets it to empty.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: resetToggle(pgValueOn, enabled => (pgValueOn = enabled), () => (pgValue = '')), sync: { kind: 'script' } },
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
        bind:value={pgValue}
        ariaLabel={demoAriaLabel}
        placeholder={pgPlaceholderOn && pgPlaceholder ? pgPlaceholder : undefined}
        rows={demoRows}
        size={demoSize}
        {disabled}
        {readonly}
        id={pgIdOn && pgId ? pgId : undefined}
        inputClass={pgInputClassOn && pgInputClass ? pgInputClass : undefined} />
      <span class="text-sm text-slate-400">value: {pgValue || '—'}</span>
    </div>
  </ShowcasePage>
