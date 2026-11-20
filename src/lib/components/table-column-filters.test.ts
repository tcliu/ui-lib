import { describe, expect, it } from 'vitest'
import type { DataTableColumn } from './DataTable.svelte'
import {
  applyColumnFilters,
  collectFilterOptions,
  columnFilterText,
  matchesColumnFilter,
  type ColumnFilters,
} from './table-column-filters'

interface Row {
  id: number
  name: string | null
  status: string
  amount: number
}

const ROWS: Row[] = [
  { id: 1, name: 'alpha', status: 'Active', amount: 10 },
  { id: 2, name: 'beta', status: 'Paused', amount: 200 },
  { id: 3, name: null, status: 'Active', amount: 30 },
  { id: 4, name: 'item2', status: 'Draft', amount: 40 },
  { id: 5, name: 'item10', status: 'Draft', amount: 50 },
]

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', filterable: true },
  { key: 'status', header: 'Status', filterable: true },
  { key: 'amount', header: 'Amount', filterable: true },
]

function keys(rows: Row[]): number[] {
  return rows.map(row => row.id)
}

function filters(value: ColumnFilters): ColumnFilters {
  return value
}

describe('columnFilterText', () => {
  it('reads the row property under the key', () => {
    expect(columnFilterText(COLUMNS[0], ROWS[0])).toBe('alpha')
    expect(columnFilterText(COLUMNS[2], ROWS[1])).toBe('200')
  })

  it('reads an empty string for a missing value', () => {
    expect(columnFilterText(COLUMNS[0], ROWS[2])).toBe('')
  })

  it('prefers the searchValue accessor over the row property', () => {
    const computed: DataTableColumn<Row> = {
      key: 'status',
      header: 'Status',
      searchValue: row => `${row.status} ${row.id}`,
    }
    expect(columnFilterText(computed, ROWS[0])).toBe('Active 1')
  })
})

describe('matchesColumnFilter', () => {
  it('matches everything for a blank or missing query', () => {
    expect(matchesColumnFilter(COLUMNS[0], ROWS[0], '')).toBe(true)
    expect(matchesColumnFilter(COLUMNS[0], ROWS[0], '   ')).toBe(true)
    expect(matchesColumnFilter(COLUMNS[0], ROWS[0], undefined)).toBe(true)
  })

  it('matches case-insensitively on a substring', () => {
    expect(matchesColumnFilter(COLUMNS[0], ROWS[0], 'ALP')).toBe(true)
    expect(matchesColumnFilter(COLUMNS[1], ROWS[0], 'act')).toBe(true)
    expect(matchesColumnFilter(COLUMNS[0], ROWS[0], 'beta')).toBe(false)
  })

  it('treats a missing cell as no match', () => {
    expect(matchesColumnFilter(COLUMNS[0], ROWS[2], 'alpha')).toBe(false)
  })
})

describe('applyColumnFilters', () => {
  it('returns the rows untouched when nothing is active', () => {
    expect(keys(applyColumnFilters(ROWS, COLUMNS, {}))).toEqual([1, 2, 3, 4, 5])
    expect(keys(applyColumnFilters(ROWS, COLUMNS, filters({ name: '  ' })))).toEqual([1, 2, 3, 4, 5])
  })

  it('ANDs every active column filter', () => {
    expect(keys(applyColumnFilters(ROWS, COLUMNS, filters({ name: 'a', status: 'Active' })))).toEqual([1])
  })

  it('filters numeric cells by their text', () => {
    expect(keys(applyColumnFilters(ROWS, COLUMNS, filters({ amount: '0' })))).toEqual([1, 2, 3, 4, 5])
    expect(keys(applyColumnFilters(ROWS, COLUMNS, filters({ amount: '20' })))).toEqual([2])
  })

  it('ignores a filter on a column that is not filterable', () => {
    const locked: DataTableColumn<Row>[] = [{ key: 'status', header: 'Status' }]
    expect(keys(applyColumnFilters(ROWS, locked, filters({ status: 'Active' })))).toEqual([1, 2, 3, 4, 5])
  })
})

describe('collectFilterOptions', () => {
  it('dedupes, drops blanks, and sorts with numeric collation', () => {
    expect(collectFilterOptions(ROWS, COLUMNS[1])).toEqual(['Active', 'Draft', 'Paused'])
    expect(collectFilterOptions(ROWS, COLUMNS[0])).toEqual(['alpha', 'beta', 'item2', 'item10'])
  })

  it('caps the list and reads the accessor', () => {
    const computed: DataTableColumn<Row> = {
      key: 'status',
      header: 'Status',
      searchValue: row => String(row.id),
    }
    expect(collectFilterOptions(ROWS, computed, 3)).toEqual(['1', '2', '3'])
  })
})
