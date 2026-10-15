<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import { onMount } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PasswordInput from '$lib/components/PasswordInput.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, boolField, snippetToggle, resetToggle } from '$lib/showcase/snippet-field'
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

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'autocomplete', type: 'string?', defaultValue: "'current-password'", note: 'Native autocomplete token.', value: pgAutocomplete, onChange: v => (pgAutocomplete = v), editorDefaultValue: 'current-password', clearable: true, placeholder: 'current-password', enabled: pgAutocompleteOn, setEnabled: v => (pgAutocompleteOn = v) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the input.', value: pgClassName, onChange: v => (pgClassName = v), editorDefaultValue: '', clearable: true, enabled: pgClassNameOn, setEnabled: v => (pgClassNameOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', value: pgClearLabel, onChange: v => (pgClearLabel = v), editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', enabled: pgClearLabelOn, setEnabled: v => (pgClearLabelOn = v) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto renders outside because the toggle owns the right edge.', options: clearPlacementOptions, value: pgClearPlacement, onChange: v => (pgClearPlacement = v), placeholder: 'auto', clearLabel: 'Clear placement', enabled: pgClearPlacementOn, setEnabled: v => (pgClearPlacementOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', value: pgClearable, onChange: v => (pgClearable = v as TriState), enabled: pgClearableOn, setEnabled: v => (pgClearableOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', value: pgDefaultValue, onChange: v => (pgDefaultValue = v), editorDefaultValue: '', clearable: true, enabled: pgDefaultValueOn, setEnabled: v => (pgDefaultValueOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the field and the toggle.', value: pgDisabled, onChange: v => (pgDisabled = v as TriState), enabled: pgDisabledOn, setEnabled: v => (pgDisabledOn = v) }),
    textField({ name: 'hideLabel', type: 'string?', defaultValue: '—', note: 'Toggle label when visible; falls back to the locale.', value: pgHideLabel, onChange: v => (pgHideLabel = v), clearable: true, enabled: pgHideLabelOn, setEnabled: v => (pgHideLabelOn = v) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', value: pgId, onChange: v => (pgId = v), clearable: true, enabled: pgIdOn, setEnabled: v => (pgIdOn = v) }),
    textField({ name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name.', value: pgName, onChange: v => (pgName = v), clearable: true, enabled: pgNameOn, setEnabled: v => (pgNameOn = v) }),
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Placeholder text.', value: pgPlaceholder, onChange: v => (pgPlaceholder = v), clearable: true, enabled: pgPlaceholderOn, setEnabled: v => (pgPlaceholderOn = v) }),
    boolField({ name: 'required', defaultValue: 'false', note: 'Native required flag.', value: pgRequired, onChange: v => (pgRequired = v as TriState), enabled: pgRequiredOn, setEnabled: v => (pgRequiredOn = v) }),
    textField({ name: 'showLabel', type: 'string?', defaultValue: '—', note: 'Toggle label when hidden; falls back to the locale.', value: pgShowLabel, onChange: v => (pgShowLabel = v), clearable: true, enabled: pgShowLabelOn, setEnabled: v => (pgShowLabelOn = v) }),
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Control scale; numbers are icon-scale pixels scaled by fixed ratios.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', placeholder: 'md', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'text' } },
    { name: 'value', type: 'string', defaultValue: "''", editorDefaultValue: '', note: 'Bindable field value; the eye resets it to empty.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: resetToggle(pgValueOn, enabled => (pgValueOn = enabled), () => (pgValue = '')), sync: { kind: 'script' } },
    { name: 'onClear', type: '() => void', defaultValue: 'clears value', note: 'Clear handler; falls back to clearing the bound value when omitted.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Native input handler.' }
  ])

</script>

<ShowcasePage
    {fields}
    title="PasswordInput"
    {code}
    onReset={clearPlayground}

    sync={{ tag: 'PasswordInput' }}
    scope={{}}
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
