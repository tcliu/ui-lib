<script lang="ts">
  import Splitter from '$lib/components/Splitter.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import ShowcaseStage from '$showcase/ShowcaseStage.svelte'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { applied, appliedFlag, eye, eyeFlag, eyeToggle, stage, staged } from '$showcase/staged'
  import { type TriState } from '$showcase/snippet-build'
  import { textField, boolField, enumField } from '$showcase/snippet-field'
  import {
    SPLITTER_MAIN,
    SPLITTER_PANE,
    SPLITTER_WRAPPER,
    buildSplitterSnippet,
    parseSplitterBound,
    splitterPreset,
    type SplitterOrientation,
    type SplitterUnit,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. Each curated prop is one
  // `Staged` pair (its committed value plus its eye flag).
  let pgOrientation = $state(staged('vertical'))
  let pgUnit = $state(staged('px'))
  let pgAriaLabel = $state(staged(''))
  let pgClassName = $state(staged(''))
  let pgLineClass = $state(staged(''))
  let pgInvert = $state(staged<TriState>('no'))
  // The required bounds prefill their preset, so their eyes start on.
  let pgMin = $state(staged('', true))
  let pgMax = $state(staged('', true))
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

  const orientation = $derived((pgOrientation.value || 'vertical') as SplitterOrientation)
  const unit = $derived((pgUnit.value || 'px') as SplitterUnit)
  const preset = $derived(splitterPreset(orientation, unit))

  const demoOrientation = $derived((applied(pgOrientation) || undefined) as SplitterOrientation | undefined)
  const demoUnit = $derived((applied(pgUnit) || undefined) as SplitterUnit | undefined)
  const demoAriaLabel = $derived(applied(pgAriaLabel) || undefined)
  const demoClassName = $derived(applied(pgClassName) || undefined)
  const demoLineClass = $derived(applied(pgLineClass) || undefined)
  const demoInvert = $derived(appliedFlag(pgInvert))
  const demoMin = $derived.by(() => {
    const value = applied(pgMin)
    return value === undefined ? undefined : (parseSplitterBound(value) ?? preset.min)
  })
  const demoMax = $derived.by(() => {
    const value = applied(pgMax)
    return value === undefined ? undefined : (parseSplitterBound(value) ?? preset.max)
  })
  const leftLabel = $derived(i18n.t('appShell.leftPane'))
  const rightLabel = $derived(i18n.t('appShell.rightPane'))

  // Switching orientation or unit changes the value's meaning, so reseed the
  // divider from the matching preset instead of leaving it out of range.
  function applyOrientation(value: string): void {
    pgOrientation.value = value
    pgOrientation.on = true
    pgSplit = splitterPreset((value || 'vertical') as SplitterOrientation, unit).value
  }

  function applyUnit(value: string): void {
    pgUnit.value = value
    pgUnit.on = true
    pgSplit = splitterPreset(orientation, (value || 'px') as SplitterUnit).value
  }

  function clearPlayground(): void {
    pgOrientation.value = 'vertical'
    pgOrientation.on = false
    pgUnit.value = 'px'
    pgUnit.on = false
    pgAriaLabel.value = ''
    pgAriaLabel.on = false
    pgClassName.value = ''
    pgClassName.on = false
    pgLineClass.value = ''
    pgLineClass.on = false
    pgInvert.value = 'no'
    pgInvert.on = false
    pgMin.value = ''
    pgMin.on = true
    pgMax.value = ''
    pgMax.on = true
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
      orientation: pgOrientation,
      unit: pgUnit,
      ariaLabel: pgAriaLabel,
      className: pgClassName,
      lineClass: pgLineClass,
      invert: pgInvert,
      min: pgMin,
      max: pgMax,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. Orientation
  // and unit reseed the divider through the same appliers as the demo, so
  // snippet edits stay in range too.
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: "i18n 'splitter.resize'", note: 'Accessible name for the separator.', clearable: true, ...eye(pgAriaLabel) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the separator handle.', editorDefaultValue: '', clearable: true, ...eye(pgClassName) }),
    boolField({ name: 'invert', defaultValue: 'false', note: 'Flips drag and arrow-key deltas for a pane anchored on the far side of the handle (right or bottom panes).', ...eyeFlag(pgInvert) }),
    textField({ name: 'lineClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the visible divider line.', editorDefaultValue: '', clearable: true, ...eye(pgLineClass) }),
    { name: 'max', type: 'number?', defaultValue: '—', note: 'Upper clamp for the divider position; unset follows the orientation/unit preset.', editor: 'number', clearable: true, ...eye(pgMax), onChange: value => stage(pgMax, value), toggle: eyeToggle(pgMax), sync: { kind: 'number' } },
    { name: 'min', type: 'number?', defaultValue: '—', note: 'Lower clamp for the divider position; unset follows the orientation/unit preset.', editor: 'number', clearable: true, ...eye(pgMin), onChange: value => stage(pgMin, value), toggle: eyeToggle(pgMin), sync: { kind: 'number' } },
    enumField({ name: 'orientation', type: "'vertical' | 'horizontal'", defaultValue: "'vertical'", note: 'Vertical splits left/right; horizontal splits top/bottom.', options: orientationOptions, placeholder: 'vertical', clearLabel: 'Clear orientation', ...eye(pgOrientation), onChange: applyOrientation }),
    enumField({ name: 'unit', type: "'px' | '%'", defaultValue: "'px'", note: 'Unit for the value, drag delta, and arrow-key step.', options: unitOptions, placeholder: 'px', clearLabel: 'Clear unit', ...eye(pgUnit), onChange: applyUnit }),
    { name: 'value', type: 'number', defaultValue: '—', note: 'Divider position in pixels or percent; drive it from onChange (the seed reads it from scope).', editor: 'number', value: String(pgSplit), onChange: applySplit },
    { name: 'onChange', type: '(value: number) => void', defaultValue: '—', note: 'Fires while dragging and on arrow-key nudges.' },
    { name: 'onDragEnd', type: '() => void', defaultValue: '—', note: 'Fires after a drag or keyboard nudge completes.' },
  ])


  // The seed covers every override except the divider position and pane labels
  // (the snippet reads them from scope), so only drags and locale changes need
  // a scope refresh; everything else reseeds. The refresh preserves the editor
  // text by recompiling the draft.
  </script>

<ShowcasePage
    {fields}
    title="Splitter"
    {code}
    onReset={clearPlayground}
    scope={{
      initialSplit: pgSplit,
      leftLabel,
      rightLabel,
    }}

    sync={{ tag: 'Splitter' }}
    scopeRefresh={() => [pgSplit, leftLabel, rightLabel]}
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
