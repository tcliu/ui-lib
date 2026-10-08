<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Checkbox from '$lib/components/Checkbox.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import NumberInput from '$lib/components/NumberInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { extractComponentAttributes, extractScriptValue } from '$lib/showcase/snippet-attributes'
  import { splitLeadingScript } from '$lib/showcase/snippet-source'
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

  // Compact field chrome for the stepless min/max/step editors below.
  const FIELD_CLASS =
    'h-9 rounded-md border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-400'

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
      value: pgValue,
      min: pgMin,
      max: pgMax,
      step: pgStep,
      placeholder: pgPlaceholder,
      disabled: pgDisabled,
      showControls: pgShowControls,
      className: pgClassName,
    }),
  )

  // The page owns the preview so its code toggle can sit in the component-title
  // row (ShowcasePage's `actions`) while the section renders the demo and the
  // editor below.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ applyLabel: i18n.t('common.apply') }),
    onCompiled: syncPlaygroundFromSnippet,
  })

  // Write a compiled snippet's recognized demo-tag attributes back into
  // playground state, so snippet edits show up in the Value column. Only
  // canonical shapes map (literals, bare flags, `{true}`/`{false}`, and
  // numeric expressions for the bounds); custom expressions are left alone,
  // and a draft without a complete demo tag (a free-form experiment) touches
  // nothing. Absent means unset, matching what the builder omits. `syncSeed`
  // then holds the regenerated seed back so the editor keeps the user's text.
  function syncPlaygroundFromSnippet(source: string) {
    const attrs = extractComponentAttributes(source, 'NumberInput')
    if (!attrs) {
      return
    }
    const text = (name: string): string | undefined => {
      if (!attrs.has(name)) {
        return ''
      }
      const attr = attrs.get(name)!
      return attr.kind === 'string' ? attr.value : undefined
    }
    const tri = (name: string): TriState | undefined => {
      if (!attrs.has(name)) {
        return ''
      }
      const attr = attrs.get(name)!
      if (attr.kind === 'bare') {
        return 'yes'
      }
      if (attr.kind === 'expression' && (attr.value === 'true' || attr.value === 'false')) {
        return attr.value === 'true' ? 'yes' : 'no'
      }
      return undefined
    }
    const number = (name: string): string | undefined => {
      if (!attrs.has(name)) {
        return ''
      }
      const attr = attrs.get(name)!
      if (attr.kind === 'expression' && /^-?\d+(\.\d+)?$/.test(attr.value)) {
        return attr.value
      }
      return undefined
    }
    const applyText = (name: string, assign: (value: string) => void) => {
      const next = text(name)
      if (next !== undefined) {
        assign(next)
      }
    }
    const applyTri = (name: string, assign: (value: TriState) => void) => {
      const next = tri(name)
      if (next !== undefined) {
        assign(next)
      }
    }
    const applyNumber = (name: string, assign: (value: string) => void) => {
      const next = number(name)
      if (next !== undefined) {
        assign(next)
      }
    }
    applyNumber('min', value => (pgMin = value))
    applyNumber('max', value => (pgMax = value))
    applyNumber('step', value => (pgStep = value))
    applyText('placeholder', value => (pgPlaceholder = value))
    applyText('className', value => (pgClassName = value))
    applyTri('disabled', value => (pgDisabled = value))
    applyTri('showControls', value => (pgShowControls = value))
    // The builder seeds the value as script-local state; a hand-written
    // `bind:value={...}` shape leaves the playground alone.
    const scriptValue = extractScriptValue(splitLeadingScript(source).declarations, 'value')
    if (scriptValue !== null) {
      pgValue = scriptValue
    }
    preview.syncSeed()
  }

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const props: PropRow[] = [
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the input.' },
    { name: 'decrementLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the down button.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input and steppers.' },
    { name: 'id', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'incrementLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the up button.' },
    { name: 'inputStyle', type: 'string', defaultValue: '—', note: 'Inline style for the input; widths the field when steppers are hidden.' },
    { name: 'max', type: 'number', defaultValue: '—', note: 'Upper clamp on blur and step.' },
    { name: 'min', type: 'number', defaultValue: '—', note: 'Lower clamp on blur and step.' },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Native placeholder.' },
    { name: 'showControls', type: 'boolean', defaultValue: 'true', note: 'Renders the stepper buttons.' },
    { name: 'step', type: 'number', defaultValue: '1', note: 'Arrow/wheel step; decimals preserved.' },
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value.' },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet codeIcon()}
  <CodeIcon size="sm" />
{/snippet}

{#snippet pageActions()}
  <Button
    variant="ghost"
    size="sm"
    icon={codeIcon}
    ariaLabel={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    ariaExpanded={preview.open}
    tooltip={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    onClick={() => preview.toggle()} />
{/snippet}

{#snippet propValue(row: PropRow)}
  {#if row.name === 'value'}
    <TextInput bind:value={pgValue} ariaLabel="value value" />
  {:else if row.name === 'min'}
    <NumberInput bind:value={pgMin} ariaLabel="min value" showControls={false} className={FIELD_CLASS} />
  {:else if row.name === 'max'}
    <NumberInput bind:value={pgMax} ariaLabel="max value" showControls={false} className={FIELD_CLASS} />
  {:else if row.name === 'step'}
    <NumberInput bind:value={pgStep} ariaLabel="step value" showControls={false} className={FIELD_CLASS} />
  {:else if row.name === 'placeholder'}
    <TextInput bind:value={pgPlaceholder} ariaLabel="placeholder value" placeholder="0" />
  {:else if row.name === 'disabled'}
    <Checkbox
      checked={disabled ?? false}
      ariaLabel="disabled value"
      onChange={value => (pgDisabled = value ? 'yes' : 'no')} />
  {:else if row.name === 'showControls'}
    <Checkbox
      checked={showControls ?? true}
      ariaLabel="showControls value"
      onChange={value => (pgShowControls = value ? 'yes' : 'no')} />
  {:else if row.name === 'className'}
    <TextInput bind:value={pgClassName} ariaLabel="className value" placeholder="(none)" />
  {:else}
    <span class="text-slate-500">—</span>
  {/if}
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} value={propValue} />
{/snippet}

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; the
    steppers preset below drives two props at once (a composite preset), so it
    stays here with Reset. -->
  <div class="flex flex-col gap-3">
    <Buttons className="flex shrink-0 flex-wrap items-center gap-3">
      <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
    </Buttons>
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
    </div>
  </div>
{/snippet}

<ShowcasePage name="NumberInput" props={propsSnippet} actions={pageActions}>
  <ShowcaseSection
    title="NumberInput"
    {code}
    {preview}
    showHeader={false}
    bordered={false}
    footer={settingsPanel}
    scope={{ applyLabel: i18n.t('common.apply') }}>
    <div class="flex flex-col gap-1">
      <NumberInput
        bind:value={pgValue}
        ariaLabel={i18n.t('common.apply')}
        {min}
        {max}
        {step}
        placeholder={pgPlaceholder || undefined}
        {disabled}
        {showControls}
        className={demoClassName} />
      <span class="text-sm text-slate-400">value: {pgValue}</span>
    </div>
  </ShowcaseSection>
</ShowcasePage>
