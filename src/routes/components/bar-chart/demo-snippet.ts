// Show-code source for the BarChart demo section. Pure string building over the
// playground form state, so the section regenerates the editor text from this
// and the editor always shows the markup behind the demo above. The column data
// is seeded as script-local `$state` so the snippet is self-contained, its text
// tracks Value edits instead of hiding the entries in scope, and the Value cell
// can parse an edited list back out of the script block.

import { escapeAttr, type TriState } from '$showcase/snippet-build'
import { sizeAttributeLine } from '$showcase/size-input'
import { CHART_TONES, type ChartTone } from '$lib/components/chart-tones'
import type { ChartColumn, ChartSegment } from '$lib/components/BarChart.svelte'

// Default chart data, shared by the page seed and the tests, so the static demo,
// Show-code, and live render start from the same columns.
export const DEMO_COLUMNS: ChartColumn[] = [
  {
    label: 'Mon',
    segments: [
      { value: 8, label: 'Sessions' },
      { value: 3, label: 'Retries' },
    ],
    tip: 'Mon — 8 sessions, 3 retries',
  },
  {
    label: 'Tue',
    segments: [
      { value: 12, label: 'Sessions' },
      { value: 4, label: 'Retries' },
    ],
    tip: 'Tue — 12 sessions, 4 retries',
  },
  {
    label: 'Wed',
    segments: [
      { value: 6, label: 'Sessions' },
      { value: 2, label: 'Retries' },
    ],
    tip: 'Wed — 6 sessions, 2 retries',
  },
  {
    label: 'Thu',
    segments: [
      { value: 15, label: 'Sessions' },
      { value: 5, label: 'Retries' },
    ],
    tip: 'Thu — 15 sessions, 5 retries',
  },
  {
    label: 'Fri',
    segments: [
      { value: 10, label: 'Sessions' },
      { value: 3, label: 'Retries' },
    ],
    tip: 'Fri — 10 sessions, 3 retries',
  },
]

// Validate unknown data into chart columns, so the JSON dialog and the snippet
// parse-back apply only shapes the static demo can reproduce. A column needs a
// string label and a segment array (an empty array renders an empty bar); a
// segment needs a finite value and may carry a known tone and a string label.
// Returns null for anything else.
export function parseColumnsValue(value: unknown): ChartColumn[] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const out: ChartColumn[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      return null
    }
    const { label, segments, tip } = entry as { label?: unknown; segments?: unknown; tip?: unknown }
    if (typeof label !== 'string' || !Array.isArray(segments)) {
      return null
    }
    if (tip !== undefined && typeof tip !== 'string') {
      return null
    }
    const parsed: ChartSegment[] = []
    for (const raw of segments) {
      if (typeof raw !== 'object' || raw === null) {
        return null
      }
      const { value: amount, tone, label: segmentLabel } = raw as { value?: unknown; tone?: unknown; label?: unknown }
      if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        return null
      }
      // An unknown tone has no palette class, so its segment would render no
      // fill at all; reject the draft rather than fall back to a default.
      if (tone !== undefined && (typeof tone !== 'string' || !CHART_TONES.includes(tone as ChartTone))) {
        return null
      }
      if (segmentLabel !== undefined && typeof segmentLabel !== 'string') {
        return null
      }
      parsed.push({
        value: amount,
        ...(tone === undefined ? {} : { tone: tone as ChartTone }),
        ...(segmentLabel === undefined ? {} : { label: segmentLabel }),
      })
    }
    out.push({ label, segments: parsed, ...(tip === undefined ? {} : { tip }) })
  }
  return out
}

// Parse the columns editor draft (a JSON array of column objects). Returns null
// for anything else, so the dialog can block OK and explain instead of applying
// half-shaped data.
export function parseColumnsJson(text: string): ChartColumn[] | null {
  try {
    return parseColumnsValue(JSON.parse(text))
  } catch {
    return null
  }
}

export interface BarChartSnippetState {
  columns: ChartColumn[]
  size: string
  sizeOn: boolean
  height: string
  heightOn: boolean
  legend: TriState
  legendOn: boolean
  ariaLabel: string
  ariaLabelOn: boolean
  className: string
  classNameOn: boolean
}

// A tri-state line: omitted while unset or at the component default, `={false}`
// while No.
function flagLine(name: string, value: TriState, indent: number, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`${' '.repeat(indent)}${name}${value === 'yes' ? '' : '={false}'}`]
}

// A height value: only a positive integer is a usable plot height; anything
// else falls back to the size-derived height. The page and the snippet share
// this guard, so the live demo and Show-code cannot disagree.
export function barHeight(value: string, enabled: boolean): number | undefined {
  if (!enabled || !value) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

// A height line: omitted while the eye is off or the value is not a positive
// integer (the demo falls back to the size-derived plot height).
function heightLine(value: string, enabled: boolean): string[] {
  const parsed = barHeight(value, enabled)
  return parsed === undefined ? [] : [`    height={${parsed}}`]
}

export function buildBarChartSnippet({
  columns,
  size,
  sizeOn,
  height,
  heightOn,
  legend,
  legendOn,
  ariaLabel,
  ariaLabelOn,
  className,
  classNameOn,
}: BarChartSnippetState): string {
  // Pretty JSON reindented under the state line: readable in place, and valid
  // JSON so the Value cell's script parse-back sees the same entries.
  const columnsJson = JSON.stringify(columns, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join('\n')
  const lines = [
    '<script>',
    `  let columns = $state(${columnsJson});`,
    '</script>',
    '<div class="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-4">',
    '  <BarChart',
    '    columns={columns}',
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, '    ') : []),
    ...heightLine(height, heightOn),
    ...(legendOn ? flagLine('legend', legend, 4, 'yes') : []),
    ...(ariaLabelOn && ariaLabel ? [`    ariaLabel="${escapeAttr(ariaLabel)}"`] : []),
    ...(classNameOn && className ? [`    className="${escapeAttr(className)}"`] : []),
    '  />',
    '</div>',
  ]
  return lines.join('\n')
}
