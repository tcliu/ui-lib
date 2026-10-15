<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import { onMount } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import TextInput from '$lib/components/TextInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField, resetToggle, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import {
    buildTextInputSnippet,
    adornmentClassName,
    LEADING_SPAN,
    TRAILING_SPAN,
    TRAILER_SPAN,
    type TriState,
  } from './demo-snippet'

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
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgDisabled = $state<TriState>('no')
  let pgDisabledOn = $state(false)
  let pgReadonly = $state<TriState>('no')
  let pgReadonlyOn = $state(false)
  let pgRequired = $state<TriState>('no')
  let pgRequiredOn = $state(false)
  let pgId = $state('')
  let pgIdOn = $state(false)
  let pgInputClass = $state('')
  let pgInputClassOn = $state(false)
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)
  let pgClearable = $state<TriState>('no')
  let pgClearableOn = $state(false)
  let pgClearLabel = $state('Clear')
  let pgClearLabelOn = $state(false)
  let pgClearPlacement = $state('auto')
  let pgClearPlacementOn = $state(false)
  let pgDefaultValue = $state('')
  let pgDefaultValueOn = $state(false)
  let pgAutocomplete = $state('')
  let pgAutocompleteOn = $state(false)
  let pgInputmode = $state('')
  let pgInputmodeOn = $state(false)
  let pgName = $state('')
  let pgNameOn = $state(false)
  let pgType = $state('text')
  let pgTypeOn = $state(false)
  let pgInputStyle = $state('')
  let pgInputStyleOn = $state(false)
  let pgWrapperStyle = $state('')
  let pgWrapperStyleOn = $state(false)
  let pgLeading = $state('')
  let pgLeadingEnabled = $state(true)
  let pgTrailing = $state('')
  let pgTrailingEnabled = $state(true)
  let pgTrailer = $state('')
  let pgTrailerEnabled = $state(true)
  let demoInputRef = $state<HTMLInputElement | null>(null)

  onMount(() => {
    demoInputRef?.focus()
  })

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const demoAriaLabel = $derived(pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : i18n.t('common.apply'))
  const demoAutocomplete = $derived((pgAutocompleteOn && pgAutocomplete ? pgAutocomplete : undefined) as HTMLInputAttributes['autocomplete'])
  const demoInputmode = $derived((pgInputmodeOn && pgInputmode ? pgInputmode : undefined) as HTMLInputAttributes['inputmode'])
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const disabled = $derived(pgDisabledOn ? flagOn(pgDisabled) : undefined)
  const readonly = $derived(pgReadonlyOn ? flagOn(pgReadonly) : undefined)
  const required = $derived(pgRequiredOn ? flagOn(pgRequired) : undefined)
  const clearable = $derived(pgClearableOn ? flagOn(pgClearable) : undefined)
  const demoClearLabel = $derived(pgClearLabelOn && pgClearLabel ? pgClearLabel : undefined)
  const demoClearPlacement = $derived(
    pgClearPlacementOn
      ? ((pgClearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pgDefaultValueOn && pgDefaultValue ? pgDefaultValue : undefined)
  const demoClassName = $derived(
    adornmentClassName(pgClassNameOn ? pgClassName : '', pgLeadingEnabled ? pgLeading : '', pgTrailingEnabled ? pgTrailing : '') ||
      undefined,
  )

  function clearPlayground() {
    pgValue = ''
    pgValueOn = true
    pgAriaLabel = 'Apply'
    pgAriaLabelOn = true
    pgPlaceholder = ''
    pgPlaceholderOn = false
    pgSize = 'md'
    pgSizeOn = false
    pgDisabled = 'no'
    pgDisabledOn = false
    pgReadonly = 'no'
    pgReadonlyOn = false
    pgRequired = 'no'
    pgRequiredOn = false
    pgId = ''
    pgIdOn = false
    pgInputClass = ''
    pgInputClassOn = false
    pgClassName = ''
    pgClassNameOn = false
    pgClearable = 'no'
    pgClearableOn = false
    pgClearLabel = 'Clear'
    pgClearLabelOn = false
    pgClearPlacement = 'auto'
    pgClearPlacementOn = false
    pgDefaultValue = ''
    pgDefaultValueOn = false
    pgAutocomplete = ''
    pgAutocompleteOn = false
    pgInputmode = ''
    pgInputmodeOn = false
    pgName = ''
    pgNameOn = false
    pgType = 'text'
    pgTypeOn = false
    pgInputStyle = ''
    pgInputStyleOn = false
    pgWrapperStyle = ''
    pgWrapperStyleOn = false
    pgLeading = ''
    pgLeadingEnabled = true
    pgTrailing = ''
    pgTrailingEnabled = true
    pgTrailer = ''
    pgTrailerEnabled = true
  }

  const code = $derived.by(() =>
    buildTextInputSnippet({
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      value: pgValue,
      placeholder: pgPlaceholder,
      placeholderOn: pgPlaceholderOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      disabled: pgDisabled,
      disabledOn: pgDisabledOn,
      readonly: pgReadonly,
      readonlyOn: pgReadonlyOn,
      required: pgRequired,
      requiredOn: pgRequiredOn,
      id: pgId,
      idOn: pgIdOn,
      inputClass: pgInputClass,
      inputClassOn: pgInputClassOn,
      className: pgClassName,
      classNameOn: pgClassNameOn,
      clearable: pgClearable,
      clearableOn: pgClearableOn,
      clearLabel: pgClearLabel,
      clearLabelOn: pgClearLabelOn,
      clearPlacement: pgClearPlacement,
      clearPlacementOn: pgClearPlacementOn,
      defaultValue: pgDefaultValue,
      defaultValueOn: pgDefaultValueOn,
      autocomplete: pgAutocomplete,
      autocompleteOn: pgAutocompleteOn,
      inputmode: pgInputmode,
      inputmodeOn: pgInputmodeOn,
      name: pgName,
      nameOn: pgNameOn,
      type: pgType,
      typeOn: pgTypeOn,
      inputStyle: pgInputStyle,
      inputStyleOn: pgInputStyleOn,
      wrapperStyle: pgWrapperStyle,
      wrapperStyleOn: pgWrapperStyleOn,
      leading: pgLeadingEnabled ? pgLeading : '',
      trailing: pgTrailingEnabled ? pgTrailing : '',
      trailer: pgTrailerEnabled ? pgTrailer : '',
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the remaining
  // non-editable props (the bound ref and the function props, A–Z). The bound
  // value edits through the Value column like the SelectDropdown's committed
  // value.
  const fields: SyncableFieldConfig[] = $derived([
    {
      name: 'ariaLabel',
      type: 'string?',
      defaultValue: '—',
      note: 'Accessible name; optional so wrappers can leave it to an external label.',
      editor: 'text',
      clearable: true,
      value: pgAriaLabel,
      onChange: value => {
        pgAriaLabel = value
        pgAriaLabelOn = true
      },
      toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)),
      sync: { kind: 'scopeText', scopeRef: 'applyLabel' },
    },
    textField({ name: 'autocomplete', type: 'string?', defaultValue: '—', note: 'Native autocomplete token.', value: pgAutocomplete, onChange: v => (pgAutocomplete = v), clearable: true, enabled: pgAutocompleteOn, setEnabled: v => (pgAutocompleteOn = v) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes appended to the input.', value: pgClassName, onChange: v => (pgClassName = v), editorDefaultValue: '', clearable: true, enabled: pgClassNameOn, setEnabled: v => (pgClassNameOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', value: pgClearLabel, onChange: v => (pgClearLabel = v), editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', enabled: pgClearLabelOn, setEnabled: v => (pgClearLabelOn = v) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto picks outside when a trailing adornment is set.', options: clearPlacementOptions, value: pgClearPlacement, onChange: v => (pgClearPlacement = v), placeholder: 'auto', clearLabel: 'Clear placement', enabled: pgClearPlacementOn, setEnabled: v => (pgClearPlacementOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', value: pgClearable, onChange: v => (pgClearable = v as TriState), enabled: pgClearableOn, setEnabled: v => (pgClearableOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', value: pgDefaultValue, onChange: v => (pgDefaultValue = v), editorDefaultValue: '', clearable: true, enabled: pgDefaultValueOn, setEnabled: v => (pgDefaultValueOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input.', value: pgDisabled, onChange: v => (pgDisabled = v as TriState), enabled: pgDisabledOn, setEnabled: v => (pgDisabledOn = v) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', value: pgId, onChange: v => (pgId = v), clearable: true, enabled: pgIdOn, setEnabled: v => (pgIdOn = v) }),
    textField({ name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default input classes.', value: pgInputClass, onChange: v => (pgInputClass = v), clearable: true, enabled: pgInputClassOn, setEnabled: v => (pgInputClassOn = v) }),
    textField({ name: 'inputStyle', type: 'string?', defaultValue: '—', note: 'Inline style appended after the size metrics; sizes the field at runtime.', value: pgInputStyle, onChange: v => (pgInputStyle = v), clearable: true, enabled: pgInputStyleOn, setEnabled: v => (pgInputStyleOn = v) }),
    textField({ name: 'inputmode', type: 'string?', defaultValue: '—', note: 'Native inputmode; NumberInput drives numeric/decimal.', value: pgInputmode, onChange: v => (pgInputmode = v), clearable: true, enabled: pgInputmodeOn, setEnabled: v => (pgInputmodeOn = v) }),
    snippetField({
      name: 'leading',
      note: 'Adornment block rendered before the text, positioned inside the frame.',
      value: pgLeading,
      onChange: value => ((pgLeading = value), (pgLeadingEnabled = true)),
      toggle: snippetToggle(pgLeadingEnabled, enabled => (pgLeadingEnabled = enabled)),
    }),
    textField({ name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name.', value: pgName, onChange: v => (pgName = v), clearable: true, enabled: pgNameOn, setEnabled: v => (pgNameOn = v) }),
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', value: pgPlaceholder, onChange: v => (pgPlaceholder = v), clearable: true, enabled: pgPlaceholderOn, setEnabled: v => (pgPlaceholderOn = v) }),
    boolField({ name: 'readonly', defaultValue: 'false', note: 'Read-only input.', value: pgReadonly, onChange: v => (pgReadonly = v as TriState), enabled: pgReadonlyOn, setEnabled: v => (pgReadonlyOn = v) }),
    boolField({ name: 'required', defaultValue: 'false', note: 'Native required flag.', value: pgRequired, onChange: v => (pgRequired = v as TriState), enabled: pgRequiredOn, setEnabled: v => (pgRequiredOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    snippetField({
      name: 'trailer',
      note: 'Content rendered outside the field, after it, in a size-scaled row.',
      value: pgTrailer,
      onChange: value => ((pgTrailer = value), (pgTrailerEnabled = true)),
      toggle: snippetToggle(pgTrailerEnabled, enabled => (pgTrailerEnabled = enabled)),
    }),
    snippetField({
      name: 'trailing',
      note: 'Adornment block rendered after the text, positioned inside the frame.',
      value: pgTrailing,
      onChange: value => ((pgTrailing = value), (pgTrailingEnabled = true)),
      toggle: snippetToggle(pgTrailingEnabled, enabled => (pgTrailingEnabled = enabled)),
    }),
    textField({ name: 'type', type: 'string?', defaultValue: "'text'", note: 'Native input type; PasswordInput and SearchInput drive it.', value: pgType, onChange: v => (pgType = v), editorDefaultValue: 'text', clearable: true, placeholder: 'text', enabled: pgTypeOn, setEnabled: v => (pgTypeOn = v) }),
    {
      name: 'value',
      type: 'string',
      defaultValue: '—',
      note: 'Bindable field value; the eye resets it to empty.',
      editor: 'text',
      clearable: true,
      value: pgValue,
      onChange: value => {
        pgValue = value
        pgValueOn = true
      },
      toggle: resetToggle(
        pgValueOn,
        enabled => (pgValueOn = enabled),
        () => (pgValue = ''),
      ),
      sync: { kind: 'script' },
    },
    textField({ name: 'wrapperStyle', type: 'string?', defaultValue: '—', note: 'Metric custom properties for the adornments, set on the wrapping frame.', value: pgWrapperStyle, onChange: v => (pgWrapperStyle = v), clearable: true, enabled: pgWrapperStyleOn, setEnabled: v => (pgWrapperStyleOn = v) }),
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input.' },
    {
      name: 'onClear',
      type: '() => void',
      defaultValue: 'clears value',
      note: 'Clear handler; falls back to clearing the bound value when omitted.',
    },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'onfocus', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Focus callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback.' },
    {
      name: 'onpointercancel',
      type: '(event: PointerEvent) => void',
      defaultValue: '—',
      note: 'Pointer-cancel callback.',
    },
    { name: 'onpointerdown', type: '(event: PointerEvent) => void', defaultValue: '—', note: 'Pointer-down callback.' },
    { name: 'onpointerup', type: '(event: PointerEvent) => void', defaultValue: '—', note: 'Pointer-up callback.' },
  ])

</script>

{#snippet demoLeading()}
  <span class={LEADING_SPAN}>{pgLeading}</span>
{/snippet}

{#snippet demoTrailing()}
  <span class={TRAILING_SPAN}>{pgTrailing}</span>
{/snippet}

{#snippet demoTrailer()}
  <span class={TRAILER_SPAN}>{pgTrailer}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="TextInput"
    {code}
    onReset={clearPlayground}
    scope={{ applyLabel: i18n.t('common.apply') }}

    sync={{ tag: 'TextInput' }}
  >
    <div class="flex flex-col gap-1">
      <TextInput
        bind:value={pgValue}
        bind:inputRef={demoInputRef}
        ariaLabel={demoAriaLabel}
        placeholder={pgPlaceholderOn && pgPlaceholder ? pgPlaceholder : undefined}
        size={demoSize}
        {disabled}
        {readonly}
        {required}
        id={pgIdOn && pgId ? pgId : undefined}
        type={pgTypeOn && pgType ? pgType : undefined}
        autocomplete={demoAutocomplete}
        inputmode={demoInputmode}
        name={pgNameOn && pgName ? pgName : undefined}
        inputClass={pgInputClassOn && pgInputClass ? pgInputClass : undefined}
        inputStyle={pgInputStyleOn && pgInputStyle ? pgInputStyle : undefined}
        wrapperStyle={pgWrapperStyleOn && pgWrapperStyle ? pgWrapperStyle : undefined}
        className={demoClassName}
        {clearable}
        clearLabel={demoClearLabel}
        clearPlacement={demoClearPlacement}
        defaultValue={demoDefaultValue}
        leading={pgLeadingEnabled && pgLeading ? demoLeading : undefined}
        trailing={pgTrailingEnabled && pgTrailing ? demoTrailing : undefined}
        trailer={pgTrailerEnabled && pgTrailer ? demoTrailer : undefined} />
      <span class="text-sm text-slate-400">value: {pgValue || '—'}</span>
    </div>
  </ShowcasePage>
