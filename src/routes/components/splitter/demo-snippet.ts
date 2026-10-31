// Show-code source for the Splitter demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The divider value is
// local $state in the snippet (seeded from scope) so the live instance is
// draggable, matching the static demo.

import { boolAttrLine, enumAttrLine, textAttrLine, type TriState } from '$showcase/snippet-build'
import { stageStaticCloseLines, stageStaticOpenLines } from '$showcase/resizable-stage'
import type { Staged } from '$showcase/staged'

export type SplitterOrientation = 'vertical' | 'horizontal'
export type SplitterUnit = 'px' | '%'

export interface SplitterSnippetState {
  orientation: Staged<string>
  unit: Staged<string>
  ariaLabel: Staged<string>
  className: Staged<string>
  lineClass: Staged<string>
  invert: Staged<TriState>
  min: Staged<string>
  max: Staged<string>
}

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

export function buildSplitterSnippet({ orientation, unit, ariaLabel, className, lineClass, invert, min, max }: SplitterSnippetState): string {
  const resolvedOrientation = (orientation.value || 'vertical') as SplitterOrientation
  const resolvedUnit = (unit.value || 'px') as SplitterUnit
  const preset = splitterPreset(resolvedOrientation, resolvedUnit)
  const wrapperClass = resolvedOrientation === 'horizontal' ? `${SPLITTER_WRAPPER} flex-col` : SPLITTER_WRAPPER
  const paneSide = resolvedOrientation === 'horizontal' ? 'height' : 'width'
  // Bounds are required props, so the seed always carries a literal: the
  // playground override when set, the orientation/unit preset otherwise.
  const resolvedMin = parseSplitterBound(min.value) ?? preset.min
  const resolvedMax = parseSplitterBound(max.value) ?? preset.max
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
    ...(min.on ? [`        min={${resolvedMin}}`] : []),
    ...(max.on ? [`        max={${resolvedMax}}`] : []),
    '        onChange={next => (split = next)}',
    // Orientation and unit Values prefill their component defaults; the
    // builder omits the defaults so Show-code stays minimal.
    ...enumAttrLine('orientation', orientation, 'vertical', '        '),
    ...enumAttrLine('unit', unit, 'px', '        '),
    ...textAttrLine('ariaLabel', ariaLabel, '        '),
    ...textAttrLine('className', className, '        '),
    ...boolAttrLine('invert', invert, 'no', '        '),
    ...textAttrLine('lineClass', lineClass, '        '),
    '      />',
    `      <div class="${SPLITTER_MAIN}">{rightLabel}</div>`,
    '    </div>',
    ...stageStaticCloseLines(''),
  ].join('\n')
}
