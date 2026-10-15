<script lang="ts">
  import FormField from '$lib/components/FormField.svelte'
  import NumberInput from '$lib/components/NumberInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetToggle, resetToggle } from '$lib/showcase/snippet-field'
  import { STEPLESS_CLASS, buildNumberInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // Steppers is a preset that fills the controls + className fields below.
  let pgValue = $state('5')
  let pgValueOn = $state(true)
  let pgAriaLabel = $state('Apply')
  let pgAriaLabelOn = $state(true)
  let pgMin = $state('')
  let pgMinOn = $state(false)
  let pgMax = $state('')
  let pgMaxOn = $state(false)
  let pgStep = $state('1')
  let pgStepOn = $state(false)
  let pgPlaceholder = $state('')
  let pgPlaceholderOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgDisabled = $state<TriState>('no')
  let pgDisabledOn = $state(false)
  let pgStepless = $state('')
  let pgClearable = $state<TriState>('no')
  let pgClearableOn = $state(false)
  let pgClearLabel = $state('Clear')
  let pgClearLabelOn = $state(false)
  let pgClearPlacement = $state('auto')
  let pgClearPlacementOn = $state(false)
  let pgDefaultValue = $state('')
  let pgDefaultValueOn = $state(false)
  let pgShowControls = $state<TriState>('yes')
  let pgShowControlsOn = $state(true)
  let pgDecrementLabel = $state('')
  let pgDecrementLabelOn = $state(false)
  let pgIncrementLabel = $state('')
  let pgIncrementLabelOn = $state(false)
  let pgId = $state('')
  let pgIdOn = $state(false)
  let pgInputStyle = $state('')
  let pgInputStyleOn = $state(false)
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  function asNumber(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const min = $derived(pgMinOn ? asNumber(pgMin) : undefined)
  const max = $derived(pgMaxOn ? asNumber(pgMax) : undefined)
  const step = $derived(pgStepOn ? asNumber(pgStep) : undefined)
  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const disabled = $derived(pgDisabledOn ? flagOn(pgDisabled) : undefined)
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const showControls = $derived(pgShowControlsOn ? flagOn(pgShowControls) : undefined)
  const clearable = $derived(pgClearableOn ? flagOn(pgClearable) : undefined)
  const demoAriaLabel = $derived(pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : i18n.t('common.apply'))
  const demoClearLabel = $derived(pgClearLabelOn && pgClearLabel ? pgClearLabel : undefined)
  const demoClearPlacement = $derived(
    pgClearPlacementOn
      ? ((pgClearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pgDefaultValueOn && pgDefaultValue ? pgDefaultValue : undefined)
  const demoClassName = $derived(pgClassNameOn && pgClassName ? pgClassName : undefined)

  const steppersOptions = [{ value: 'yes', label: 'Hide steppers' }]

  function clearPlayground() {
    pgValue = '5'
    pgValueOn = true
    pgAriaLabel = 'Apply'
    pgAriaLabelOn = true
    pgMin = ''
    pgMinOn = false
    pgMax = ''
    pgMaxOn = false
    pgStep = '1'
    pgStepOn = false
    pgPlaceholder = ''
    pgPlaceholderOn = false
    pgSize = 'md'
    pgSizeOn = false
    pgDisabled = 'no'
    pgDisabledOn = false
    pgStepless = ''
    pgClearable = 'no'
    pgClearableOn = false
    pgClearLabel = 'Clear'
    pgClearLabelOn = false
    pgClearPlacement = 'auto'
    pgClearPlacementOn = false
    pgDefaultValue = ''
    pgDefaultValueOn = false
    pgShowControls = 'yes'
    pgShowControlsOn = true
    pgDecrementLabel = ''
    pgDecrementLabelOn = false
    pgIncrementLabel = ''
    pgIncrementLabelOn = false
    pgId = ''
    pgIdOn = false
    pgInputStyle = ''
    pgInputStyleOn = false
    pgClassName = ''
    pgClassNameOn = false
  }

  const code = $derived.by(() =>
    buildNumberInputSnippet({
      value: pgValue,
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      min: pgMin,
      minOn: pgMinOn,
      max: pgMax,
      maxOn: pgMaxOn,
      step: pgStep,
      stepOn: pgStepOn,
      placeholder: pgPlaceholder,
      placeholderOn: pgPlaceholderOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      disabled: pgDisabled,
      disabledOn: pgDisabledOn,
      showControls: pgShowControls,
      showControlsOn: pgShowControlsOn,
      clearable: pgClearable,
      clearableOn: pgClearableOn,
      clearLabel: pgClearLabel,
      clearLabelOn: pgClearLabelOn,
      clearPlacement: pgClearPlacement,
      clearPlacementOn: pgClearPlacementOn,
      defaultValue: pgDefaultValue,
      defaultValueOn: pgDefaultValueOn,
      decrementLabel: pgDecrementLabel,
      decrementLabelOn: pgDecrementLabelOn,
      incrementLabel: pgIncrementLabel,
      incrementLabelOn: pgIncrementLabelOn,
      id: pgId,
      idOn: pgIdOn,
      inputStyle: pgInputStyle,
      inputStyleOn: pgInputStyleOn,
      className: pgClassName,
      classNameOn: pgClassNameOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ applyLabel: i18n.t('common.apply') }),
    sync: { tag: 'NumberInput', getFields: () => syncFields },
  })

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the control; the eye stages the customization.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the input; the eye stages the customization.', editor: 'text', clearable: true, value: pgClassName, onChange: value => { pgClassName = value; pgClassNameOn = true; }, toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", editorDefaultValue: 'Clear', note: 'Accessible name for the clear button; the eye stages the customization.', editor: 'text', clearable: true, value: pgClearLabel, onChange: value => { pgClearLabel = value; pgClearLabelOn = true; }, toggle: snippetToggle(pgClearLabelOn, enabled => (pgClearLabelOn = enabled)), placeholder: 'Clear', sync: { kind: 'text' } },
    { name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside sits left of the steppers; outside sits after them; auto renders outside because the steppers own the right edge; the eye stages the customization.', editor: 'enum', options: clearPlacementOptions, value: pgClearPlacement, onChange: value => { pgClearPlacement = value; pgClearPlacementOn = true; }, placeholder: 'auto', clearLabel: 'Clear placement', toggle: snippetToggle(pgClearPlacementOn, enabled => (pgClearPlacementOn = enabled)), sync: { kind: 'text' } },
    { name: 'clearable', type: 'boolean', defaultValue: 'false', note: 'Appends a cross button that clears the value; the eye stages the customization.', editor: 'boolean', value: pgClearable, onChange: value => { pgClearable = value as TriState; pgClearableOn = true; }, toggle: snippetToggle(pgClearableOn, enabled => (pgClearableOn = enabled)), sync: { kind: 'tri' } },
    { name: 'decrementLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the down button; the eye stages the customization.', editor: 'text', clearable: true, value: pgDecrementLabel, onChange: value => { pgDecrementLabel = value; pgDecrementLabelOn = true; }, toggle: snippetToggle(pgDecrementLabelOn, enabled => (pgDecrementLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'defaultValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Baseline the clear button compares against; the cross hides while the value matches it; the eye stages the customization.', editor: 'text', clearable: true, value: pgDefaultValue, onChange: value => { pgDefaultValue = value; pgDefaultValueOn = true; }, toggle: snippetToggle(pgDefaultValueOn, enabled => (pgDefaultValueOn = enabled)), sync: { kind: 'text' } },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input and steppers; the eye stages the customization.', editor: 'boolean', value: pgDisabled, onChange: value => { pgDisabled = value as TriState; pgDisabledOn = true; }, toggle: snippetToggle(pgDisabledOn, enabled => (pgDisabledOn = enabled)), sync: { kind: 'tri' } },
    { name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id; the eye stages the customization.', editor: 'text', clearable: true, value: pgId, onChange: value => { pgId = value; pgIdOn = true; }, toggle: snippetToggle(pgIdOn, enabled => (pgIdOn = enabled)), sync: { kind: 'text' } },
    { name: 'incrementLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the up button; the eye stages the customization.', editor: 'text', clearable: true, value: pgIncrementLabel, onChange: value => { pgIncrementLabel = value; pgIncrementLabelOn = true; }, toggle: snippetToggle(pgIncrementLabelOn, enabled => (pgIncrementLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'inputStyle', type: 'string?', defaultValue: '—', note: 'Inline style for the input; widths the field when steppers are hidden; the eye stages the customization.', editor: 'text', clearable: true, value: pgInputStyle, onChange: value => { pgInputStyle = value; pgInputStyleOn = true; }, toggle: snippetToggle(pgInputStyleOn, enabled => (pgInputStyleOn = enabled)), sync: { kind: 'text' } },
    { name: 'max', type: 'number?', defaultValue: '—', note: 'Upper clamp on blur and step; the eye stages the customization.', editor: 'number', clearable: true, value: pgMax, onChange: value => { pgMax = value; pgMaxOn = true; }, toggle: snippetToggle(pgMaxOn, enabled => (pgMaxOn = enabled)), sync: { kind: 'number' } },
    { name: 'min', type: 'number?', defaultValue: '—', note: 'Lower clamp on blur and step; the eye stages the customization.', editor: 'number', clearable: true, value: pgMin, onChange: value => { pgMin = value; pgMinOn = true; }, toggle: snippetToggle(pgMinOn, enabled => (pgMinOn = enabled)), sync: { kind: 'number' } },
    { name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder; the eye stages the customization.', editor: 'text', clearable: true, value: pgPlaceholder, onChange: value => { pgPlaceholder = value; pgPlaceholderOn = true; }, toggle: snippetToggle(pgPlaceholderOn, enabled => (pgPlaceholderOn = enabled)), sync: { kind: 'text' } },
    { name: 'showControls', type: 'boolean', defaultValue: 'true', note: 'Renders the stepper buttons; the eye stages the customization.', editor: 'boolean', value: pgShowControls, onChange: value => { pgShowControls = value as TriState; pgShowControlsOn = true; }, toggle: snippetToggle(pgShowControlsOn, enabled => (pgShowControlsOn = enabled)), sync: { kind: 'tri' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Control scale; numbers are icon-scale pixels scaled by fixed ratios; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', placeholder: 'md', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'text' } },
    { name: 'step', type: 'number?', defaultValue: '1', editorDefaultValue: '1', note: 'Arrow/wheel step; decimals preserved; the eye stages the customization.', editor: 'number', clearable: true, value: pgStep, onChange: value => { pgStep = value; pgStepOn = true; }, placeholder: '1', toggle: snippetToggle(pgStepOn, enabled => (pgStepOn = enabled)), sync: { kind: 'number' } },
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value; the eye resets it to 5.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: resetToggle(pgValueOn, enabled => (pgValueOn = enabled), () => (pgValue = '5')), sync: { kind: 'script' } },
    { name: 'onClear', type: '() => void', defaultValue: 'clears value', note: 'Clear handler; falls back to clearing the bound value when omitted.' },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))
</script>

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; the
    steppers preset below drives two props at once (a composite preset), so it
    stays here. -->
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Steppers">
      <SelectDropdown
        buttonLabel={pgStepless ? 'Hide steppers' : 'Default'}
        activeValue={pgStepless}
        ariaLabel="Steppers"
        options={steppersOptions}
        onSelect={value => {
          pgStepless = value
          pgShowControls = 'no'
          pgShowControlsOn = true
          pgClassName = STEPLESS_CLASS
          pgClassNameOn = true
        }}
        clearable
        clearLabel="Clear steppers"
        onClear={() => {
          pgStepless = ''
          pgShowControls = 'yes'
          pgShowControlsOn = false
          pgClassName = ''
          pgClassNameOn = false
        }} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage
    {fields}
    title="NumberInput"
    {code}
    {preview}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{ applyLabel: i18n.t('common.apply') }}
>
    <div class="flex flex-col gap-1">
      <NumberInput
        bind:value={pgValue}
        ariaLabel={demoAriaLabel}
        {min}
        {max}
        {step}
        decrementLabel={pgDecrementLabelOn && pgDecrementLabel ? pgDecrementLabel : undefined}
        incrementLabel={pgIncrementLabelOn && pgIncrementLabel ? pgIncrementLabel : undefined}
        id={pgIdOn && pgId ? pgId : undefined}
        inputStyle={pgInputStyleOn && pgInputStyle ? pgInputStyle : undefined}
        placeholder={pgPlaceholderOn && pgPlaceholder ? pgPlaceholder : undefined}
        size={demoSize}
        {disabled}
        {showControls}
        {clearable}
        clearLabel={demoClearLabel}
        clearPlacement={demoClearPlacement}
        defaultValue={demoDefaultValue}
        className={demoClassName} />
      <span class="text-sm text-slate-400">value: {pgValue}</span>
    </div>
  </ShowcasePage>
