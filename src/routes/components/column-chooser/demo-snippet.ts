// Show-code source for the ColumnChooser demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above. The column list
// is declared in the snippet's leading <script> block so the snippet is
// self-contained; the hidden set and handlers come from scope, mirroring how
// DataTable feeds chooser entries.

export interface DemoColumn {
  key: string
  header: string
}

// Column list shared by the page and the snippet's leading script, so the static
// demo, Show-code, and live render start from the same entries.
export const DEMO_COLUMNS: DemoColumn[] = [
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

export interface ColumnChooserSnippetState {
  label: string
  resetLabel: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildColumnChooserSnippet({ label, resetLabel }: ColumnChooserSnippetState): string {
  const lines = [
    '<script>',
    '  const columns = [',
    ...DEMO_COLUMNS.map(column => `    { key: '${column.key}', header: '${column.header}' },`),
    '  ]',
    '</script>',
    '<ColumnChooser',
    label ? `  label="${escapeAttr(label)}"` : '  label={chooserLabel}',
    resetLabel ? `  resetLabel="${escapeAttr(resetLabel)}"` : '  resetLabel={resetLabel}',
    '  columns={columns.map(column => ({ key: column.key, header: column.header, checked: !hidden.has(column.key) }))}',
    '  onToggle={handleToggleColumn}',
    '  onReset={handleResetColumns} />',
    '<span class="text-sm text-slate-400">hidden: {hidden.size}</span>',
  ]
  return lines.join('\n')
}
