// Show-code source for the ColumnChooser demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above. The column
// list is seeded as script-local state (like the stage size) so the snippet is
// self-contained and its text tracks Value edits instead of hiding the entries
// in scope.
//
// The demo sits in a width-only `Resizable` frame so the panel placement can be
// inspected as the container narrows. The host is non-scrolling and the frame
// is bounded to it, so no scrollbar can appear over the frame handle. These
// literals are shared with the page and its tests so the rendered stage and
// the reviewed source stay identical.
import type { ChooserColumn } from '$lib/components/ColumnChooser.svelte'

export const COLUMNS_STAGE_HOST = 'w-full overflow-hidden'
export const COLUMNS_STAGE_PANE = 'flex w-full min-w-0 flex-wrap items-start gap-4'
export const COLUMNS_STAGE_DEFAULT_WIDTH = 560
export const COLUMNS_STAGE_MIN_WIDTH = 240

// Column entries shared by the page seed and the tests, so the static demo,
// Show-code, and live render start from the same rows.
export const DEMO_COLUMNS: { key: string; header: string }[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'owner', header: 'Owner' },
  { key: 'updated', header: 'Updated' },
]

// The component has no locale-key default for its two labels (they are
// caller-supplied), so the showcase passes these through scope exactly as the
// static demo does.
export const CHOOSER_LABEL = 'Choose columns'
export const CHOOSER_RESET_LABEL = 'Reset columns'

// Fresh seeded entries (all checked) for playground state and Reset, so no
// caller ever shares a mutable array.
export function seedColumns(): ChooserColumn[] {
  return DEMO_COLUMNS.map(column => ({ ...column, checked: true }))
}

// Validate unknown data into chooser entries: every entry needs string key and
// header; a missing checked flag reads as checked. Returns null for anything
// else, so the dialog and parse-back apply only well-shaped lists.
export function parseColumnsValue(value: unknown): ChooserColumn[] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const out: ChooserColumn[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      return null
    }
    const { key, header, checked } = entry as { key?: unknown; header?: unknown; checked?: unknown }
    if (typeof key !== 'string' || typeof header !== 'string') {
      return null
    }
    if (checked !== undefined && typeof checked !== 'boolean') {
      return null
    }
    out.push({ key, header, checked: checked ?? true })
  }
  return out
}

// Parse the columns editor draft (a JSON array of `{ key, header, checked? }`
// objects). Returns null for anything else, so the dialog can block OK and
// explain instead of applying half-shaped data.
export function parseColumnsJson(text: string): ChooserColumn[] | null {
  try {
    return parseColumnsValue(JSON.parse(text))
  } catch {
    return null
  }
}

// The snippet's local size state, seeded to the default so the live stage
// matches the static demo before the first drag.
export function columnsStageStateLine(indent: string): string {
  return `${indent}let stageWidth = $state(${COLUMNS_STAGE_DEFAULT_WIDTH})`
}

export function columnsStageOpenLines(indent: string): string[] {
  return [
    `${indent}<div class="${COLUMNS_STAGE_HOST}">`,
    `${indent}  <Resizable`,
    `${indent}    width={stageWidth}`,
    `${indent}    minWidth={${COLUMNS_STAGE_MIN_WIDTH}}`,
    `${indent}    maxWidth="parent"`,
    `${indent}    onResize={nextWidth => (stageWidth = nextWidth)}`,
    `${indent}  >`,
    `${indent}    <div class="${COLUMNS_STAGE_PANE}">`,
  ]
}

export function columnsStageCloseLines(indent: string): string[] {
  return [`${indent}    </div>`, `${indent}  </Resizable>`, `${indent}</div>`]
}

export interface ColumnChooserSnippetState {
  label: string
  resetLabel: string
  columns: ChooserColumn[]
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildColumnChooserSnippet({ label, resetLabel, columns }: ColumnChooserSnippetState): string {
  // The component and the trailing readout sit at 6 spaces; attributes at 8,
  // matching the stage's inner pane.
  const componentIndent = '      '
  const attributeIndent = '        '
  // Pretty JSON reindented under the state line, so the seeded list stays
  // readable and editable in place.
  const columnsJson = JSON.stringify(columns, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join('\n')
  return [
    '<script>',
    columnsStageStateLine('  '),
    `  let columns = $state(${columnsJson});`,
    '  function handleToggleColumn(key, checked) {',
    '    columns = columns.map(column => (column.key === key ? { ...column, checked } : column))',
    '  }',
    '  function handleResetColumns() {',
    '    columns = columns.map(column => ({ ...column, checked: true }))',
    '  }',
    '</script>',
    ...columnsStageOpenLines(''),
    `${componentIndent}<ColumnChooser`,
    label ? `${attributeIndent}label="${escapeAttr(label)}"` : `${attributeIndent}label={chooserLabel}`,
    resetLabel
      ? `${attributeIndent}resetLabel="${escapeAttr(resetLabel)}"`
      : `${attributeIndent}resetLabel={resetLabel}`,
    `${attributeIndent}columns={columns}`,
    `${attributeIndent}onToggle={handleToggleColumn}`,
    `${attributeIndent}onReset={handleResetColumns} />`,
    `${componentIndent}<span class="text-sm text-slate-400">hidden: {columns.filter(column => !column.checked).length}</span>`,
    ...columnsStageCloseLines(''),
  ].join('\n')
}
