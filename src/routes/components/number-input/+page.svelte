<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import FormField from '$lib/components/FormField.svelte'
  import NumberInput from '$lib/components/NumberInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField, snippetToggle, resetToggle } from '$lib/showcase/snippet-field'
  import { buildNumberInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // Steppers is a preset that overrides the stepper and outline props below.
  const INITIAL = {
    value: '5',
    valueOn: true,
    ariaLabel: 'Apply',
    ariaLabelOn: true,
    caretAtEnd: 'no' as TriState,
    caretAtEndOn: false,
    min: '',
    minOn: false,
    max: '',
    maxOn: false,
    step: '1',
    stepOn: false,
    placeholder: '',
    placeholderOn: false,
    size: 'md',
    sizeOn: false,
    variant: 'bordered',
    variantOn: false,
    disabled: 'no' as TriState,
    disabledOn: false,
    hideOutline: 'no' as TriState,
    hideOutlineOn: false,
    stepless: '',
    clearable: 'no' as TriState,
    clearableOn: false,
    clearLabel: 'Clear',
    clearLabelOn: false,
    clearPlacement: 'auto',
    clearPlacementOn: false,
    defaultValue: '',
    defaultValueOn: false,
    showControls: 'yes' as TriState,
    showControlsOn: false,
    decrementLabel: '',
    decrementLabelOn: false,
    incrementLabel: '',
    incrementLabelOn: false,
    id: '',
    idOn: false,
    inputStyle: '',
    inputStyleOn: false,
    className: '',
    classNameOn: false,
  }
  let pg = $state(structuredClone(INITIAL))

  function asNumber(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const min = $derived(pg.minOn ? asNumber(pg.min) : undefined)
  const max = $derived(pg.maxOn ? asNumber(pg.max) : undefined)
  const step = $derived(pg.stepOn ? asNumber(pg.step) : undefined)
  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]
  const variantOptions = [
    { value: 'bordered', label: 'bordered' },
    { value: 'embedded', label: 'embedded' },
  ]

  const disabled = $derived(pg.disabledOn ? flagOn(pg.disabled) : undefined)
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const showControls = $derived(pg.showControlsOn ? flagOn(pg.showControls) : undefined)
  const hideOutline = $derived(pg.hideOutlineOn ? flagOn(pg.hideOutline) : undefined)
  const demoVariant = $derived(
    pg.variantOn ? ((pg.variant || undefined) as 'bordered' | 'embedded' | undefined) : undefined,
  )
  const clearable = $derived(pg.clearableOn ? flagOn(pg.clearable) : undefined)
  const demoAriaLabel = $derived(pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : i18n.t('common.apply'))
  const demoClearLabel = $derived(pg.clearLabelOn && pg.clearLabel ? pg.clearLabel : undefined)
  const demoClearPlacement = $derived(
    pg.clearPlacementOn
      ? ((pg.clearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pg.defaultValueOn && pg.defaultValue ? pg.defaultValue : undefined)
  const demoClassName = $derived(pg.classNameOn && pg.className ? pg.className : undefined)

  const steppersOptions = [{ value: 'yes', label: 'Hide steppers' }]

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
    { value: 'xl', label: 'xl' },
  ]

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildNumberInputSnippet({
      value: pg.value,
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      caretAtEnd: pg.caretAtEnd,
      caretAtEndOn: pg.caretAtEndOn,
      min: pg.min,
      minOn: pg.minOn,
      max: pg.max,
      maxOn: pg.maxOn,
      step: pg.step,
      stepOn: pg.stepOn,
      placeholder: pg.placeholder,
      placeholderOn: pg.placeholderOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      variant: pg.variant,
      variantOn: pg.variantOn,
      disabled: pg.disabled,
      disabledOn: pg.disabledOn,
      hideOutline: pg.hideOutline,
      hideOutlineOn: pg.hideOutlineOn,
      showControls: pg.showControls,
      showControlsOn: pg.showControlsOn,
      clearable: pg.clearable,
      clearableOn: pg.clearableOn,
      clearLabel: pg.clearLabel,
      clearLabelOn: pg.clearLabelOn,
      clearPlacement: pg.clearPlacement,
      clearPlacementOn: pg.clearPlacementOn,
      defaultValue: pg.defaultValue,
      defaultValueOn: pg.defaultValueOn,
      decrementLabel: pg.decrementLabel,
      decrementLabelOn: pg.decrementLabelOn,
      incrementLabel: pg.incrementLabel,
      incrementLabelOn: pg.incrementLabelOn,
      id: pg.id,
      idOn: pg.idOn,
      inputStyle: pg.inputStyle,
      inputStyleOn: pg.inputStyleOn,
      className: pg.className,
      classNameOn: pg.classNameOn,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the control.', editor: 'text', clearable: true, value: pg.ariaLabel, onChange: value => { pg.ariaLabel = value; pg.ariaLabelOn = true; }, toggle: snippetToggle(pg.ariaLabelOn, enabled => (pg.ariaLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    boolField({ name: 'caretAtEnd', defaultValue: 'false', note: 'Places the caret after the last character on focus and click instead of at the clicked position.', value: pg.caretAtEnd, onChange: v => (pg.caretAtEnd = v as TriState), enabled: pg.caretAtEndOn, setEnabled: v => (pg.caretAtEndOn = v) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the input.', value: pg.className, onChange: v => (pg.className = v), editorDefaultValue: '', clearable: true, enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', value: pg.clearLabel, onChange: v => (pg.clearLabel = v), editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', enabled: pg.clearLabelOn, setEnabled: v => (pg.clearLabelOn = v) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside sits left of the steppers; outside sits after them; auto renders outside because the steppers own the right edge.', options: clearPlacementOptions, value: pg.clearPlacement, onChange: v => (pg.clearPlacement = v), placeholder: 'auto', clearLabel: 'Clear placement', enabled: pg.clearPlacementOn, setEnabled: v => (pg.clearPlacementOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', value: pg.clearable, onChange: v => (pg.clearable = v as TriState), enabled: pg.clearableOn, setEnabled: v => (pg.clearableOn = v) }),
    textField({ name: 'decrementLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the down button.', value: pg.decrementLabel, onChange: v => (pg.decrementLabel = v), clearable: true, enabled: pg.decrementLabelOn, setEnabled: v => (pg.decrementLabelOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', value: pg.defaultValue, onChange: v => (pg.defaultValue = v), editorDefaultValue: '', clearable: true, enabled: pg.defaultValueOn, setEnabled: v => (pg.defaultValueOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input and steppers.', value: pg.disabled, onChange: v => (pg.disabled = v as TriState), enabled: pg.disabledOn, setEnabled: v => (pg.disabledOn = v) }),
    boolField({ name: 'hideOutline', defaultValue: 'false', note: 'Drops the bordered field’s border and focus border while keeping its surface, padding, and text metrics.', value: pg.hideOutline, onChange: v => (pg.hideOutline = v as TriState), enabled: pg.hideOutlineOn, setEnabled: v => (pg.hideOutlineOn = v) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', value: pg.id, onChange: v => (pg.id = v), clearable: true, enabled: pg.idOn, setEnabled: v => (pg.idOn = v) }),
    textField({ name: 'incrementLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the up button.', value: pg.incrementLabel, onChange: v => (pg.incrementLabel = v), clearable: true, enabled: pg.incrementLabelOn, setEnabled: v => (pg.incrementLabelOn = v) }),
    textField({ name: 'inputStyle', type: 'string?', defaultValue: '—', note: 'Inline style for the input; widths the field when steppers are hidden.', value: pg.inputStyle, onChange: v => (pg.inputStyle = v), clearable: true, enabled: pg.inputStyleOn, setEnabled: v => (pg.inputStyleOn = v) }),
    { name: 'max', type: 'number?', defaultValue: '—', note: 'Upper clamp on typing, blur, and step.', editor: 'number', clearable: true, value: pg.max, onChange: value => { pg.max = value; pg.maxOn = true; }, toggle: snippetToggle(pg.maxOn, enabled => (pg.maxOn = enabled)), sync: { kind: 'number' } },
    { name: 'min', type: 'number?', defaultValue: '—', note: 'Lower clamp on blur and step (and on typing when a longer entry could not fit).', editor: 'number', clearable: true, value: pg.min, onChange: value => { pg.min = value; pg.minOn = true; }, toggle: snippetToggle(pg.minOn, enabled => (pg.minOn = enabled)), sync: { kind: 'number' } },
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', value: pg.placeholder, onChange: v => (pg.placeholder = v), clearable: true, enabled: pg.placeholderOn, setEnabled: v => (pg.placeholderOn = v) }),
    boolField({ name: 'showControls', defaultValue: 'true', note: 'Renders the stepper buttons; hiding them leaves the box and chrome untouched.', value: pg.showControls, onChange: v => (pg.showControls = v as TriState), enabled: pg.showControlsOn, setEnabled: v => (pg.showControlsOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels scaled by fixed ratios.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'step', type: 'number?', defaultValue: '1', editorDefaultValue: '1', note: 'Arrow/wheel step; decimals preserved.', editor: 'number', clearable: true, value: pg.step, onChange: value => { pg.step = value; pg.stepOn = true; }, placeholder: '1', toggle: snippetToggle(pg.stepOn, enabled => (pg.stepOn = enabled)), sync: { kind: 'number' } },
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value; the eye resets it to 5.', editor: 'text', clearable: true, value: pg.value, onChange: value => { pg.value = value; pg.valueOn = true; }, toggle: resetToggle(pg.valueOn, enabled => (pg.valueOn = enabled), () => (pg.value = '5')), sync: { kind: 'script' } },
    enumField({ name: 'variant', type: "'bordered' | 'embedded'", defaultValue: "'bordered'", note: 'Bordered keeps the shared chrome and metrics whether or not the steppers render; embedded drops them so the caller’s class owns the box.', options: variantOptions, value: pg.variant, onChange: v => (pg.variant = v), placeholder: 'bordered', clearLabel: 'Clear variant', enabled: pg.variantOn, setEnabled: v => (pg.variantOn = v) }),
    { name: 'onClear', type: '() => void', defaultValue: 'clears value', note: 'Clear handler; falls back to clearing the bound value when omitted.' },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback.' },
  ])

</script>

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; the
    steppers preset below drives two props at once (a composite preset), so it
    stays here. -->
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Steppers">
      <SelectDropdown
        buttonLabel={pg.stepless ? 'Hide steppers' : 'Default'}
        activeValue={pg.stepless}
        ariaLabel="Steppers"
        options={steppersOptions}
        onSelect={value => {
          pg.stepless = value
          pg.showControls = 'no'
          pg.showControlsOn = true
          pg.hideOutline = 'yes'
          pg.hideOutlineOn = true
        }}
        clearable
        clearLabel="Clear steppers"
        onClear={() => {
          pg.stepless = ''
          pg.showControls = 'yes'
          pg.showControlsOn = false
          pg.hideOutline = 'no'
          pg.hideOutlineOn = false
        }} />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        activeValue={pg.size}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => {
          pg.size = value
          pg.sizeOn = true
        }}
        clearable
        clearLabel="Clear size"
        onClear={() => {
          pg.size = 'md'
          pg.sizeOn = false
        }} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage
    {fields}
    title="NumberInput"
    {code}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{ applyLabel: i18n.t('common.apply') }}

    sync={{ tag: 'NumberInput' }}
  >
    <div class="flex flex-col gap-1">
      <NumberInput
        bind:value={pg.value}
        ariaLabel={demoAriaLabel}
        caretAtEnd={pg.caretAtEndOn ? flagOn(pg.caretAtEnd) : undefined}
        {min}
        {max}
        {step}
        decrementLabel={pg.decrementLabelOn && pg.decrementLabel ? pg.decrementLabel : undefined}
        incrementLabel={pg.incrementLabelOn && pg.incrementLabel ? pg.incrementLabel : undefined}
        id={pg.idOn && pg.id ? pg.id : undefined}
        inputStyle={pg.inputStyleOn && pg.inputStyle ? pg.inputStyle : undefined}
        placeholder={pg.placeholderOn && pg.placeholder ? pg.placeholder : undefined}
        size={demoSize}
        {disabled}
        {showControls}
        variant={demoVariant}
        hideOutline={hideOutline}
        {clearable}
        clearLabel={demoClearLabel}
        clearPlacement={demoClearPlacement}
        defaultValue={demoDefaultValue}
        className={demoClassName} />
      <span class="text-sm text-slate-400">value: {pg.value}</span>
    </div>
  </ShowcasePage>
