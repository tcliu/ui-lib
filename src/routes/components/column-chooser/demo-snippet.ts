// Show-code source for the ColumnChooser demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above. The column
// list is seeded as script-local state so the snippet is self-contained and its
// text tracks Value edits instead of hiding the entries in scope.
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.
import { escapeAttr, sizeAttrLine } from '#showcase/playground/snippet-build.js'
import type { Staged } from '#showcase/playground/staged.js'
import type { ChooserColumn } from '#lib/components/ColumnChooser.svelte'

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

export interface ColumnChooserSnippetState {
  triggerLabel: Staged<string>
  resetAriaLabel: Staged<string>
  columns: Staged<ChooserColumn[]>
  size: Staged<string>
}

export function buildColumnChooserSnippet({ triggerLabel, resetAriaLabel, columns, size }: ColumnChooserSnippetState): string {
  // The frame is shell chrome, so the component sits at the snippet root with
  // its attributes one step in.
  const indent = '  '
  // Pretty JSON reindented under the state line, so the seeded list stays
  // readable and editable in place.
  const columnsJson = JSON.stringify(columns.value, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join('\n')
  return [
    '<script>',
    `  let columns = $state(${columnsJson});`,
    '  function handleToggleColumn(key, checked) {',
    '    columns = columns.map(column => (column.key === key ? { ...column, checked } : column))',
    '  }',
    '  function handleResetColumns() {',
    '    columns = columns.map(column => ({ ...column, checked: true }))',
    '  }',
    '</script>',
    '<ColumnChooser',
    triggerLabel.on && triggerLabel.value ? `${indent}triggerLabel="${escapeAttr(triggerLabel.value)}"` : `${indent}triggerLabel={chooserLabel}`,
    resetAriaLabel.on && resetAriaLabel.value
      ? `${indent}resetAriaLabel="${escapeAttr(resetAriaLabel.value)}"`
      : `${indent}resetAriaLabel={resetLabel}`,
    `${indent}columns={columns}`,
    // The size prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...sizeAttrLine(size, indent),
    `${indent}onToggle={handleToggleColumn}`,
    `${indent}onReset={handleResetColumns} />`,
    '<span class="text-sm text-slate-400">hidden: {columns.filter(column => !column.checked).length}</span>',
  ].join('\n')
}
