// Show-code source for the DataGrid demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The cell data is a
// scope binding, so the snippet mirrors the live demo's controlled editing.

import { stageCloseLines, stageOpenLines, stageStateLine } from '$lib/showcase/resizable-stage'

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
  showHeaders: TriState
  hideHeaderToggle: TriState
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: number): string[] {
  if (value === '') {
    return []
  }
  return [`${' '.repeat(indent)}${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildDataGridSnippet({
  editable,
  showHeaders,
  hideHeaderToggle,
}: DataGridSnippetState): string {
  return [
    '<script>',
    stageStateLine('  '),
    '</script>',
    ...stageOpenLines('', 'h-72 w-full'),
    '    <DataGrid',
    '      value={value}',
    '      onChange={next => (value = next)}',
    ...flagLine('editable', editable, 6),
    ...flagLine('showHeaders', showHeaders, 6),
    ...flagLine('hideHeaderToggle', hideHeaderToggle, 6),
    '    />',
    ...stageCloseLines(''),
  ].join('\n')
}
