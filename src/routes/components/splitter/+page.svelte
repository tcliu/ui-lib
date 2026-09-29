<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import Splitter from '$lib/components/Splitter.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import ShowcaseStage from '$lib/showcase/ShowcaseStage.svelte'
  import {
    SPLITTER_MAIN,
    SPLITTER_PANE,
    SPLITTER_WRAPPER,
    buildSplitterSnippet,
    splitterPreset,
    type SplitterOrientation,
    type SplitterUnit,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgOrientation = $state('')
  let pgUnit = $state('')
  let pgAriaLabel = $state('')
  // Divider position: interaction state, not a curated option, so it stays out
  // of isCustomized.
  let pgSplit = $state(160)

  const orientationOptions = [
    { value: 'vertical', label: 'Vertical' },
    { value: 'horizontal', label: 'Horizontal' },
  ]
  const unitOptions = [
    { value: 'px', label: 'px' },
    { value: '%', label: '%' },
  ]

  const orientation = $derived((pgOrientation || 'vertical') as SplitterOrientation)
  const unit = $derived((pgUnit || 'px') as SplitterUnit)
  const preset = $derived(splitterPreset(orientation, unit))

  const demoOrientation = $derived((pgOrientation || undefined) as SplitterOrientation | undefined)
  const demoUnit = $derived((pgUnit || undefined) as SplitterUnit | undefined)
  const demoAriaLabel = $derived(pgAriaLabel || undefined)

  // Switching orientation or unit changes the value's meaning, so reseed the
  // divider from the matching preset instead of leaving it out of range.
  function applyOrientation(value: string): void {
    pgOrientation = value
    pgSplit = splitterPreset((value || 'vertical') as SplitterOrientation, unit).value
  }

  function applyUnit(value: string): void {
    pgUnit = value
    pgSplit = splitterPreset(orientation, (value || 'px') as SplitterUnit).value
  }

  const isCustomized = $derived(pgOrientation !== '' || pgUnit !== '' || pgAriaLabel !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground(): void {
    pgOrientation = ''
    pgUnit = ''
    pgAriaLabel = ''
    pgSplit = 160
  }

  const code = $derived.by(() =>
    buildSplitterSnippet({
      orientation: pgOrientation as '' | SplitterOrientation,
      unit: pgUnit as '' | SplitterUnit,
      ariaLabel: pgAriaLabel,
    }),
  )

  const props: PropRow[] = [
    {
      name: 'value',
      type: 'number',
      defaultValue: '—',
      note: 'Divider position in pixels or percent; drive it from onChange.',
    },
    { name: 'min', type: 'number', defaultValue: '—', note: 'Lower clamp for the divider position.' },
    { name: 'max', type: 'number', defaultValue: '—', note: 'Upper clamp for the divider position.' },
    {
      name: 'onChange',
      type: '(value: number) => void',
      defaultValue: '—',
      note: 'Fires while dragging and on arrow-key nudges.',
    },
    {
      name: 'onDragEnd',
      type: '() => void',
      defaultValue: '—',
      note: 'Fires after a drag or keyboard nudge completes.',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      defaultValue: "i18n 'splitter.resize'",
      note: 'Accessible name for the separator.',
    },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the separator handle.' },
    { name: 'lineClass', type: 'string', defaultValue: "''", note: 'Extra classes for the visible divider line.' },
    {
      name: 'unit',
      type: "'px' | '%'",
      defaultValue: "'px'",
      note: 'Unit for the value, drag delta, and arrow-key step.',
    },
    {
      name: 'orientation',
      type: "'vertical' | 'horizontal'",
      defaultValue: "'vertical'",
      note: 'Vertical splits left/right; horizontal splits top/bottom.',
    },
    {
      name: 'invert',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Flips drag and arrow-key deltas for a pane anchored on the far side of the handle (right or bottom panes).',
    },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Orientation">
      <SelectDropdown
        buttonLabel={orientationOptions.find(option => option.value === pgOrientation)?.label ?? 'Default'}
        activeValue={pgOrientation}
        ariaLabel="Orientation"
        options={orientationOptions}
        onSelect={applyOrientation}
        clearable
        clearLabel="Clear orientation"
        onClear={() => applyOrientation('')} />
    </FormField>
    <FormField label="Unit">
      <SelectDropdown
        buttonLabel={unitOptions.find(option => option.value === pgUnit)?.label ?? 'Default'}
        activeValue={pgUnit}
        ariaLabel="Unit"
        options={unitOptions}
        onSelect={applyUnit}
        clearable
        clearLabel="Clear unit"
        onClear={() => applyUnit('')} />
    </FormField>
    <FormField label="Aria label" htmlFor="pg-splitter-label">
      <input
        id="pg-splitter-label"
        bind:value={pgAriaLabel}
        placeholder="Resize"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Splitter" props={propsSnippet} wide>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{
      initialSplit: pgSplit,
      leftLabel: i18n.t('appShell.leftPane'),
      rightLabel: i18n.t('appShell.rightPane'),
    }}>
    <ShowcaseStage paneClass="w-full" showHandle={false}>
      <div class={orientation === 'horizontal' ? `${SPLITTER_WRAPPER} flex-col` : SPLITTER_WRAPPER}>
        <div
          class={SPLITTER_PANE}
          style={orientation === 'horizontal' ? `height:${pgSplit}${unit}` : `width:${pgSplit}${unit}`}>
          {i18n.t('appShell.leftPane')}
        </div>
        <Splitter
          value={pgSplit}
          min={preset.min}
          max={preset.max}
          onChange={next => (pgSplit = next)}
          orientation={demoOrientation}
          unit={demoUnit}
          ariaLabel={demoAriaLabel} />
        <div class={SPLITTER_MAIN}>{i18n.t('appShell.rightPane')}</div>
      </div>
    </ShowcaseStage>
  </ShowcaseSection>
</ShowcasePage>
