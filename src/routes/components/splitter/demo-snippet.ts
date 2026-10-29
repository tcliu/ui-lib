// Show-code source for the Splitter demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The divider value is
// local $state in the snippet (seeded from scope) so the live instance is
// draggable, matching the static demo.

import { escapeAttr } from '$showcase/snippet-build'
import { stageStaticCloseLines, stageStaticOpenLines } from '$showcase/resizable-stage'

export type SplitterOrientation = 'vertical' | 'horizontal'
export type SplitterUnit = 'px' | '%'

export interface SplitterSnippetState {
  orientation: '' | SplitterOrientation
  orientationOn: boolean
  unit: '' | SplitterUnit
  unitOn: boolean
  ariaLabel: string
  ariaLabelOn: boolean
  className: string
  classNameOn: boolean
  lineClass: string
  lineClassOn: boolean
  invert: TriState
  invertOn: boolean
  min: string
  minOn: boolean
  max: string
  maxOn: boolean
}

export type TriState = '' | 'yes' | 'no'

// Bounded stage the demo renders into: the splitter can only clamp against a
// parent with a definite size. The snippet emits this same wrapper so the static
// demo and Show-code match; the handle-less stage around it supplies no trailing
// handle, so the demo's own separator is the only one.
export const SPLITTER_WRAPPER = 'flex h-64 w-full overflow-hidden rounded-lg border border-slate-800'
export const SPLITTER_PANE = 'shrink-0 overflow-auto bg-slate-950/50 p-3 text-sm text-slate-300'
export const SPLITTER_MAIN = 'min-w-0 flex-1 overflow-auto bg-slate-900/40 p-3 text-sm text-slate-300'

export interface SplitterPreset {
  min: number
  max: number
  value: number
}

// Bounds and starting position per orientation/unit. The page calls the same
// helper, so the static demo, Show-code, and live render stay in step.
export function splitterPreset(orientation: SplitterOrientation, unit: SplitterUnit): SplitterPreset {
  if (unit === '%') {
    return { min: 20, max: 80, value: 40 }
  }
  return orientation === 'horizontal' ? { min: 80, max: 200, value: 120 } : { min: 120, max: 320, value: 160 }
}

// A playground bound: empty or non-numeric text means unset, so the cleared
// form applies no overrides. The page parses with this same helper, so the
// static demo, Show-code, and live render stay in step.
export function parseSplitterBound(text: string): number | null {
  if (text.trim() === '') {
    return null
  }
  const parsed = Number(text)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`        ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildSplitterSnippet({ orientation, orientationOn, unit, unitOn, ariaLabel, ariaLabelOn, className, classNameOn, lineClass, lineClassOn, invert, invertOn, min, minOn, max, maxOn }: SplitterSnippetState): string {
  const resolvedOrientation: SplitterOrientation = orientation || 'vertical'
  const resolvedUnit: SplitterUnit = unit || 'px'
  const preset = splitterPreset(resolvedOrientation, resolvedUnit)
  const wrapperClass = resolvedOrientation === 'horizontal' ? `${SPLITTER_WRAPPER} flex-col` : SPLITTER_WRAPPER
  const paneSide = resolvedOrientation === 'horizontal' ? 'height' : 'width'
  // Bounds are required props, so the seed always carries a literal: the
  // playground override when set, the orientation/unit preset otherwise.
  const resolvedMin = parseSplitterBound(min) ?? preset.min
  const resolvedMax = parseSplitterBound(max) ?? preset.max
  // Built by concatenation so the `${split}` expression stays literal text.
  const paneLine =
    '      <div class="' + SPLITTER_PANE + '" style={`' + paneSide + ':${split}' + resolvedUnit + '`}>{leftLabel}</div>'
  return [
    '<script>',
    '  let split = $state(initialSplit)',
    '</script>',
    ...stageStaticOpenLines('', 'w-full'),
    `    <div class="${wrapperClass}">`,
    paneLine,
    '      <Splitter',
    '        value={split}',
    // Bounds are required props, so the seed carries a literal while the eye
    // is on: the playground override when set, the orientation/unit preset
    // otherwise. Eye off omits the line so the component default renders.
    ...(minOn ? [`        min={${resolvedMin}}`] : []),
    ...(maxOn ? [`        max={${resolvedMax}}`] : []),
    '        onChange={next => (split = next)}',
    // Orientation and unit Values prefill their component defaults; the
    // builder omits the defaults so Show-code stays minimal.
    ...(orientationOn && orientation && orientation !== 'vertical' ? [`        orientation="${orientation}"`] : []),
    ...(unitOn && unit && unit !== 'px' ? [`        unit="${unit}"`] : []),
    ...(ariaLabelOn && ariaLabel ? [`        ariaLabel="${escapeAttr(ariaLabel)}"`] : []),
    ...(classNameOn && className ? [`        className="${escapeAttr(className)}"`] : []),
    ...(invertOn ? flagLine('invert', invert, 'no') : []),
    ...(lineClassOn && lineClass ? [`        lineClass="${escapeAttr(lineClass)}"`] : []),
    '      />',
    `      <div class="${SPLITTER_MAIN}">{rightLabel}</div>`,
    '    </div>',
    ...stageStaticCloseLines(''),
  ].join('\n')
}
