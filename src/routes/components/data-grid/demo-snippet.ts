// Show-code source for the DataGrid demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The cell data is a
// scope binding, so the snippet mirrors the live demo's controlled editing.

import { escapeAttr } from '$showcase/snippet-build'
import { sizeAttributeLine } from '$showcase/size-input'
import { stageStaticCloseLines, stageStaticOpenLines } from '$showcase/resizable-stage'

export type TriState = '' | 'yes' | 'no'

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
  editable: TriState
  editableOn: boolean
  showHeaders: TriState
  showHeadersOn: boolean
  hideHeaderToggle: TriState
  hideHeaderToggleOn: boolean
  columnLabels: string[]
  // Each list applies only while its eye toggle is on, mirroring the page
  // (off omits the seed and the attribute; committed lists stay in the dialog).
  columnLabelsEnabled: boolean
  initialColumnWidths: string[]
  initialColumnWidthsEnabled: boolean
  valueEnabled: boolean
  maxColumns: string
  maxColumnsOn: boolean
  storageKey: string
  storageKeyOn: boolean
  size: string
  sizeOn: boolean
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: number, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`${' '.repeat(indent)}${name}${value === 'yes' ? '' : '={false}'}`]
}

// A string attribute line, omitted while unset.
function textLine(name: string, value: string, indent: number): string[] {
  return value ? [`${' '.repeat(indent)}${name}="${escapeAttr(value)}"`] : []
}

// A max-columns line: omitted while the eye is off or the value is unset or
// not a positive integer (the demo falls back to the component default).
function maxColumnsLine(value: string, enabled: boolean, indent: number): string[] {
  if (!enabled || value.trim() === '') {
    return []
  }
  const parsed = Number(value)
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

export function buildDataGridSnippet({ editable, editableOn, showHeaders, showHeadersOn, hideHeaderToggle, hideHeaderToggleOn, columnLabels, columnLabelsEnabled, initialColumnWidths, initialColumnWidthsEnabled, valueEnabled, maxColumns, maxColumnsOn, storageKey, storageKeyOn, size, sizeOn }: DataGridSnippetState): string {
  // JSON.stringify keeps the seeded lists valid no matter what the labels
  // hold. The lists seed script-local state only while set; unset omits both
  // the declaration and the attribute. The script block itself is omitted
  // while neither list is set, so the default snippet is markup only.
  const seedList = (name: string, list: string[]): string => `  let ${name} = $state(${JSON.stringify(list)});`
  const scriptLines = [
    ...(columnLabelsEnabled && columnLabels.length ? [seedList('columnLabels', columnLabels)] : []),
    ...(initialColumnWidthsEnabled && initialColumnWidths.length ? [seedList('initialColumnWidths', initialColumnWidths)] : []),
  ]
  return [
    ...(scriptLines.length ? ['<script>', ...scriptLines, '</script>'] : []),
    ...stageStaticOpenLines('', 'h-72 w-full'),
    '    <DataGrid',
    ...(valueEnabled ? ['      value={value}', '      onChange={next => (value = next)}'] : []),
    ...(columnLabelsEnabled && columnLabels.length ? ['      columnLabels={columnLabels}'] : []),
    ...(initialColumnWidthsEnabled && initialColumnWidths.length ? ['      initialColumnWidths={initialColumnWidths}'] : []),
    // Flag and size rows prefill their component default in the Value column;
    // the builder omits the default so Show-code stays minimal.
    ...(editableOn ? flagLine('editable', editable, 6, 'yes') : []),
    ...(showHeadersOn ? flagLine('showHeaders', showHeaders, 6, 'yes') : []),
    ...(hideHeaderToggleOn ? flagLine('hideHeaderToggle', hideHeaderToggle, 6, 'no') : []),
    ...maxColumnsLine(maxColumns, maxColumnsOn, 6),
    ...(storageKeyOn && storageKey ? textLine('storageKey', storageKey, 6) : []),
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, '      ') : []),
    '    />',
    ...stageStaticCloseLines(''),
  ].join('\n')
}
