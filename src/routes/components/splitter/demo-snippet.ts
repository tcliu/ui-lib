// Show-code source for the Splitter demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The divider value is
// local $state in the snippet (seeded from scope) so the live instance is
// draggable, matching the static demo.

import { stageCloseLines, stageOpenLines, stageStateLine } from '$lib/showcase/resizable-stage'

export type SplitterOrientation = 'vertical' | 'horizontal'
export type SplitterUnit = 'px' | '%'

export interface SplitterSnippetState {
  orientation: '' | SplitterOrientation
  unit: '' | SplitterUnit
  ariaLabel: string
}

// Bounded stage the demo renders into: the splitter can only clamp against a
// parent with a definite size. The snippet emits this same wrapper so the static
// demo and Show-code match; the resizable stage around it supplies the width.
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

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildSplitterSnippet({ orientation, unit, ariaLabel }: SplitterSnippetState): string {
  const resolvedOrientation: SplitterOrientation = orientation || 'vertical'
  const resolvedUnit: SplitterUnit = unit || 'px'
  const preset = splitterPreset(resolvedOrientation, resolvedUnit)
  const wrapperClass = resolvedOrientation === 'horizontal' ? `${SPLITTER_WRAPPER} flex-col` : SPLITTER_WRAPPER
  const paneSide = resolvedOrientation === 'horizontal' ? 'height' : 'width'
  // Built by concatenation so the `${split}` expression stays literal text.
  const paneLine =
    '      <div class="' + SPLITTER_PANE + '" style={`' + paneSide + ':${split}' + resolvedUnit + '`}>{leftLabel}</div>'
  return [
    '<script>',
    '  let split = $state(initialSplit)',
    stageStateLine('  '),
    '</script>',
    ...stageOpenLines('', 'w-full'),
    `    <div class="${wrapperClass}">`,
    paneLine,
    '      <Splitter',
    '        value={split}',
    `        min={${preset.min}}`,
    `        max={${preset.max}}`,
    '        onChange={next => (split = next)}',
    ...(orientation ? [`        orientation="${orientation}"`] : []),
    ...(unit ? [`        unit="${unit}"`] : []),
    ...(ariaLabel ? [`        ariaLabel="${escapeAttr(ariaLabel)}"`] : []),
    '      />',
    `      <div class="${SPLITTER_MAIN}">{rightLabel}</div>`,
    '    </div>',
    ...stageCloseLines(''),
  ].join('\n')
}
