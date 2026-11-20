import type { DataTableColumn } from './DataTable.svelte'
import type { SelectOption } from './SelectDropdown.svelte'

// Per-column filter text, keyed by column key. One shared shape so the model,
// the table, and the showcase's demo pipeline read the same values.
export type ColumnFilters = Record<string, string>

// The text a column's filter matches against: the column's `searchValue` when
// it carries one, else the row property under its key. Missing values read as
// empty so a filter never matches `null`/`undefined` by accident.
export function columnFilterText<T>(column: DataTableColumn<T>, row: T): string {
  const value = column.searchValue
    ? column.searchValue(row)
    : (row as Record<string, unknown>)[column.key]
  return value === null || value === undefined ? '' : String(value)
}

// A blank filter matches everything; otherwise the cell text must contain the
// trimmed needle, case-insensitively (the same rule the shared search uses).
export function matchesColumnFilter<T>(
  column: DataTableColumn<T>,
  row: T,
  query: string | undefined,
): boolean {
  const needle = (query ?? '').trim().toLowerCase()
  if (needle === '') {
    return true
  }
  return columnFilterText(column, row).toLowerCase().includes(needle)
}

// Applies every active filterable column's text (AND across columns). Columns
// without `filterable` and columns whose text is blank are ignored, so a caller
// can keep filter state for a hidden/locked column without narrowing rows.
export function applyColumnFilters<T>(
  rows: T[],
  columns: DataTableColumn<T>[],
  filters: ColumnFilters,
): T[] {
  const active = columns.filter(
    column => column.filterable && (filters[column.key] ?? '').trim() !== '',
  )
  if (active.length === 0) {
    return rows
  }
  return rows.filter(row => active.every(column => matchesColumnFilter(column, row, filters[column.key])))
}

// The suggestion list for a column's filter field: its distinct non-empty cell
// values, locale-sorted with numeric collation, capped so a wide table's panel
// stays light. A caller can override the list with `filterOptions`.
export function collectFilterOptions<T>(
  rows: T[],
  column: DataTableColumn<T>,
  limit = 50,
): SelectOption[] {
  const seen = new Set<string>()
  for (const row of rows) {
    const text = columnFilterText(column, row)
    if (text !== '') {
      seen.add(text)
    }
  }
  return [...seen]
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .slice(0, limit)
}
