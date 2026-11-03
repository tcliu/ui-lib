<script lang="ts">
  import FormField from '#lib/components/FormField.svelte'
  import NumberInput, { NUMBER_INPUT_RATIOS } from '#lib/components/NumberInput.svelte'
  import SelectDropdown from '#lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '#showcase/playground/size-input.js'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { enumField, textField, boolField, sizeField } from '#showcase/playground/snippet-field.js'
  import { appliedRatios, componentRatiosField } from '#showcase/playground/text-input-ratios.js'
  import { type TriState } from '#showcase/playground/snippet-build.js'
  import type { NumberInputRatioOverrides } from '#lib/components/NumberInput.svelte'
  import { buildNumberInputSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // Steppers is a preset that overrides the stepper and outline props below.
  const INITIAL = {
    value: staged('5', true),
    ariaLabel: staged('Apply', true),
    caretAtEnd: staged('no' as TriState),
    min: staged(''),
    max: staged(''),
    step: staged('1'),
    placeholder: staged(''),
    size: staged('md'),
    ratios: staged({} as NumberInputRatioOverrides),
    variant: staged('bordered'),
    disabled: staged('no' as TriState),
    hideOutline: staged('no' as TriState),
    stepless: '',
    clearable: staged('no' as TriState),
    clearLabel: staged('Clear'),
    clearPlacement: staged('auto'),
    defaultValue: staged(''),
    showControls: staged('yes' as TriState),
    decrementLabel: staged(''),
    incrementLabel: staged(''),
    id: staged(''),
    inputStyle: staged(''),
    className: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))

  function asNumber(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const min = $derived.by(() => {
    const value = applied(pg.min)
    return value === undefined ? undefined : asNumber(value)
  })
  const max = $derived.by(() => {
    const value = applied(pg.max)
    return value === undefined ? undefined : asNumber(value)
  })
  const step = $derived.by(() => {
    const value = applied(pg.step)
    return value === undefined ? undefined : asNumber(value)
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

  const disabled = $derived(appliedFlag(pg.disabled))
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoRatios = $derived(appliedRatios(pg.ratios))
  const showControls = $derived(appliedFlag(pg.showControls))
  const hideOutline = $derived(appliedFlag(pg.hideOutline))
  const demoVariant = $derived(
    (applied(pg.variant) || undefined) as 'bordered' | 'embedded' | undefined,
  )
  const clearable = $derived(appliedFlag(pg.clearable))
  const demoAriaLabel = $derived(applied(pg.ariaLabel) || i18n.t('common.apply'))
  const demoClearLabel = $derived(applied(pg.clearLabel) || undefined)
  const demoClearPlacement = $derived(
    (applied(pg.clearPlacement) || undefined) as 'auto' | 'inside' | 'outside' | undefined,
  )
  const demoDefaultValue = $derived(applied(pg.defaultValue) || undefined)
  const demoClassName = $derived(applied(pg.className) || undefined)

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
      caretAtEnd: pg.caretAtEnd,
      min: pg.min,
      max: pg.max,
      step: pg.step,
      placeholder: pg.placeholder,
      size: pg.size,
      ratios: pg.ratios,
      variant: pg.variant,
      disabled: pg.disabled,
      hideOutline: pg.hideOutline,
      showControls: pg.showControls,
      clearable: pg.clearable,
      clearLabel: pg.clearLabel,
      clearPlacement: pg.clearPlacement,
      defaultValue: pg.defaultValue,
      decrementLabel: pg.decrementLabel,
      incrementLabel: pg.incrementLabel,
      id: pg.id,
      inputStyle: pg.inputStyle,
      className: pg.className,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the control.', editor: 'text', clearable: true, ...eye(pg.ariaLabel), onChange: value => stage(pg.ariaLabel, value), toggle: eyeToggle(pg.ariaLabel), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    boolField({ name: 'caretAtEnd', defaultValue: 'false', note: 'Places the caret after the last character on focus and click instead of at the clicked position.', ...eyeFlag(pg.caretAtEnd) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the input.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', ...eye(pg.clearLabel) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside sits left of the steppers; outside sits after them; auto renders outside because the steppers own the right edge.', options: clearPlacementOptions, placeholder: 'auto', clearLabel: 'Clear placement', ...eye(pg.clearPlacement) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', ...eyeFlag(pg.clearable) }),
    textField({ name: 'decrementLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the down button.', clearable: true, ...eye(pg.decrementLabel) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', editorDefaultValue: '', clearable: true, ...eye(pg.defaultValue) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input and steppers.', ...eyeFlag(pg.disabled) }),
    boolField({ name: 'hideOutline', defaultValue: 'false', note: 'Drops the bordered field’s border and focus border while keeping its surface, padding, and text metrics.', ...eyeFlag(pg.hideOutline) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', clearable: true, ...eye(pg.id) }),
    textField({ name: 'incrementLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the up button.', clearable: true, ...eye(pg.incrementLabel) }),
    textField({ name: 'inputStyle', type: 'string?', defaultValue: '—', note: 'Inline style for the input; widths the field when steppers are hidden.', clearable: true, ...eye(pg.inputStyle) }),
    { name: 'max', type: 'number?', defaultValue: '—', note: 'Upper clamp on typing, blur, and step.', editor: 'number', clearable: true, ...eye(pg.max), onChange: value => stage(pg.max, value), toggle: eyeToggle(pg.max), sync: { kind: 'number' } },
    { name: 'min', type: 'number?', defaultValue: '—', note: 'Lower clamp on blur and step (and on typing when a longer entry could not fit).', editor: 'number', clearable: true, ...eye(pg.min), onChange: value => stage(pg.min, value), toggle: eyeToggle(pg.min), sync: { kind: 'number' } },
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', clearable: true, ...eye(pg.placeholder) }),
    componentRatiosField({ base: NUMBER_INPUT_RATIOS, type: 'NumberInputRatioOverrides?', note: 'Partial override of the field and stepper-column ratios; the line box follows the font.', value: pg.ratios }),
    boolField({ name: 'showControls', defaultValue: 'true', note: 'Renders the stepper buttons; hiding them leaves the box and chrome untouched.', ...eyeFlag(pg.showControls) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels scaled by fixed ratios.', ...eye(pg.size) }),
    { name: 'step', type: 'number?', defaultValue: '1', editorDefaultValue: '1', note: 'Arrow/wheel step; decimals preserved.', editor: 'number', clearable: true, ...eye(pg.step), onChange: value => stage(pg.step, value), placeholder: '1', toggle: eyeToggle(pg.step), sync: { kind: 'number' } },
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value; the eye resets it to 5.', editor: 'text', clearable: true, ...eye(pg.value), onChange: value => stage(pg.value, value), toggle: eyeResetToggle(pg.value, () => (pg.value.value = '5')), sync: { kind: 'script' } },
    enumField({ name: 'variant', type: "'bordered' | 'embedded'", defaultValue: "'bordered'", note: 'Bordered keeps the shared chrome and metrics whether or not the steppers render; embedded drops them so the caller’s class owns the box.', options: variantOptions, placeholder: 'bordered', clearLabel: 'Clear variant', ...eye(pg.variant) }),
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
          stage(pg.showControls, 'no')
          stage(pg.hideOutline, 'yes')
        }}
        clearable
        clearLabel="Clear steppers"
        onClear={() => {
          pg.stepless = ''
          pg.showControls.value = 'yes'
          pg.showControls.on = false
          pg.hideOutline.value = 'no'
          pg.hideOutline.on = false
        }} />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        activeValue={pg.size.value}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => stage(pg.size, value)}
        clearable
        clearLabel="Clear size"
        onClear={() => {
          pg.size.value = 'md'
          pg.size.on = false
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
        bind:value={pg.value.value}
        ariaLabel={demoAriaLabel}
        caretAtEnd={appliedFlag(pg.caretAtEnd)}
        {min}
        {max}
        {step}
        decrementLabel={applied(pg.decrementLabel) || undefined}
        incrementLabel={applied(pg.incrementLabel) || undefined}
        id={applied(pg.id) || undefined}
        inputStyle={applied(pg.inputStyle) || undefined}
        placeholder={applied(pg.placeholder) || undefined}
        size={demoSize}
        ratios={demoRatios}
        {disabled}
        {showControls}
        variant={demoVariant}
        hideOutline={hideOutline}
        {clearable}
        clearLabel={demoClearLabel}
        clearPlacement={demoClearPlacement}
        defaultValue={demoDefaultValue}
        className={demoClassName} />
      <span class="text-sm text-slate-400">value: {pg.value.value}</span>
    </div>
  </ShowcasePage>
