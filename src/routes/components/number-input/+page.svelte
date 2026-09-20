<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import NumberInput from '$lib/components/NumberInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { STEPLESS_CLASS, buildNumberInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  // Steppers is a preset that fills the controls + className fields below.
  let pgValue = $state('5')
  let pgMin = $state('')
  let pgMax = $state('')
  let pgStep = $state('')
  let pgPlaceholder = $state('')
  let pgDisabled = $state<TriState>('')
  let pgStepless = $state('')
  let pgShowControls = $state<TriState>('')
  let pgClassName = $state('')

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

  const min = $derived(asNumber(pgMin))
  const max = $derived(asNumber(pgMax))
  const step = $derived(asNumber(pgStep))
  const disabled = $derived(flagOn(pgDisabled))
  const showControls = $derived(flagOn(pgShowControls))
  const demoClassName = $derived(pgClassName || undefined)

  const steppersOptions = [{ value: 'yes', label: 'Hide steppers' }]
  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(
    pgMin !== '' ||
      pgMax !== '' ||
      pgStep !== '' ||
      pgPlaceholder !== '' ||
      pgDisabled !== '' ||
      pgStepless !== '' ||
      pgShowControls !== '' ||
      pgClassName !== ''
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgValue = '5'
    pgMin = ''
    pgMax = ''
    pgStep = ''
    pgPlaceholder = ''
    pgDisabled = ''
    pgStepless = ''
    pgShowControls = ''
    pgClassName = ''
  }

  const code = $derived.by(() =>
    buildNumberInputSnippet({
      min: pgMin,
      max: pgMax,
      step: pgStep,
      placeholder: pgPlaceholder,
      disabled: pgDisabled,
      showControls: pgShowControls,
      className: pgClassName,
    })
  )

  const props: PropRow[] = [
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value.' },
    { name: 'min', type: 'number', defaultValue: '—', note: 'Lower clamp on blur and step.' },
    { name: 'max', type: 'number', defaultValue: '—', note: 'Upper clamp on blur and step.' },
    { name: 'step', type: 'number', defaultValue: '1', note: 'Arrow/wheel step; decimals preserved.' },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Native placeholder.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input and steppers.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the input.' },
    { name: 'showControls', type: 'boolean', defaultValue: 'true', note: 'Renders the stepper buttons.' },
    { name: 'inputStyle', type: 'string', defaultValue: '—', note: 'Inline style for the input; widths the field when steppers are hidden.' },
    { name: 'id', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.' },
    { name: 'incrementLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the up button.' },
    { name: 'decrementLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the down button.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon className="h-4 w-4" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>
      Reset
    </Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Min" htmlFor="pg-min">
      <NumberInput
        id="pg-min"
        bind:value={pgMin}
        ariaLabel="Min"
        showControls={false}
        className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-400" />
    </FormField>
    <FormField label="Max" htmlFor="pg-max">
      <NumberInput
        id="pg-max"
        bind:value={pgMax}
        ariaLabel="Max"
        showControls={false}
        className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-400" />
    </FormField>
    <FormField label="Step" htmlFor="pg-step">
      <NumberInput
        id="pg-step"
        bind:value={pgStep}
        ariaLabel="Step"
        showControls={false}
        className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-400" />
    </FormField>
    <FormField label="Placeholder" htmlFor="pg-placeholder">
      <input
        id="pg-placeholder"
        bind:value={pgPlaceholder}
        placeholder="0"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Disabled">
      <SelectDropdown
        buttonLabel={triLabel(pgDisabled)}
        activeValue={pgDisabled}
        ariaLabel="Disabled"
        options={yesNoOptions}
        onSelect={value => (pgDisabled = value as TriState)}
        clearable
        clearLabel="Clear disabled"
        onClear={() => (pgDisabled = '')} />
    </FormField>
    <FormField label="Steppers">
      <SelectDropdown
        buttonLabel={pgStepless ? 'Hide steppers' : 'Default'}
        activeValue={pgStepless}
        ariaLabel="Steppers"
        options={steppersOptions}
        onSelect={value => {
          pgStepless = value
          pgShowControls = 'no'
          pgClassName = STEPLESS_CLASS
        }}
        clearable
        clearLabel="Clear steppers"
        onClear={() => {
          pgStepless = ''
          pgShowControls = ''
          pgClassName = ''
        }} />
    </FormField>
    <FormField label="Show controls">
      <SelectDropdown
        buttonLabel={triLabel(pgShowControls)}
        activeValue={pgShowControls}
        ariaLabel="Show controls"
        options={yesNoOptions}
        onSelect={value => (pgShowControls = value as TriState)}
        clearable
        clearLabel="Clear show controls"
        onClear={() => (pgShowControls = '')} />
    </FormField>
    <FormField label="Class name" htmlFor="pg-classname">
      <input
        id="pg-classname"
        bind:value={pgClassName}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="NumberInput" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    code={code}
    footer={settingsPanel}
    scope={{ value: pgValue, applyLabel: i18n.t('common.apply') }}>
    <div class="flex flex-col gap-1">
      <NumberInput
        bind:value={pgValue}
        ariaLabel={i18n.t('common.apply')}
        min={min}
        max={max}
        step={step}
        placeholder={pgPlaceholder || undefined}
        disabled={disabled}
        showControls={showControls}
        className={demoClassName} />
      <span class="text-sm text-slate-400">value: {pgValue}</span>
    </div>
  </ShowcaseSection>
</ShowcasePage>
