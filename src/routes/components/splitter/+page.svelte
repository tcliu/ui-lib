<script lang="ts">
  import Splitter from '$lib/components/Splitter.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseStage from '$lib/showcase/ShowcaseStage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetToggle } from '$lib/showcase/snippet-field'
  import {
    SPLITTER_MAIN,
    SPLITTER_PANE,
    SPLITTER_WRAPPER,
    buildSplitterSnippet,
    parseSplitterBound,
    splitterPreset,
    type SplitterOrientation,
    type SplitterUnit,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  let pgOrientation = $state('vertical')
  let pgOrientationOn = $state(false)
  let pgUnit = $state('px')
  let pgUnitOn = $state(false)
  let pgAriaLabel = $state('')
  let pgAriaLabelOn = $state(false)
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)
  let pgLineClass = $state('')
  let pgLineClassOn = $state(false)
  let pgInvert = $state<TriState>('no')
  let pgInvertOn = $state(false)
  let pgMin = $state('')
  let pgMinOn = $state(true)
  let pgMax = $state('')
  let pgMaxOn = $state(true)
  // Divider position: interaction state, not a curated option.
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

  const demoOrientation = $derived(pgOrientationOn ? ((pgOrientation || undefined) as SplitterOrientation | undefined) : undefined)
  const demoUnit = $derived(pgUnitOn ? ((pgUnit || undefined) as SplitterUnit | undefined) : undefined)
  const demoAriaLabel = $derived(pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : undefined)
  const demoClassName = $derived(pgClassNameOn && pgClassName ? pgClassName : undefined)
  const demoLineClass = $derived(pgLineClassOn && pgLineClass ? pgLineClass : undefined)
  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }
  const demoInvert = $derived(pgInvertOn ? flagOn(pgInvert) : undefined)
  const demoMin = $derived(pgMinOn ? (parseSplitterBound(pgMin) ?? preset.min) : undefined)
  const demoMax = $derived(pgMaxOn ? (parseSplitterBound(pgMax) ?? preset.max) : undefined)
  const leftLabel = $derived(i18n.t('appShell.leftPane'))
  const rightLabel = $derived(i18n.t('appShell.rightPane'))

  // Switching orientation or unit changes the value's meaning, so reseed the
  // divider from the matching preset instead of leaving it out of range.
  function applyOrientation(value: string): void {
    pgOrientation = value
    pgOrientationOn = true
    pgSplit = splitterPreset((value || 'vertical') as SplitterOrientation, unit).value
  }

  function applyUnit(value: string): void {
    pgUnit = value
    pgUnitOn = true
    pgSplit = splitterPreset(orientation, (value || 'px') as SplitterUnit).value
  }

  function clearPlayground(): void {
    pgOrientation = 'vertical'
    pgOrientationOn = false
    pgUnit = 'px'
    pgUnitOn = false
    pgAriaLabel = ''
    pgAriaLabelOn = false
    pgClassName = ''
    pgClassNameOn = false
    pgLineClass = ''
    pgLineClassOn = false
    pgInvert = 'no'
    pgInvertOn = false
    pgMin = ''
    pgMinOn = true
    pgMax = ''
    pgMaxOn = true
    pgSplit = 160
  }

  // The divider is interaction state shared with the drag handle: empty or
  // non-numeric edits leave it alone instead of clobbering the drag position.
  function applySplit(text: string): void {
    if (text.trim() === '') return
    const parsed = Number(text)
    if (Number.isFinite(parsed)) pgSplit = parsed
  }

  const code = $derived.by(() =>
    buildSplitterSnippet({
      orientation: pgOrientation as '' | SplitterOrientation,
      orientationOn: pgOrientationOn,
      unit: pgUnit as '' | SplitterUnit,
      unitOn: pgUnitOn,
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      className: pgClassName,
      classNameOn: pgClassNameOn,
      lineClass: pgLineClass,
      lineClassOn: pgLineClassOn,
      invert: pgInvert,
      invertOn: pgInvertOn,
      min: pgMin,
      minOn: pgMinOn,
      max: pgMax,
      maxOn: pgMaxOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      initialSplit: pgSplit,
      leftLabel,
      rightLabel,
    }),
    sync: { tag: 'Splitter', getFields: () => syncFields },
  })

  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. Orientation
  // and unit reseed the divider through the same appliers as the demo, so
  // snippet edits stay in range too.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string?', defaultValue: "i18n 'splitter.resize'", note: 'Accessible name for the separator; the eye stages the customization.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the separator handle; the eye stages the customization.', editor: 'text', clearable: true, value: pgClassName, onChange: value => { pgClassName = value; pgClassNameOn = true; }, toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'invert', type: 'boolean', defaultValue: 'false', note: 'Flips drag and arrow-key deltas for a pane anchored on the far side of the handle (right or bottom panes); the eye stages the customization.', editor: 'boolean', value: pgInvert, onChange: value => { pgInvert = value as TriState; pgInvertOn = true; }, toggle: snippetToggle(pgInvertOn, enabled => (pgInvertOn = enabled)), sync: { kind: 'tri' } },
    { name: 'lineClass', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the visible divider line; the eye stages the customization.', editor: 'text', clearable: true, value: pgLineClass, onChange: value => { pgLineClass = value; pgLineClassOn = true; }, toggle: snippetToggle(pgLineClassOn, enabled => (pgLineClassOn = enabled)), sync: { kind: 'text' } },
    { name: 'max', type: 'number?', defaultValue: '—', note: 'Upper clamp for the divider position; unset follows the orientation/unit preset; the eye stages the customization.', editor: 'number', clearable: true, value: pgMax, onChange: value => { pgMax = value; pgMaxOn = true; }, toggle: snippetToggle(pgMaxOn, enabled => (pgMaxOn = enabled)), sync: { kind: 'number' } },
    { name: 'min', type: 'number?', defaultValue: '—', note: 'Lower clamp for the divider position; unset follows the orientation/unit preset; the eye stages the customization.', editor: 'number', clearable: true, value: pgMin, onChange: value => { pgMin = value; pgMinOn = true; }, toggle: snippetToggle(pgMinOn, enabled => (pgMinOn = enabled)), sync: { kind: 'number' } },
    { name: 'orientation', type: "'vertical' | 'horizontal'", defaultValue: "'vertical'", note: 'Vertical splits left/right; horizontal splits top/bottom; the eye stages the customization.', editor: 'enum', options: orientationOptions, value: pgOrientation, onChange: applyOrientation, placeholder: 'vertical', clearLabel: 'Clear orientation', toggle: snippetToggle(pgOrientationOn, enabled => (pgOrientationOn = enabled)), sync: { kind: 'text' } },
    { name: 'unit', type: "'px' | '%'", defaultValue: "'px'", note: 'Unit for the value, drag delta, and arrow-key step; the eye stages the customization.', editor: 'enum', options: unitOptions, value: pgUnit, onChange: applyUnit, placeholder: 'px', clearLabel: 'Clear unit', toggle: snippetToggle(pgUnitOn, enabled => (pgUnitOn = enabled)), sync: { kind: 'text' } },
    { name: 'value', type: 'number', defaultValue: '—', note: 'Divider position in pixels or percent; drive it from onChange (the seed reads it from scope).', editor: 'number', value: String(pgSplit), onChange: applySplit },
    { name: 'onChange', type: '(value: number) => void', defaultValue: '—', note: 'Fires while dragging and on arrow-key nudges.' },
    { name: 'onDragEnd', type: '() => void', defaultValue: '—', note: 'Fires after a drag or keyboard nudge completes.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // The seed covers every override except the divider position and pane labels
  // (the snippet reads them from scope), so only drags and locale changes need
  // a scope refresh; everything else reseeds. The refresh preserves the editor
  // text by recompiling the draft.
  useScopeRefresh(preview, () => [pgSplit, leftLabel, rightLabel])
</script>

<ShowcasePage
    {fields}
    title="Splitter"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{
      initialSplit: pgSplit,
      leftLabel,
      rightLabel,
    }}
>
    <ShowcaseStage paneClass="w-full">
      <div class={orientation === 'horizontal' ? `${SPLITTER_WRAPPER} flex-col` : SPLITTER_WRAPPER}>
        <div
          class={SPLITTER_PANE}
          style={orientation === 'horizontal' ? `height:${pgSplit}${unit}` : `width:${pgSplit}${unit}`}>
          {leftLabel}
        </div>
        <Splitter
          value={pgSplit}
          min={demoMin}
          max={demoMax}
          onChange={next => (pgSplit = next)}
          orientation={demoOrientation}
          unit={demoUnit}
          ariaLabel={demoAriaLabel}
          className={demoClassName}
          lineClass={demoLineClass}
          invert={demoInvert} />
        <div class={SPLITTER_MAIN}>{rightLabel}</div>
      </div>
    </ShowcaseStage>
  </ShowcasePage>
