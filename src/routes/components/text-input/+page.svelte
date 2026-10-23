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
  const INITIAL = {
    value: '',
    valueOn: true,
    ariaLabel: 'Apply',
    ariaLabelOn: true,
    placeholder: '',
    placeholderOn: false,
    size: 'md',
    sizeOn: false,
    disabled: 'no' as TriState,
    disabledOn: false,
    hideOutline: 'no' as TriState,
    hideOutlineOn: false,
    readonly: 'no' as TriState,
    readonlyOn: false,
    required: 'no' as TriState,
    requiredOn: false,
    id: '',
    idOn: false,
    inputClass: '',
    inputClassOn: false,
    variant: 'bordered',
    variantOn: false,
    className: '',
    classNameOn: false,
    clearable: 'no' as TriState,
    clearableOn: false,
    clearLabel: 'Clear',
    clearLabelOn: false,
    clearPlacement: 'auto',
    clearPlacementOn: false,
    defaultValue: '',
    defaultValueOn: false,
    autocomplete: '',
    autocompleteOn: false,
    inputmode: '',
    inputmodeOn: false,
    name: '',
    nameOn: false,
    type: 'text',
    typeOn: false,
    inputStyle: '',
    inputStyleOn: false,
    wrapperStyle: '',
    wrapperStyleOn: false,
    leading: '',
    leadingEnabled: true,
    trailing: '',
    trailingEnabled: true,
    trailer: '',
    trailerEnabled: true,
  }
  let pg = $state(structuredClone(INITIAL))
  let demoInputRef = $state<HTMLInputElement | null>(null)

  onMount(() => {
    demoInputRef?.focus()
  })

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const variantOptions = [
    { value: 'bordered', label: 'bordered' },
    { value: 'embedded', label: 'embedded' },
  ]

  const demoAriaLabel = $derived(pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : i18n.t('common.apply'))
  const demoAutocomplete = $derived((pg.autocompleteOn && pg.autocomplete ? pg.autocomplete : undefined) as HTMLInputAttributes['autocomplete'])
  const demoInputmode = $derived((pg.inputmodeOn && pg.inputmode ? pg.inputmode : undefined) as HTMLInputAttributes['inputmode'])
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const disabled = $derived(pg.disabledOn ? flagOn(pg.disabled) : undefined)
  const hideOutline = $derived(pg.hideOutlineOn ? flagOn(pg.hideOutline) : undefined)
  const readonly = $derived(pg.readonlyOn ? flagOn(pg.readonly) : undefined)
  const required = $derived(pg.requiredOn ? flagOn(pg.required) : undefined)
  const clearable = $derived(pg.clearableOn ? flagOn(pg.clearable) : undefined)
  const demoClearLabel = $derived(pg.clearLabelOn && pg.clearLabel ? pg.clearLabel : undefined)
  const demoClearPlacement = $derived(
    pg.clearPlacementOn
      ? ((pg.clearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pg.defaultValueOn && pg.defaultValue ? pg.defaultValue : undefined)
  const demoVariant = $derived(
    pg.variantOn ? ((pg.variant || undefined) as 'bordered' | 'embedded' | undefined) : undefined,
  )
  const demoClassName = $derived(
    adornmentClassName(pg.classNameOn ? pg.className : '', pg.leadingEnabled ? pg.leading : '', pg.trailingEnabled ? pg.trailing : '') ||
      undefined,
  )

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildTextInputSnippet({
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      value: pg.value,
      placeholder: pg.placeholder,
      placeholderOn: pg.placeholderOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      disabled: pg.disabled,
      disabledOn: pg.disabledOn,
      hideOutline: pg.hideOutline,
      hideOutlineOn: pg.hideOutlineOn,
      readonly: pg.readonly,
      readonlyOn: pg.readonlyOn,
      required: pg.required,
      requiredOn: pg.requiredOn,
      id: pg.id,
      idOn: pg.idOn,
      inputClass: pg.inputClass,
      inputClassOn: pg.inputClassOn,
      variant: pg.variant,
      variantOn: pg.variantOn,
      className: pg.className,
      classNameOn: pg.classNameOn,
      clearable: pg.clearable,
      clearableOn: pg.clearableOn,
      clearLabel: pg.clearLabel,
      clearLabelOn: pg.clearLabelOn,
      clearPlacement: pg.clearPlacement,
      clearPlacementOn: pg.clearPlacementOn,
      defaultValue: pg.defaultValue,
      defaultValueOn: pg.defaultValueOn,
      autocomplete: pg.autocomplete,
      autocompleteOn: pg.autocompleteOn,
      inputmode: pg.inputmode,
      inputmodeOn: pg.inputmodeOn,
      name: pg.name,
      nameOn: pg.nameOn,
      type: pg.type,
      typeOn: pg.typeOn,
      inputStyle: pg.inputStyle,
      inputStyleOn: pg.inputStyleOn,
      wrapperStyle: pg.wrapperStyle,
      wrapperStyleOn: pg.wrapperStyleOn,
      leading: pg.leadingEnabled ? pg.leading : '',
      trailing: pg.trailingEnabled ? pg.trailing : '',
      trailer: pg.trailerEnabled ? pg.trailer : '',
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
      value: pg.ariaLabel,
      onChange: value => {
        pg.ariaLabel = value
        pg.ariaLabelOn = true
      },
      toggle: snippetToggle(pg.ariaLabelOn, enabled => (pg.ariaLabelOn = enabled)),
      sync: { kind: 'scopeText', scopeRef: 'applyLabel' },
    },
    textField({ name: 'autocomplete', type: 'string?', defaultValue: '—', note: 'Native autocomplete token.', value: pg.autocomplete, onChange: v => (pg.autocomplete = v), clearable: true, enabled: pg.autocompleteOn, setEnabled: v => (pg.autocompleteOn = v) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes appended to the input.', value: pg.className, onChange: v => (pg.className = v), editorDefaultValue: '', clearable: true, enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', value: pg.clearLabel, onChange: v => (pg.clearLabel = v), editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', enabled: pg.clearLabelOn, setEnabled: v => (pg.clearLabelOn = v) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto picks outside when a trailing adornment is set.', options: clearPlacementOptions, value: pg.clearPlacement, onChange: v => (pg.clearPlacement = v), placeholder: 'auto', clearLabel: 'Clear placement', enabled: pg.clearPlacementOn, setEnabled: v => (pg.clearPlacementOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', value: pg.clearable, onChange: v => (pg.clearable = v as TriState), enabled: pg.clearableOn, setEnabled: v => (pg.clearableOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', value: pg.defaultValue, onChange: v => (pg.defaultValue = v), editorDefaultValue: '', clearable: true, enabled: pg.defaultValueOn, setEnabled: v => (pg.defaultValueOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input.', value: pg.disabled, onChange: v => (pg.disabled = v as TriState), enabled: pg.disabledOn, setEnabled: v => (pg.disabledOn = v) }),
    boolField({ name: 'hideOutline', defaultValue: 'false', note: 'Drops the bordered field’s border and focus border while keeping its surface, padding, and text metrics.', value: pg.hideOutline, onChange: v => (pg.hideOutline = v as TriState), enabled: pg.hideOutlineOn, setEnabled: v => (pg.hideOutlineOn = v) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', value: pg.id, onChange: v => (pg.id = v), clearable: true, enabled: pg.idOn, setEnabled: v => (pg.idOn = v) }),
    textField({ name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default input classes.', value: pg.inputClass, onChange: v => (pg.inputClass = v), clearable: true, enabled: pg.inputClassOn, setEnabled: v => (pg.inputClassOn = v) }),
    textField({ name: 'inputStyle', type: 'string?', defaultValue: '—', note: 'Inline style appended after the size metrics; sizes the field at runtime.', value: pg.inputStyle, onChange: v => (pg.inputStyle = v), clearable: true, enabled: pg.inputStyleOn, setEnabled: v => (pg.inputStyleOn = v) }),
    textField({ name: 'inputmode', type: 'string?', defaultValue: '—', note: 'Native inputmode; NumberInput drives numeric/decimal.', value: pg.inputmode, onChange: v => (pg.inputmode = v), clearable: true, enabled: pg.inputmodeOn, setEnabled: v => (pg.inputmodeOn = v) }),
    snippetField({
      name: 'leading',
      note: 'Adornment block rendered before the text, positioned inside the frame.',
      value: pg.leading,
      onChange: value => ((pg.leading = value), (pg.leadingEnabled = true)),
      toggle: snippetToggle(pg.leadingEnabled, enabled => (pg.leadingEnabled = enabled)),
    }),
    textField({ name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name.', value: pg.name, onChange: v => (pg.name = v), clearable: true, enabled: pg.nameOn, setEnabled: v => (pg.nameOn = v) }),
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', value: pg.placeholder, onChange: v => (pg.placeholder = v), clearable: true, enabled: pg.placeholderOn, setEnabled: v => (pg.placeholderOn = v) }),
    boolField({ name: 'readonly', defaultValue: 'false', note: 'Read-only input.', value: pg.readonly, onChange: v => (pg.readonly = v as TriState), enabled: pg.readonlyOn, setEnabled: v => (pg.readonlyOn = v) }),
    boolField({ name: 'required', defaultValue: 'false', note: 'Native required flag.', value: pg.required, onChange: v => (pg.required = v as TriState), enabled: pg.requiredOn, setEnabled: v => (pg.requiredOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    snippetField({
      name: 'trailer',
      note: 'Content rendered outside the field, after it, in a size-scaled row.',
      value: pg.trailer,
      onChange: value => ((pg.trailer = value), (pg.trailerEnabled = true)),
      toggle: snippetToggle(pg.trailerEnabled, enabled => (pg.trailerEnabled = enabled)),
    }),
    snippetField({
      name: 'trailing',
      note: 'Adornment block rendered after the text, positioned inside the frame.',
      value: pg.trailing,
      onChange: value => ((pg.trailing = value), (pg.trailingEnabled = true)),
      toggle: snippetToggle(pg.trailingEnabled, enabled => (pg.trailingEnabled = enabled)),
    }),
    textField({ name: 'type', type: 'string?', defaultValue: "'text'", note: 'Native input type; PasswordInput and SearchInput drive it.', value: pg.type, onChange: v => (pg.type = v), editorDefaultValue: 'text', clearable: true, placeholder: 'text', enabled: pg.typeOn, setEnabled: v => (pg.typeOn = v) }),
    {
      name: 'value',
      type: 'string',
      defaultValue: '—',
      note: 'Bindable field value; the eye resets it to empty.',
      editor: 'text',
      clearable: true,
      value: pg.value,
      onChange: value => {
        pg.value = value
        pg.valueOn = true
      },
      toggle: resetToggle(
        pg.valueOn,
        enabled => (pg.valueOn = enabled),
        () => (pg.value = ''),
      ),
      sync: { kind: 'script' },
    },
    enumField({ name: 'variant', type: "'bordered' | 'embedded'", defaultValue: "'bordered'", note: 'Chrome variant; embedded drops the border, the background, and the focus ring for a field rendered inside another surface.', options: variantOptions, value: pg.variant, onChange: v => (pg.variant = v), placeholder: 'bordered', clearLabel: 'Clear variant', enabled: pg.variantOn, setEnabled: v => (pg.variantOn = v) }),
    textField({ name: 'wrapperStyle', type: 'string?', defaultValue: '—', note: 'Metric custom properties for the adornments, set on the wrapping frame.', value: pg.wrapperStyle, onChange: v => (pg.wrapperStyle = v), clearable: true, enabled: pg.wrapperStyleOn, setEnabled: v => (pg.wrapperStyleOn = v) }),
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
  <span class={LEADING_SPAN}>{pg.leading}</span>
{/snippet}

{#snippet demoTrailing()}
  <span class={TRAILING_SPAN}>{pg.trailing}</span>
{/snippet}

{#snippet demoTrailer()}
  <span class={TRAILER_SPAN}>{pg.trailer}</span>
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
        bind:value={pg.value}
        bind:inputRef={demoInputRef}
        ariaLabel={demoAriaLabel}
        placeholder={pg.placeholderOn && pg.placeholder ? pg.placeholder : undefined}
        size={demoSize}
        {disabled}
        {readonly}
        {required}
        hideOutline={hideOutline}
        id={pg.idOn && pg.id ? pg.id : undefined}
        type={pg.typeOn && pg.type ? pg.type : undefined}
        autocomplete={demoAutocomplete}
        inputmode={demoInputmode}
        name={pg.nameOn && pg.name ? pg.name : undefined}
        inputClass={pg.inputClassOn && pg.inputClass ? pg.inputClass : undefined}
        variant={demoVariant}
        inputStyle={pg.inputStyleOn && pg.inputStyle ? pg.inputStyle : undefined}
        wrapperStyle={pg.wrapperStyleOn && pg.wrapperStyle ? pg.wrapperStyle : undefined}
        className={demoClassName}
        {clearable}
        clearLabel={demoClearLabel}
        clearPlacement={demoClearPlacement}
        defaultValue={demoDefaultValue}
        leading={pg.leadingEnabled && pg.leading ? demoLeading : undefined}
        trailing={pg.trailingEnabled && pg.trailing ? demoTrailing : undefined}
        trailer={pg.trailerEnabled && pg.trailer ? demoTrailer : undefined} />
      <span class="text-sm text-slate-400">value: {pg.value || '—'}</span>
    </div>
  </ShowcasePage>
