<script lang="ts">
  import { onMount } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PasswordInput from '$lib/components/PasswordInput.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetToggle, resetToggle } from '$lib/showcase/snippet-field'
  import { buildPasswordInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  let pgValue = $state('')
  let pgValueOn = $state(true)
  let pgPlaceholder = $state('')
  let pgPlaceholderOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgShowLabel = $state('')
  let pgShowLabelOn = $state(false)
  let pgHideLabel = $state('')
  let pgHideLabelOn = $state(false)
  let pgDisabled = $state<TriState>('no')
  let pgDisabledOn = $state(false)
  let pgRequired = $state<TriState>('no')
  let pgRequiredOn = $state(false)
  let pgClearable = $state<TriState>('no')
  let pgClearableOn = $state(false)
  let pgClearLabel = $state('Clear')
  let pgClearLabelOn = $state(false)
  let pgClearPlacement = $state('auto')
  let pgClearPlacementOn = $state(false)
  let pgDefaultValue = $state('')
  let pgDefaultValueOn = $state(false)
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)
  let pgAutocomplete = $state('current-password')
  let pgAutocompleteOn = $state(false)
  let pgId = $state('')
  let pgIdOn = $state(false)
  let pgName = $state('')
  let pgNameOn = $state(false)
  let pwdDemo = $state<{ focus: () => void } | null>(null)

  onMount(() => {
    pwdDemo?.focus()
  })

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const disabled = $derived(pgDisabledOn ? flagOn(pgDisabled) : undefined)
  const required = $derived(pgRequiredOn ? flagOn(pgRequired) : undefined)
  const clearable = $derived(pgClearableOn ? flagOn(pgClearable) : undefined)
  const demoClearLabel = $derived(pgClearLabelOn && pgClearLabel ? pgClearLabel : undefined)
  const demoClearPlacement = $derived(
    pgClearPlacementOn
      ? ((pgClearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pgDefaultValueOn && pgDefaultValue ? pgDefaultValue : undefined)
  const demoAutocomplete = $derived((pgAutocompleteOn && pgAutocomplete ? pgAutocomplete : undefined) as HTMLInputAttributes['autocomplete'])
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)

  function clearPlayground() {
    pgValue = ''
    pgValueOn = true
    pgPlaceholder = ''
    pgPlaceholderOn = false
    pgSize = 'md'
    pgSizeOn = false
    pgShowLabel = ''
    pgShowLabelOn = false
    pgHideLabel = ''
    pgHideLabelOn = false
    pgDisabled = 'no'
    pgDisabledOn = false
    pgRequired = 'no'
    pgRequiredOn = false
    pgClearable = 'no'
    pgClearableOn = false
    pgClearLabel = 'Clear'
    pgClearLabelOn = false
    pgClearPlacement = 'auto'
    pgClearPlacementOn = false
    pgDefaultValue = ''
    pgDefaultValueOn = false
    pgClassName = ''
    pgClassNameOn = false
    pgAutocomplete = 'current-password'
    pgAutocompleteOn = false
    pgId = ''
    pgIdOn = false
    pgName = ''
    pgNameOn = false
  }

  const code = $derived.by(() =>
    buildPasswordInputSnippet({
      value: pgValue,
      placeholder: pgPlaceholder,
      placeholderOn: pgPlaceholderOn,
      showLabel: pgShowLabel,
      showLabelOn: pgShowLabelOn,
      hideLabel: pgHideLabel,
      hideLabelOn: pgHideLabelOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      disabled: pgDisabled,
      disabledOn: pgDisabledOn,
      required: pgRequired,
      requiredOn: pgRequiredOn,
      clearable: pgClearable,
      clearableOn: pgClearableOn,
      clearLabel: pgClearLabel,
      clearLabelOn: pgClearLabelOn,
      clearPlacement: pgClearPlacement,
      clearPlacementOn: pgClearPlacementOn,
      defaultValue: pgDefaultValue,
      defaultValueOn: pgDefaultValueOn,
      className: pgClassName,
      classNameOn: pgClassNameOn,
      autocomplete: pgAutocomplete,
      autocompleteOn: pgAutocompleteOn,
      id: pgId,
      idOn: pgIdOn,
      name: pgName,
      nameOn: pgNameOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({}),
    sync: { tag: 'PasswordInput', getFields: () => syncFields },
  })

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'autocomplete', type: 'string?', defaultValue: "'current-password'", editorDefaultValue: 'current-password', note: 'Native autocomplete token; the eye stages the customization.', editor: 'text', clearable: true, value: pgAutocomplete, onChange: value => { pgAutocomplete = value; pgAutocompleteOn = true; }, placeholder: 'current-password', toggle: snippetToggle(pgAutocompleteOn, enabled => (pgAutocompleteOn = enabled)), sync: { kind: 'text' } },
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the input; the eye stages the customization.', editor: 'text', clearable: true, value: pgClassName, onChange: value => { pgClassName = value; pgClassNameOn = true; }, toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", editorDefaultValue: 'Clear', note: 'Accessible name for the clear button; the eye stages the customization.', editor: 'text', clearable: true, value: pgClearLabel, onChange: value => { pgClearLabel = value; pgClearLabelOn = true; }, toggle: snippetToggle(pgClearLabelOn, enabled => (pgClearLabelOn = enabled)), placeholder: 'Clear', sync: { kind: 'text' } },
    { name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto renders outside because the toggle owns the right edge; the eye stages the customization.', editor: 'enum', options: clearPlacementOptions, value: pgClearPlacement, onChange: value => { pgClearPlacement = value; pgClearPlacementOn = true; }, placeholder: 'auto', clearLabel: 'Clear placement', toggle: snippetToggle(pgClearPlacementOn, enabled => (pgClearPlacementOn = enabled)), sync: { kind: 'text' } },
    { name: 'clearable', type: 'boolean', defaultValue: 'false', note: 'Appends a cross button that clears the value; the eye stages the customization.', editor: 'boolean', value: pgClearable, onChange: value => { pgClearable = value as TriState; pgClearableOn = true; }, toggle: snippetToggle(pgClearableOn, enabled => (pgClearableOn = enabled)), sync: { kind: 'tri' } },
    { name: 'defaultValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Baseline the clear button compares against; the cross hides while the value matches it; the eye stages the customization.', editor: 'text', clearable: true, value: pgDefaultValue, onChange: value => { pgDefaultValue = value; pgDefaultValueOn = true; }, toggle: snippetToggle(pgDefaultValueOn, enabled => (pgDefaultValueOn = enabled)), sync: { kind: 'text' } },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the field and the toggle; the eye stages the customization.', editor: 'boolean', value: pgDisabled, onChange: value => { pgDisabled = value as TriState; pgDisabledOn = true; }, toggle: snippetToggle(pgDisabledOn, enabled => (pgDisabledOn = enabled)), sync: { kind: 'tri' } },
    { name: 'hideLabel', type: 'string?', defaultValue: '—', note: 'Toggle label when visible; falls back to the locale; the eye stages the customization.', editor: 'text', clearable: true, value: pgHideLabel, onChange: value => { pgHideLabel = value; pgHideLabelOn = true; }, toggle: snippetToggle(pgHideLabelOn, enabled => (pgHideLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id; the eye stages the customization.', editor: 'text', clearable: true, value: pgId, onChange: value => { pgId = value; pgIdOn = true; }, toggle: snippetToggle(pgIdOn, enabled => (pgIdOn = enabled)), sync: { kind: 'text' } },
    { name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name; the eye stages the customization.', editor: 'text', clearable: true, value: pgName, onChange: value => { pgName = value; pgNameOn = true; }, toggle: snippetToggle(pgNameOn, enabled => (pgNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Placeholder text; the eye stages the customization.', editor: 'text', clearable: true, value: pgPlaceholder, onChange: value => { pgPlaceholder = value; pgPlaceholderOn = true; }, toggle: snippetToggle(pgPlaceholderOn, enabled => (pgPlaceholderOn = enabled)), sync: { kind: 'text' } },
    { name: 'required', type: 'boolean', defaultValue: 'false', note: 'Native required flag; the eye stages the customization.', editor: 'boolean', value: pgRequired, onChange: value => { pgRequired = value as TriState; pgRequiredOn = true; }, toggle: snippetToggle(pgRequiredOn, enabled => (pgRequiredOn = enabled)), sync: { kind: 'tri' } },
    { name: 'showLabel', type: 'string?', defaultValue: '—', note: 'Toggle label when hidden; falls back to the locale; the eye stages the customization.', editor: 'text', clearable: true, value: pgShowLabel, onChange: value => { pgShowLabel = value; pgShowLabelOn = true; }, toggle: snippetToggle(pgShowLabelOn, enabled => (pgShowLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Control scale; numbers are icon-scale pixels scaled by fixed ratios; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', placeholder: 'md', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'text' } },
    { name: 'value', type: 'string', defaultValue: "''", editorDefaultValue: '', note: 'Bindable field value; the eye resets it to empty.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: resetToggle(pgValueOn, enabled => (pgValueOn = enabled), () => (pgValue = '')), sync: { kind: 'script' } },
    { name: 'onClear', type: '() => void', defaultValue: 'clears value', note: 'Clear handler; falls back to clearing the bound value when omitted.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Native input handler.' }
  ])

  const syncFields = $derived(syncFieldsOf(fields))
</script>

<ShowcasePage
    {fields}
    title="PasswordInput"
    {code}
    {preview}
    onReset={clearPlayground}
>
    <PasswordInput
      bind:this={pwdDemo}
      bind:value={pgValue}
      placeholder={pgPlaceholderOn && pgPlaceholder ? pgPlaceholder : 'Password'}
      size={demoSize}
      showLabel={pgShowLabelOn && pgShowLabel ? pgShowLabel : undefined}
      hideLabel={pgHideLabelOn && pgHideLabel ? pgHideLabel : undefined}
      {disabled}
      {required}
      autocomplete={demoAutocomplete}
      id={pgIdOn && pgId ? pgId : undefined}
      name={pgNameOn && pgName ? pgName : undefined}
      className={pgClassNameOn && pgClassName ? pgClassName : undefined}
      {clearable}
      clearLabel={demoClearLabel}
      clearPlacement={demoClearPlacement}
      defaultValue={demoDefaultValue} />
    <span class="text-sm text-slate-400">length: {pgValue.length}</span>
  </ShowcasePage>
