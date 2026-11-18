import { describe, expect, it } from 'vitest'
import type { DataTableColumn } from './DataTable.svelte'
import { createTableModel } from './use-table-model.svelte'

interface Row {
  id: number
  name: string
  amount: number | null
  status: string
}

const ROWS: Row[] = [
  { id: 1, name: 'zeta', amount: 300, status: 'OPEN' },
  { id: 2, name: 'alpha', amount: 100, status: 'CLOSED' },
  { id: 3, name: 'beta', amount: null, status: 'OPEN' },
  { id: 4, name: 'item10', amount: 20, status: 'OPEN' },
  { id: 5, name: 'item2', amount: 40, status: 'OPEN' },
]

function makeRows(): Row[] {
  return ROWS.map(row => ({ ...row }))
}

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', searchable: true },
  { key: 'amount', header: 'Amount', sortable: true, num: true },
  { key: 'status', header: 'Status' },
]

function setup(pageSize = 2) {
  const rows = makeRows()
  const model = createTableModel<Row>({
    rows: () => rows,
    rowId: row => String(row.id),
    columns: () => COLUMNS,
    pageSize,
  })
  return { rows, model }
}

describe('createTableModel', () => {
  it('defaults to 20 rows per page', () => {
    const rows = makeRows()
    const model = createTableModel<Row>({
      rows: () => rows,
      rowId: row => String(row.id),
      columns: () => COLUMNS,
    })
    expect(model.pageSize).toBe(20)
    expect(model.pagination?.pageSize).toBe(20)
    expect(model.pageRows).toHaveLength(rows.length)
  })

  it('filters on the searchable columns only and narrows before paging', () => {
    const { model } = setup()
    // `name` is the only searchable column, so a status term matches nothing.
    model.searchValue = 'OPEN'
    expect(model.filteredRows).toEqual([])
    expect(model.pageRows).toEqual([])

    model.searchValue = 'item'
    expect(model.filteredRows.map(row => row.id)).toEqual([4, 5])
    expect(model.pageRows.map(row => row.id)).toEqual([4, 5])
  })

  it('matches case-insensitively and resets the page on a new term', () => {
    const { model } = setup()
    model.setPage(2)
    model.searchValue = 'ALPHA'
    expect(model.filteredRows.map(row => row.id)).toEqual([2])
    expect(model.currentPage).toBe(1)
    expect(model.pageRows.map(row => row.id)).toEqual([2])
  })

  it('uses a column searchValue accessor when the key is not a row property', () => {
    const rows = makeRows()
    const model = createTableModel<Row>({
      rows: () => rows,
      rowId: row => String(row.id),
      columns: () => [
        { key: 'label', header: 'Label', searchable: true, searchValue: row => `#${row.id} ${row.name}` },
      ],
      pageSize: 10,
    })
    model.searchValue = '#3'
    expect(model.filteredRows.map(row => row.id)).toEqual([3])
  })

  it('sorts ascending and descending by a sortValue accessor, keeping nulls last', () => {
    const rows = makeRows()
    const model = createTableModel<Row>({
      rows: () => rows,
      rowId: row => String(row.id),
      columns: () => COLUMNS,
      pageSize: 10,
    })
    model.setSort('amount', 'asc')
    expect(model.sortedRows.map(row => row.id)).toEqual([4, 5, 2, 1, 3])
    model.setSort('amount', 'desc')
    expect(model.sortedRows.map(row => row.id)).toEqual([1, 2, 5, 4, 3])
  })

  it('compares strings numerically and exposes the active sort state', () => {
    const { model } = setup(10)
    model.setSort('name', 'asc')
    expect(model.sortKey).toBe('name')
    expect(model.sortDirection).toBe('asc')
    expect(model.sortedRows.map(row => row.name)).toEqual([
      'alpha',
      'beta',
      'item2',
      'item10',
      'zeta',
    ])
  })

  it('slices the current page and reports whether another page exists', () => {
    const { model } = setup(2)
    expect(model.pageRows.map(row => row.id)).toEqual([1, 2])
    expect(model.totalPages).toBe(3)
    expect(model.hasMorePages).toBe(true)

    model.setPage(3)
    expect(model.pageRows.map(row => row.id)).toEqual([5])

    model.setPage(99)
    expect(model.currentPage).toBe(3)
  })

  it('renders every row and no footer when pagination is off', () => {
    const rows = makeRows()
    const model = createTableModel<Row>({
      rows: () => rows,
      rowId: row => String(row.id),
      columns: () => COLUMNS,
      paginate: false,
    })
    expect(model.pagination).toBeUndefined()
    expect(model.hasMorePages).toBe(false)
    expect(model.pageRows).toHaveLength(rows.length)
  })

  it('clamps the visible page when the result set shrinks', () => {
    const { model } = setup(2)
    model.setPage(3)
    expect(model.currentPage).toBe(3)
    model.searchValue = 'item'
    expect(model.currentPage).toBe(1)
    expect(model.pageRows.map(row => row.id)).toEqual([4, 5])
  })

  it('selects across pages, scopes select-all to the page, and clears', () => {
    const { model } = setup(2)
    model.toggleSelection('1', true)
    model.toggleSelection('3', true)
    expect([...model.selectedIds].sort()).toEqual(['1', '3'])
    expect(model.selectedRows.map(row => row.id)).toEqual([1, 3])

    // Page 1 holds rows 1 and 2; row 1 alone is not a full page.
    expect(model.allSelected).toBe(false)
    expect(model.someSelected).toBe(true)
    model.toggleAll()
    expect([...model.selectedIds].sort()).toEqual(['1', '2'])
    expect(model.allSelected).toBe(true)
    model.toggleAll()
    expect(model.selectedIds.size).toBe(0)

    model.toggleSelection('4', true)
    model.clearSelection()
    expect(model.selectedIds.size).toBe(0)
  })

  it('prunes a hidden row from the selection and does not resurrect it', () => {
    const { model } = setup(10)
    model.toggleSelection('1', true)
    model.searchValue = 'alpha'
    expect(model.selectedIds.size).toBe(0)
    expect(model.selectedRows).toEqual([])

    // Toggling while filtered rebuilds from the pruned set, so clearing the
    // filter leaves the hidden row unselected.
    model.toggleSelection('2', true)
    model.searchValue = ''
    expect([...model.selectedIds]).toEqual(['2'])
  })
})
