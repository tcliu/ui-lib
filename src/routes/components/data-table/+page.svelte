<script lang="ts">
  import DataTable, { type DataTableColumn } from '$lib/components/DataTable.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  interface DemoRow {
    id: string
    name: string
    status: string
  }

  const rows: DemoRow[] = [
    { id: 'p1', name: 'Catalog', status: 'Active' },
    { id: 'p2', name: 'Editor', status: 'Active' },
    { id: 'p3', name: 'Viewer', status: 'Draft' },
    { id: 'p4', name: 'Sync', status: 'Active' },
    { id: 'p5', name: 'Archive', status: 'Draft' },
    { id: 'p6', name: 'Portal', status: 'Active' },
  ]

  let query = $state('')
  let currentPage = $state(1)
  let pageSize = $state(4)
  let sortKey = $state<string | null>(null)
  let sortDirection = $state<'asc' | 'desc'>('asc')
  let selected = $state(new Set<string>())

  function matches(row: DemoRow, text: string): boolean {
    const needle = text.toLowerCase()
    return row.name.toLowerCase().includes(needle) || row.status.toLowerCase().includes(needle)
  }

  function visibleRows(
    all: DemoRow[],
    text: string,
    key: string | null,
    direction: 'asc' | 'desc',
    page: number,
    size: number
  ): DemoRow[] {
    const filtered = all.filter(row => matches(row, text))
    const sorted =
      key === 'name'
        ? [...filtered].sort((a, b) =>
            direction === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
          )
        : filtered
    return sorted.slice((page - 1) * size, page * size)
  }

  function visibleTotal(all: DemoRow[], text: string): number {
    return all.filter(row => matches(row, text)).length
  }

  function toggleSelection(set: Set<string>, id: string, checked: boolean): Set<string> {
    const next = new Set(set)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    return next
  }

  function toggleAllSelected(set: Set<string>, ids: string[]): Set<string> {
    return set.size === ids.length && ids.length > 0 ? new Set<string>() : new Set(ids)
  }

  const columns: DataTableColumn<DemoRow>[] = [
    { key: 'name', header: 'Name', sortable: true, searchable: true, cell: nameCell },
    { key: 'status', header: 'Status', searchable: true, cell: statusCell },
    { key: 'id', header: 'ID' },
  ]

  const codeDefault = `{#snippet nameCell(row)}
  <strong class="font-medium text-slate-100">{row.name}</strong>
{/snippet}
{#snippet statusCell(row)}
  <span class="text-slate-300">{row.status}</span>
{/snippet}
<DataTable
  rows={visibleRows(rows, query, sortKey, sortDirection, currentPage, pageSize)}
  columns={columns}
  rowId={row => row.id}
  searchAriaLabel="Search rows"
  bind:searchValue={query}
  onSearchInput={() => (currentPage = 1)}
  bind:sortKey={sortKey}
  bind:sortDirection={sortDirection}
  total={visibleTotal(rows, query)}
  pageSize={pageSize}
  currentPage={currentPage}
  onPageChange={page => (currentPage = page)}
  onPageSizeChange={size => (pageSize = size)} />`

  const codeCustomized = `{#snippet nameCell(row)}
  <strong class="font-medium text-slate-100">{row.name}</strong>
{/snippet}
{#snippet statusCell(row)}
  <span class="text-slate-300">{row.status}</span>
{/snippet}
<DataTable
  rows={visibleRows(rows, query, sortKey, sortDirection, currentPage, pageSize)}
  columns={columns}
  rowId={row => row.id}
  searchAriaLabel="Search rows"
  bind:searchValue={query}
  onSearchInput={() => (currentPage = 1)}
  bind:sortKey={sortKey}
  bind:sortDirection={sortDirection}
  total={visibleTotal(rows, query)}
  pageSize={pageSize}
  currentPage={currentPage}
  onPageChange={page => (currentPage = page)}
  onPageSizeChange={size => (pageSize = size)}
  selectable
  selectedIds={selected}
  onToggleSelection={(id, checked) => (selected = toggleSelection(selected, id, checked))}
  onToggleAll={() => (selected = toggleAllSelected(selected, rows.map(row => row.id)))}
  allSelected={selected.size > 0 && selected.size === rows.length}
  someSelected={selected.size > 0 && selected.size < rows.length}
  selectAllAriaLabel="Select all rows"
  rowSelectAriaLabel={row => \`Select \${row.name}\`}
  dense />`

  const props: PropRow[] = [
    { name: 'rows', type: 'T[]', defaultValue: '—', note: 'Rows on the current page; the caller filters, sorts, and slices.' },
    { name: 'rowId', type: '(row: T) => string', defaultValue: '—', note: 'Stable key per row.' },
    { name: 'columns', type: 'DataTableColumn<T>[]', defaultValue: '—', note: 'Column defs with optional cell renderers.' },
    { name: 'loading', type: 'boolean', defaultValue: 'false', note: 'Shows the spinner when there are no rows yet.' },
    { name: 'emptyMessage', type: 'string', defaultValue: "'No rows'", note: 'Shown when rows is empty.' },
    { name: 'searchValue', type: 'string', defaultValue: "''", note: 'Bindable search text; filtering stays with the caller.' },
    { name: 'searchAriaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the search field.' },
    { name: 'searchPlaceholder', type: 'string', defaultValue: "'Search'", note: 'Search placeholder.' },
    { name: 'showSearch', type: 'boolean', defaultValue: 'true', note: 'Renders the search field.' },
    { name: 'selectable', type: 'boolean', defaultValue: 'false', note: 'Renders the checkbox column.' },
    { name: 'selectedIds', type: 'Set<string>', defaultValue: '—', note: 'Selected row ids; managed by the caller.' },
    { name: 'onToggleSelection', type: '(id, checked) => void', defaultValue: '—', note: 'Row checkbox handler.' },
    { name: 'onToggleAll', type: '() => void', defaultValue: '—', note: 'Header checkbox handler.' },
    { name: 'total', type: 'number', defaultValue: '—', note: 'Total rows across all pages.' },
    { name: 'pageSize', type: 'number', defaultValue: '—', note: 'Rows per page.' },
    { name: 'currentPage', type: 'number', defaultValue: '—', note: 'One-based current page.' },
    { name: 'onPageChange', type: '(page: number) => void', defaultValue: '—', note: 'Page navigation handler.' },
    { name: 'onPageSizeChange', type: '(size: number) => void', defaultValue: '—', note: 'Page-size handler.' },
    { name: 'fillHeight', type: 'boolean', defaultValue: 'false', note: 'Fills the parent; table body scrolls.' },
    { name: 'showPagination', type: 'boolean', defaultValue: 'true', note: 'Renders the pagination footer.' },
    { name: 'dense', type: 'boolean', defaultValue: 'false', note: 'Compact padding for panel tables.' },
    { name: 'sortKey', type: 'string | null', defaultValue: 'null', note: 'Bindable active sort column.' },
    { name: 'sortDirection', type: "'asc' | 'desc'", defaultValue: "'asc'", note: 'Bindable sort direction.' },
    { name: 'onSort', type: '(key, direction) => void', defaultValue: '—', note: 'Sort handler; or bind sortKey/sortDirection.' },
    { name: 'resizable', type: 'boolean', defaultValue: 'false', note: 'Draggable column resize handles.' },
    { name: 'storageKey', type: 'string', defaultValue: '—', note: 'Persists resized widths under this key.' },
  ]
</script>

{#snippet nameCell(row: DemoRow)}
  <strong class="font-medium text-slate-100">{row.name}</strong>
{/snippet}

{#snippet statusCell(row: DemoRow)}
  <span class="text-slate-300">{row.status}</span>
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="DataTable" props={propsSnippet}>
  <ShowcaseSection
    title={i18n.t('showcase.default')}
    code={codeDefault}
    scope={{ rows, columns, query, currentPage, pageSize, sortKey, sortDirection, visibleRows, visibleTotal }}>
    <DataTable
      rows={visibleRows(rows, query, sortKey, sortDirection, currentPage, pageSize)}
      columns={columns}
      rowId={row => row.id}
      searchAriaLabel="Search rows"
      bind:searchValue={query}
      onSearchInput={() => (currentPage = 1)}
      bind:sortKey={sortKey}
      bind:sortDirection={sortDirection}
      total={visibleTotal(rows, query)}
      pageSize={pageSize}
      currentPage={currentPage}
      onPageChange={page => (currentPage = page)}
      onPageSizeChange={size => (pageSize = size)} />
  </ShowcaseSection>

  <ShowcaseSection
    title={i18n.t('showcase.customized')}
    code={codeCustomized}
    scope={{
      rows,
      columns,
      query,
      currentPage,
      pageSize,
      sortKey,
      sortDirection,
      selected,
      visibleRows,
      visibleTotal,
      toggleSelection,
      toggleAllSelected
    }}>
    <DataTable
      rows={visibleRows(rows, query, sortKey, sortDirection, currentPage, pageSize)}
      columns={columns}
      rowId={row => row.id}
      searchAriaLabel="Search rows"
      bind:searchValue={query}
      onSearchInput={() => (currentPage = 1)}
      bind:sortKey={sortKey}
      bind:sortDirection={sortDirection}
      total={visibleTotal(rows, query)}
      pageSize={pageSize}
      currentPage={currentPage}
      onPageChange={page => (currentPage = page)}
      onPageSizeChange={size => (pageSize = size)}
      selectable
      selectedIds={selected}
      onToggleSelection={(id, checked) => (selected = toggleSelection(selected, id, checked))}
      onToggleAll={() => (selected = toggleAllSelected(selected, rows.map(row => row.id)))}
      allSelected={selected.size > 0 && selected.size === rows.length}
      someSelected={selected.size > 0 && selected.size < rows.length}
      selectAllAriaLabel="Select all rows"
  rowSelectAriaLabel={row => `Select ${row.name}`}
      dense />
  </ShowcaseSection>
</ShowcasePage>
