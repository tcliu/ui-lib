import type { DataTableColumn, DataTablePagination, SortDirection } from './DataTable.svelte'
import { applyColumnFilters, type ColumnFilters } from './table-column-filters'

// The client-side controller behind `DataTable`'s `model` prop: it owns the
// search filter, the sort order, the page slice, and the selection set, so the
// table stays a presenter and a page that wants the same behavior does not
// re-wire four state machines.
//
// The pipeline order is fixed: column filters -> filter (searchable columns
// only) -> sort -> page. The search term and a column filter reset the page, the
// page clamps when the result set shrinks, and the selection is pruned to the
// filtered rows so a hidden row never stays selected behind a filter.
//
// Reactivity arrives through getters, like the other composables: the caller's
// `$state` rows and `$derived` columns are re-read on every recompute. The
// model registers no effect of its own, so it can be created in a component or
// exercised directly in a test.

export interface TableModelOptions<T> {
  rows: () => T[]
  rowId: (row: T) => string
  // Columns the filter and the sort accessors read. A getter, because a caller
  // rebuilds localised columns when the locale changes.
  columns: () => DataTableColumn<T>[]
  // Rows per page; defaults to 20.
  pageSize?: number
  // Page-size choices offered by the footer; defaults to the Pagination set.
  pageSizeOptions?: number[]
  // `false` renders every filtered row and no footer.
  paginate?: boolean
  initialSortKey?: string | null
  initialSortDirection?: SortDirection
  // Per-column filter text to start from, keyed by column key. The model owns
  // the state afterwards (`filters`, `setFilter`, `clearFilters`).
  initialFilters?: ColumnFilters
  // Locale for the string comparator. Omitted falls back to the runtime locale,
  // so a caller that sorts only numeric/identifier columns needs nothing.
  locale?: () => string | undefined
}

export interface TableModel<T> {
  readonly rowId: (row: T) => string
  // The search term; assigning resets the page to the first one.
  searchValue: string
  // Per-column filter text keyed by column key (columns marked `filterable`).
  readonly filters: ColumnFilters
  // How many filterable columns carry a non-blank filter.
  readonly activeFilterCount: number
  readonly sortKey: string | null
  readonly sortDirection: SortDirection
  // The unfiltered source rows, so a column's filter suggestions stay complete
  // while the table itself is narrowed.
  readonly allRows: T[]
  readonly totalRows: number
  readonly filteredRows: T[]
  readonly sortedRows: T[]
  readonly pageRows: T[]
  readonly pageSize: number
  readonly currentPage: number
  readonly totalPages: number
  readonly hasMorePages: boolean
  // Footer config for `DataTable`: undefined when the model does not paginate.
  readonly pagination: DataTablePagination | undefined
  readonly selectedIds: Set<string>
  readonly selectedRows: T[]
  readonly allSelected: boolean
  readonly someSelected: boolean
  setSort(key: string, direction: SortDirection): void
  setPage(page: number): void
  setPageSize(size: number): void
  // Writes one column's filter text and returns to the first page.
  setFilter(key: string, text: string): void
  // Drops every column filter and returns to the first page.
  clearFilters(): void
  toggleSelection(id: string, checked: boolean): void
  // Selects the current page, or clears the selection when the page is already
  // fully selected.
  toggleAll(): void
  clearSelection(): void
}

export function createTableModel<T>(options: TableModelOptions<T>): TableModel<T> {
  const paginate = options.paginate ?? true

  let search = $state('')
  let sortKey = $state<string | null>(options.initialSortKey ?? null)
  let sortDirection = $state<SortDirection>(options.initialSortDirection ?? 'asc')
  let currentPage = $state(1)
  let pageSize = $state(options.pageSize ?? 20)
  let filters = $state<ColumnFilters>({ ...options.initialFilters })
  // Raw selection; reads go through the derived, pruned set below so a filter
  // hides a row without dropping its id from the caller's toggle history.
  let selection = $state<Set<string>>(new Set())

  const columns = $derived(options.columns())
  const sourceRows = $derived(options.rows())

  const searchableColumns = $derived(columns.filter(column => column.searchable))

  const activeFilterCount = $derived(
    columns.filter(column => column.filterable && (filters[column.key] ?? '').trim() !== '').length,
  )

  // Column filters run ahead of the search, so the page slice, the footer's
  // total, and the pruned selection all read the narrowed set.
  const columnFilteredRows = $derived(applyColumnFilters(sourceRows, columns, filters))

  const filteredRows = $derived.by(() => {
    const needle = search.trim().toLowerCase()
    if (needle === '' || searchableColumns.length === 0) {
      return columnFilteredRows
    }
    return columnFilteredRows.filter(row =>
      searchableColumns.some(column => {
        const value = column.searchValue
          ? column.searchValue(row)
          : (row as Record<string, unknown>)[column.key]
        return value !== null && value !== undefined && String(value).toLowerCase().includes(needle)
      }),
    )
  })

  function sortValue(column: DataTableColumn<T>, row: T): unknown {
    return column.sortValue ? column.sortValue(row) : (row as Record<string, unknown>)[column.key]
  }

  function compare(left: unknown, right: unknown, direction: number): number {
    // A missing value sorts last in either direction, so a reversed sort never
    // pulls empty cells to the top.
    const leftMissing = left === null || left === undefined
    const rightMissing = right === null || right === undefined
    if (leftMissing || rightMissing) {
      return leftMissing === rightMissing ? 0 : leftMissing ? 1 : -1
    }
    if (typeof left === 'number' && typeof right === 'number') {
      return direction * (left - right)
    }
    return direction * String(left).localeCompare(String(right), options.locale?.(), { numeric: true })
  }

  const sortedRows = $derived.by(() => {
    if (sortKey === null) {
      return filteredRows
    }
    const column = columns.find(candidate => candidate.key === sortKey)
    if (!column) {
      return filteredRows
    }
    const direction = sortDirection === 'asc' ? 1 : -1
    return [...filteredRows].sort((left, right) =>
      compare(sortValue(column, left), sortValue(column, right), direction),
    )
  })

  const totalPages = $derived(Math.max(1, Math.ceil(sortedRows.length / Math.max(1, pageSize))))
  // The rendered page, clamped without writing the state back so a result set
  // that grows again can restore the page the caller had.
  const visiblePage = $derived(Math.min(currentPage, totalPages))
  const hasMorePages = $derived(paginate && sortedRows.length > pageSize)
  const pageRows = $derived(
    paginate
      ? sortedRows.slice((visiblePage - 1) * pageSize, visiblePage * pageSize)
      : sortedRows,
  )

  const liveIds = $derived(new Set(filteredRows.map(options.rowId)))
  const selectedIds = $derived(new Set([...selection].filter(id => liveIds.has(id))))
  const selectedRows = $derived(sortedRows.filter(row => selectedIds.has(options.rowId(row))))
  const allSelected = $derived(
    pageRows.length > 0 && pageRows.every(row => selectedIds.has(options.rowId(row))),
  )
  const someSelected = $derived(selectedIds.size > 0 && !allSelected)

  const pagination = $derived<DataTablePagination | undefined>(
    paginate
      ? {
          total: sortedRows.length,
          pageSize,
          currentPage: visiblePage,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
          pageSizeOptions: options.pageSizeOptions,
        }
      : undefined,
  )

  function setSort(key: string, direction: SortDirection): void {
    sortKey = key
    sortDirection = direction
  }

  function setPage(page: number): void {
    currentPage = Math.min(Math.max(1, Math.trunc(page)), totalPages)
  }

  function setPageSize(size: number): void {
    pageSize = Math.max(1, size)
    currentPage = 1
  }

  function setFilter(key: string, text: string): void {
    filters = { ...filters, [key]: text }
    currentPage = 1
  }

  function clearFilters(): void {
    filters = {}
    currentPage = 1
  }

  function toggleSelection(id: string, checked: boolean): void {
    // Rebuild from the pruned set, so a stale id cannot come back when the
    // filter that hid it is cleared.
    const next = new Set(selectedIds)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    selection = next
  }

  function toggleAll(): void {
    selection = allSelected ? new Set() : new Set(pageRows.map(options.rowId))
  }

  function clearSelection(): void {
    selection = new Set()
  }

  return {
    get rowId() {
      return options.rowId
    },
    get searchValue() {
      return search
    },
    set searchValue(next: string) {
      search = next
      currentPage = 1
    },
    get filters() {
      return filters
    },
    get activeFilterCount() {
      return activeFilterCount
    },
    // A caller that resets the table programmatically uses the same path the
    // search field does, so the page always returns to the first one.
    get sortKey() {
      return sortKey
    },
    get sortDirection() {
      return sortDirection
    },
    get totalRows() {
      return sortedRows.length
    },
    get allRows() {
      return sourceRows
    },
    get filteredRows() {
      return filteredRows
    },
    get sortedRows() {
      return sortedRows
    },
    get pageRows() {
      return pageRows
    },
    get pageSize() {
      return pageSize
    },
    get currentPage() {
      return visiblePage
    },
    get totalPages() {
      return totalPages
    },
    get hasMorePages() {
      return hasMorePages
    },
    get pagination() {
      return pagination
    },
    get selectedIds() {
      return selectedIds
    },
    get selectedRows() {
      return selectedRows
    },
    get allSelected() {
      return allSelected
    },
    get someSelected() {
      return someSelected
    },
    setSort,
    setPage,
    setPageSize,
    setFilter,
    clearFilters,
    toggleSelection,
    toggleAll,
    clearSelection,
  }
}
