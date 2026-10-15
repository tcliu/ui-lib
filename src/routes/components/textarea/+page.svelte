<script lang="ts">
  import TextArea from '$lib/components/TextArea.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
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

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

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

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ applyLabel: i18n.t('common.apply') }),
    sync: { tag: 'TextArea', getFields: () => syncFields },
  })

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). The bound value edits through the Value column like the
  // TextInput's.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name; the eye stages the customization.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the field; the eye stages the customization.', editor: 'boolean', value: pgDisabled, onChange: value => { pgDisabled = value as TriState; pgDisabledOn = true; }, toggle: snippetToggle(pgDisabledOn, enabled => (pgDisabledOn = enabled)), sync: { kind: 'tri' } },
    { name: 'id', type: 'string?', defaultValue: '—', note: 'Native textarea id; the eye stages the customization.', editor: 'text', clearable: true, value: pgId, onChange: value => { pgId = value; pgIdOn = true; }, toggle: snippetToggle(pgIdOn, enabled => (pgIdOn = enabled)), sync: { kind: 'text' } },
    { name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default textarea classes; the eye stages the customization.', editor: 'text', clearable: true, value: pgInputClass, onChange: value => { pgInputClass = value; pgInputClassOn = true; }, toggle: snippetToggle(pgInputClassOn, enabled => (pgInputClassOn = enabled)), sync: { kind: 'text' } },
    { name: 'inputRef', type: 'HTMLTextAreaElement | null', defaultValue: 'null', note: 'Bindable native textarea.' },
    { name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder; the eye stages the customization.', editor: 'text', clearable: true, value: pgPlaceholder, onChange: value => { pgPlaceholder = value; pgPlaceholderOn = true; }, toggle: snippetToggle(pgPlaceholderOn, enabled => (pgPlaceholderOn = enabled)), sync: { kind: 'text' } },
    { name: 'readonly', type: 'boolean', defaultValue: 'false', note: 'Read-only field; the eye stages the customization.', editor: 'boolean', value: pgReadonly, onChange: value => { pgReadonly = value as TriState; pgReadonlyOn = true; }, toggle: snippetToggle(pgReadonlyOn, enabled => (pgReadonlyOn = enabled)), sync: { kind: 'tri' } },
    { name: 'rows', type: 'number?', defaultValue: '3', editorDefaultValue: '3', note: 'Visible text rows; the eye stages the customization.', editor: 'number', clearable: true, value: pgRows, onChange: value => { pgRows = value; pgRowsOn = true; }, placeholder: '3', toggle: snippetToggle(pgRowsOn, enabled => (pgRowsOn = enabled)), sync: { kind: 'number', pattern: /^\d+$/ } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Control scale; numbers are icon-scale pixels interpolated between the steps; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', placeholder: 'md', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'custom', read: attrs => {
      const attr = attrs?.get('size')
      // Absent restores the default, like the builder omitting the line;
      // string and numeric shapes set, anything else is custom code the
      // playground leaves alone.
      if (!attr) return 'md'
      if (attr.kind === 'string') return attr.value
      if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
      return undefined
    } } },
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value; the eye resets it to empty.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: resetToggle(pgValueOn, enabled => (pgValueOn = enabled), () => (pgValue = '')), sync: { kind: 'script' } },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'onfocus', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Focus callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))
</script>

<ShowcasePage
    {fields}
    title="TextArea"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{ applyLabel: i18n.t('common.apply') }}
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
