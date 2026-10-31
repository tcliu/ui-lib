// Show-code source for the DataGrid demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The cell data is a
// scope binding, so the snippet mirrors the live demo's controlled editing.

import { boolAttrLine, sizeAttrLine, textAttrLine, type TriState } from '$showcase/snippet-build'
import type { Staged } from '$showcase/staged'
import { stageStaticCloseLines, stageStaticOpenLines } from '$showcase/resizable-stage'

// Default grid contents, shared by the page and the snippet's scope so the
// static demo, Show-code, and live render start from the same cells.
export const DEMO_VALUE: string[][] = [
  ['Name', 'Role', 'Team'],
  ['Ada Lovelace', 'Engineer', 'Platform'],
  ['Grace Hopper', 'Admiral', 'Research'],
  ['Alan Turing', 'Mathematician', 'Research'],
  ['Katherine Johnson', 'Analyst', 'Flight'],
]

export interface DataGridSnippetState {
  editable: Staged<TriState>
  showHeaders: Staged<TriState>
  hideHeaderToggle: Staged<TriState>
  // Each list applies only while its eye toggle is on, mirroring the page
  // (off omits the seed and the attribute; committed lists stay in the dialog).
  columnLabels: Staged<string[]>
  initialColumnWidths: Staged<string[]>
  // The cell data rides scope; the eye omits the binding while off.
  value: Staged<string[][]>
  maxColumns: Staged<string>
  storageKey: Staged<string>
  size: Staged<string>
}

// A max-columns line: omitted while the eye is off or the value is unset or
// not a positive integer (the demo falls back to the component default).
function maxColumnsLine(pair: Staged<string>, indent: number): string[] {
  if (!pair.on || pair.value.trim() === '') {
    return []
  }
  const parsed = Number(pair.value)
  return Number.isInteger(parsed) && parsed > 0 ? [`${' '.repeat(indent)}maxColumns={${parsed}}`] : []
}

// Validate unknown data into a string list (every entry a string). Returns
// null for anything else, so the dialogs and parse-back apply only
// well-shaped lists.
function parseStringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every(entry => typeof entry === 'string')) {
    return null
  }
  return [...value]
}

// Parse a column-labels editor draft (a JSON array of strings). Returns null
// for anything else, so the dialog can block OK and explain instead of
// applying half-shaped data.
export function parseColumnLabelsValue(value: unknown): string[] | null {
  return parseStringList(value)
}

export function parseColumnLabelsJson(text: string): string[] | null {
  try {
    return parseStringList(JSON.parse(text))
  } catch {
    return null
  }
}

// Parse an initial-column-widths editor draft (a JSON array of strings).
// Returns null for anything else, so the dialog can block OK and explain
// instead of applying half-shaped data.
export function parseColumnWidthsValue(value: unknown): string[] | null {
  return parseStringList(value)
}

export function parseColumnWidthsJson(text: string): string[] | null {
  try {
    return parseStringList(JSON.parse(text))
  } catch {
    return null
  }
}

// Parse grid cell data into rows of strings (every row an array, every cell a
// string). Returns a fresh copy so a dialog commit never aliases the draft.
// Null for anything else, so the dialog can block OK and explain instead of
// applying half-shaped data.
export function parseGridValue(value: unknown): string[][] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const rows: string[][] = []
  for (const row of value) {
    if (!Array.isArray(row) || !row.every(cell => typeof cell === 'string')) {
      return null
    }
    rows.push([...row])
  }
  return rows
}

export function parseGridValueJson(text: string): string[][] | null {
  try {
    return parseGridValue(JSON.parse(text))
  } catch {
    return null
  }
}

export function buildDataGridSnippet({ editable, showHeaders, hideHeaderToggle, columnLabels, initialColumnWidths, value, maxColumns, storageKey, size }: DataGridSnippetState): string {
  // JSON.stringify keeps the seeded lists valid no matter what the labels
  // hold. The lists seed script-local state only while set; unset omits both
  // the declaration and the attribute. The script block itself is omitted
  // while neither list is set, so the default snippet is markup only.
  const seedList = (name: string, list: string[]): string => `  let ${name} = $state(${JSON.stringify(list)});`
  const scriptLines = [
    ...(columnLabels.on && columnLabels.value.length ? [seedList('columnLabels', columnLabels.value)] : []),
    ...(initialColumnWidths.on && initialColumnWidths.value.length ? [seedList('initialColumnWidths', initialColumnWidths.value)] : []),
  ]
  return [
    ...(scriptLines.length ? ['<script>', ...scriptLines, '</script>'] : []),
    ...stageStaticOpenLines('', 'h-72 w-full'),
    '    <DataGrid',
    ...(value.on ? ['      value={value}', '      onChange={next => (value = next)}'] : []),
    ...(columnLabels.on && columnLabels.value.length ? ['      columnLabels={columnLabels}'] : []),
    ...(initialColumnWidths.on && initialColumnWidths.value.length ? ['      initialColumnWidths={initialColumnWidths}'] : []),
    // Flag and size rows prefill their component default in the Value column;
    // the builder omits the default so Show-code stays minimal.
    ...boolAttrLine('editable', editable, 'yes', '      '),
    ...boolAttrLine('showHeaders', showHeaders, 'yes', '      '),
    ...boolAttrLine('hideHeaderToggle', hideHeaderToggle, 'no', '      '),
    ...maxColumnsLine(maxColumns, 6),
    ...textAttrLine('storageKey', storageKey, '      '),
    ...sizeAttrLine(size, '      '),
    '    />',
    ...stageStaticCloseLines(''),
  ].join('\n')
}
