<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import DataTable, { type DataTableColumn } from '$lib/components/DataTable.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import NumberInput from '$lib/components/NumberInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import ShowcaseStage from '$lib/showcase/ShowcaseStage.svelte'
  import {
    buildDataTableSnippet,
    PAGE_SIZE_OPTIONS,
    TABLE_STAGE_PANE,
    TABLE_STAGE_PANE_FILL,
    type DemoRow,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  const rows: DemoRow[] = [
    { id: 'p1', name: 'Catalog', status: 'Active' },
    { id: 'p2', name: 'Editor', status: 'Active' },
    { id: 'p3', name: 'Viewer', status: 'Draft' },
    { id: 'p4', name: 'Sync', status: 'Active' },
    { id: 'p5', name: 'Archive', status: 'Draft' },
    { id: 'p6', name: 'Portal', status: 'Active' },
    ...Array.from({ length: 24 }, (_, index) => {
      const n = index + 7
      return {
        id: `p${n}`,
        name: `Module ${n}`,
        status: n % 3 === 0 ? 'Draft' : 'Active',
      }
    }),
  ]

  let hidden = $state(new Set<string>())

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.

  let pgShowSearch = $state<TriState>('')
  let pgShowPagination = $state<TriState>('')
  let pgSelectable = $state<TriState>('')
  let pgDense = $state<TriState>('')
  let pgResizable = $state<TriState>('')
  let pgLoading = $state<TriState>('')
  let pgFillHeight = $state<TriState>('')
  let pgBodyScroll = $state<TriState>('')
  let pgPlaceholder = $state('')
  let pgEmptyMessage = $state('')
  let pgPageSizeText = $state('')
  let pgQuery = $state('')
  let pgPage = $state(1)
  let pgSortKey = $state<string | null>(null)
  let pgSortDirection = $state<'asc' | 'desc'>('asc')
  let pgSelected = $state(new Set<string>())
  const pgPageSize = $derived.by(() => {
    const parsed = Number.parseInt(pgPageSizeText, 10)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 10
  })

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const showSearch = $derived(flagOn(pgShowSearch))
  const showPagination = $derived(flagOn(pgShowPagination))
  const selectable = $derived(flagOn(pgSelectable))
  const dense = $derived(flagOn(pgDense))
  const resizable = $derived(flagOn(pgResizable))
  const loading = $derived(flagOn(pgLoading))
  const fillHeight = $derived(flagOn(pgFillHeight))
  const bodyScroll = $derived(flagOn(pgBodyScroll))
  const stagePaneClass = $derived(pgFillHeight === 'yes' ? TABLE_STAGE_PANE_FILL : TABLE_STAGE_PANE)

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(
    pgShowSearch !== '' ||
      pgShowPagination !== '' ||
      pgSelectable !== '' ||
      pgDense !== '' ||
      pgResizable !== '' ||
      pgLoading !== '' ||
      pgFillHeight !== '' ||
      pgBodyScroll !== '' ||
      pgPlaceholder !== '' ||
      pgEmptyMessage !== '' ||
      pgPageSizeText !== '',
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgShowSearch = ''
    pgShowPagination = ''
    pgSelectable = ''
    pgDense = ''
    pgResizable = ''
    pgLoading = ''
    pgFillHeight = ''
    pgBodyScroll = ''
    pgPlaceholder = ''
    pgEmptyMessage = ''
    pgPageSizeText = ''
    pgQuery = ''
    pgPage = 1
    pgSortKey = null
    pgSortDirection = 'asc'
    pgSelected = new Set<string>()
  }

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
    size: number,
  ): DemoRow[] {
    const filtered = all.filter(row => matches(row, text))
    const sorted =
      key === 'name'
        ? [...filtered].sort((a, b) =>
            direction === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name),
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

  function toggleColumn(set: Set<string>, id: string, checked: boolean): Set<string> {
    const next = new Set(set)
    if (checked) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return next
  }

  // Fresh empty set behind a helper: assigning `new Set()` inline makes the
  // snippet compiler emit a legacy `init()` call, which throws when the
  // playground mounts the snippet at the root.
  function clearedColumns(): Set<string> {
    return new Set<string>()
  }

  const columns: DataTableColumn<DemoRow>[] = [
    { key: 'id', header: 'ID', cell: idCell },
    { key: 'name', header: 'Name', sortable: true, searchable: true, cell: nameCell },
    { key: 'status', header: 'Status', searchable: true, cell: statusCell },
  ]

  // Snippet-facing scope helpers. The generated Show-code source destructures
  // these from `scope`, so it reads as a clean prop list instead of inline glue
  // over the demo's local state; the live demo binds the same helpers, keeping
  // snippet and demo in lockstep.
  const visibleColumns = $derived(columns.filter(column => !hidden.has(column.key)))
  const chooserEntries = $derived(
    columns.map(column => ({
      key: column.key,
      header: column.header,
      checked: !hidden.has(column.key),
    })),
  )
  const pageRows = $derived(visibleRows(rows, pgQuery, pgSortKey, pgSortDirection, pgPage, pgPageSize))
  const rowTotal = $derived(visibleTotal(rows, pgQuery))
  const allRowsSelected = $derived(pgSelected.size > 0 && pgSelected.size === rows.length)
  const someRowsSelected = $derived(pgSelected.size > 0 && pgSelected.size < rows.length)

  function handleSearchInput() {
    pgPage = 1
  }
  function handleToggleColumn(key: string, checked: boolean) {
    hidden = toggleColumn(hidden, key, checked)
  }
  function handleResetColumns() {
    hidden = clearedColumns()
  }
  function handlePageChange(page: number) {
    pgPage = page
  }
  function handlePageSizeChange(size: number) {
    pgPageSizeText = String(size)
    pgPage = 1
  }
  function handleToggleSelection(id: string, checked: boolean) {
    pgSelected = toggleSelection(pgSelected, id, checked)
  }
  function handleToggleAll() {
    pgSelected = toggleAllSelected(
      pgSelected,
      rows.map(row => row.id),
    )
  }

  const code = $derived.by(() =>
    buildDataTableSnippet({
      rows,
      showSearch: pgShowSearch,
      showPagination: pgShowPagination,
      selectable: pgSelectable,
      dense: pgDense,
      resizable: pgResizable,
      loading: pgLoading,
      fillHeight: pgFillHeight,
      bodyScroll: pgBodyScroll,
      placeholder: pgPlaceholder,
      emptyMessage: pgEmptyMessage,
    }),
  )

  const props: PropRow[] = [
    {
      name: 'rows',
      type: 'T[]',
      defaultValue: '—',
      note: 'Rows on the current page; the caller filters, sorts, and slices.',
    },
    { name: 'rowId', type: '(row: T) => string', defaultValue: '—', note: 'Stable key per row.' },
    {
      name: 'columns',
      type: 'DataTableColumn<T>[]',
      defaultValue: '—',
      note: 'Column defs with optional cell renderers.',
    },
    { name: 'loading', type: 'boolean', defaultValue: 'false', note: 'Shows the spinner when there are no rows yet.' },
    { name: 'emptyMessage', type: 'string', defaultValue: "'No rows'", note: 'Shown when rows is empty.' },
    {
      name: 'searchValue',
      type: 'string',
      defaultValue: "''",
      note: 'Bindable search text; filtering stays with the caller.',
    },
    {
      name: 'searchAriaLabel',
      type: 'string',
      defaultValue: "'Search'",
      note: 'Accessible name for the search field.',
    },
    { name: 'searchPlaceholder', type: 'string', defaultValue: "'Search'", note: 'Search placeholder.' },
    { name: 'showSearch', type: 'boolean', defaultValue: 'true', note: 'Renders the search field.' },
    {
      name: 'chooserColumns',
      type: 'ChooserColumn[]',
      defaultValue: '—',
      note: 'Column selector entries; the chooser is omitted when undefined.',
    },
    {
      name: 'chooserLabel',
      type: 'string',
      defaultValue: "'Choose columns'",
      note: 'Accessible name for the column selector.',
    },
    {
      name: 'chooserResetLabel',
      type: 'string',
      defaultValue: "'Reset columns'",
      note: 'Accessible name for the reset button.',
    },
    { name: 'onToggleColumn', type: '(key, checked) => void', defaultValue: '—', note: 'Column visibility handler.' },
    {
      name: 'onResetColumns',
      type: '() => void',
      defaultValue: '—',
      note: 'Reset handler; the caller also bumps resetWidthsSignal to drop resized widths.',
    },
    {
      name: 'paginationTrailing',
      type: 'Snippet',
      defaultValue: '—',
      note: 'Arbitrary content for the pagination row’s right edge.',
    },
    { name: 'selectable', type: 'boolean', defaultValue: 'false', note: 'Renders the checkbox column.' },
    { name: 'selectedIds', type: 'Set<string>', defaultValue: '—', note: 'Selected row ids; managed by the caller.' },
    { name: 'onToggleSelection', type: '(id, checked) => void', defaultValue: '—', note: 'Row checkbox handler.' },
    { name: 'onToggleAll', type: '() => void', defaultValue: '—', note: 'Header checkbox handler.' },
    { name: 'total', type: 'number', defaultValue: '—', note: 'Total rows across all pages.' },
    { name: 'pageSize', type: 'number', defaultValue: '—', note: 'Rows per page.' },
    { name: 'currentPage', type: 'number', defaultValue: '—', note: 'One-based current page.' },
    { name: 'onPageChange', type: '(page: number) => void', defaultValue: '—', note: 'Page navigation handler.' },
    { name: 'onPageSizeChange', type: '(size: number) => void', defaultValue: '—', note: 'Page-size handler.' },
    {
      name: 'pageSizeOptions',
      type: 'number[]',
      defaultValue: '[10, 20, 50]',
      note: 'Page-size choices offered by the pagination dropdown.',
    },
    {
      name: 'tableClass',
      type: 'string',
      defaultValue: "'min-w-0'",
      note: 'Extra classes for the table element; raise the minimum width when columns need a horizontal scroll floor.',
    },
    { name: 'fillHeight', type: 'boolean', defaultValue: 'false', note: 'Fills the parent; table body scrolls.' },
    {
      name: 'bodyScroll',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Fixed header band with a body-only scrollport (needs fillHeight).',
    },
    { name: 'showPagination', type: 'boolean', defaultValue: 'true', note: 'Renders the pagination footer.' },
    { name: 'dense', type: 'boolean', defaultValue: 'false', note: 'Compact padding for panel tables.' },
    { name: 'sortKey', type: 'string | null', defaultValue: 'null', note: 'Bindable active sort column.' },
    { name: 'sortDirection', type: "'asc' | 'desc'", defaultValue: "'asc'", note: 'Bindable sort direction.' },
    {
      name: 'onSort',
      type: '(key, direction) => void',
      defaultValue: '—',
      note: 'Sort handler; or bind sortKey/sortDirection.',
    },
    { name: 'resizable', type: 'boolean', defaultValue: 'false', note: 'Draggable column resize handles.' },
    { name: 'storageKey', type: 'string', defaultValue: '—', note: 'Persists resized widths under this key.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet nameCell(row: DemoRow)}
  <strong class="font-medium text-slate-100">{row.name}</strong>
{/snippet}

{#snippet statusCell(row: DemoRow)}
  <span class="text-slate-300">{row.status}</span>
{/snippet}

{#snippet idCell(row: DemoRow)}
  <span class="font-mono text-slate-400">{row.id}</span>
{/snippet}

{#snippet tableTrailing()}
  <span class="text-xs text-slate-400">{rowTotal} rows</span>
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Show search">
      <SelectDropdown
        buttonLabel={triLabel(pgShowSearch)}
        activeValue={pgShowSearch}
        ariaLabel="Show search"
        options={yesNoOptions}
        onSelect={value => (pgShowSearch = value as TriState)}
        clearable
        clearLabel="Clear show search"
        onClear={() => (pgShowSearch = '')} />
    </FormField>
    <FormField label="Show pagination">
      <SelectDropdown
        buttonLabel={triLabel(pgShowPagination)}
        activeValue={pgShowPagination}
        ariaLabel="Show pagination"
        options={yesNoOptions}
        onSelect={value => (pgShowPagination = value as TriState)}
        clearable
        clearLabel="Clear show pagination"
        onClear={() => (pgShowPagination = '')} />
    </FormField>
    <FormField label="Selectable rows">
      <SelectDropdown
        buttonLabel={triLabel(pgSelectable)}
        activeValue={pgSelectable}
        ariaLabel="Selectable rows"
        options={yesNoOptions}
        onSelect={value => (pgSelectable = value as TriState)}
        clearable
        clearLabel="Clear selectable rows"
        onClear={() => (pgSelectable = '')} />
    </FormField>
    <FormField label="Dense padding">
      <SelectDropdown
        buttonLabel={triLabel(pgDense)}
        activeValue={pgDense}
        ariaLabel="Dense padding"
        options={yesNoOptions}
        onSelect={value => (pgDense = value as TriState)}
        clearable
        clearLabel="Clear dense padding"
        onClear={() => (pgDense = '')} />
    </FormField>
    <FormField label="Resizable columns">
      <SelectDropdown
        buttonLabel={triLabel(pgResizable)}
        activeValue={pgResizable}
        ariaLabel="Resizable columns"
        options={yesNoOptions}
        onSelect={value => (pgResizable = value as TriState)}
        clearable
        clearLabel="Clear resizable columns"
        onClear={() => (pgResizable = '')} />
    </FormField>
    <FormField label="Loading">
      <SelectDropdown
        buttonLabel={triLabel(pgLoading)}
        activeValue={pgLoading}
        ariaLabel="Loading"
        options={yesNoOptions}
        onSelect={value => (pgLoading = value as TriState)}
        clearable
        clearLabel="Clear loading"
        onClear={() => (pgLoading = '')} />
    </FormField>
    <FormField label="Fill height">
      <SelectDropdown
        buttonLabel={triLabel(pgFillHeight)}
        activeValue={pgFillHeight}
        ariaLabel="Fill height"
        options={yesNoOptions}
        onSelect={value => {
          pgFillHeight = value as TriState
          // The pinned-pagination fill also needs the fixed header band, so
          // enabling Fill height fills the visible Body scroll field too.
          pgBodyScroll = value === 'yes' ? 'yes' : ''
        }}
        clearable
        clearLabel="Clear fill height"
        onClear={() => {
          pgFillHeight = ''
          pgBodyScroll = ''
        }} />
    </FormField>
    <FormField label="Body scroll">
      <SelectDropdown
        buttonLabel={triLabel(pgBodyScroll)}
        activeValue={pgBodyScroll}
        ariaLabel="Body scroll"
        options={yesNoOptions}
        onSelect={value => {
          pgBodyScroll = value as TriState
          if (value === 'yes') pgFillHeight = 'yes'
        }}
        clearable
        clearLabel="Clear body scroll"
        onClear={() => (pgBodyScroll = '')} />
    </FormField>
    <FormField label="Search placeholder" htmlFor="pg-placeholder">
      <input
        id="pg-placeholder"
        bind:value={pgPlaceholder}
        placeholder="Search"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Empty message" htmlFor="pg-empty">
      <input
        id="pg-empty"
        bind:value={pgEmptyMessage}
        placeholder="No rows"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Page size" htmlFor="pg-pagesize">
      <NumberInput
        id="pg-pagesize"
        bind:value={pgPageSizeText}
        min={1}
        placeholder="10"
        ariaLabel="Page size"
        showControls={false}
        className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-400" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="DataTable" props={propsSnippet} wide>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{
      hidden,
      pgQuery,
      pgPage,
      pgPageSize,
      pgSortKey,
      pgSortDirection,
      pgShowSearch,
      pgShowPagination,
      pgSelectable,
      pgDense,
      pgResizable,
      pgPlaceholder,
      pgEmptyMessage,
      pgSelected,
      visibleRows,
      visibleTotal,
      toggleSelection,
      toggleAllSelected,
      handleSearchInput,
      handleToggleColumn,
      handleResetColumns,
      handlePageChange,
      handlePageSizeChange,
    }}>
    <ShowcaseStage paneClass={stagePaneClass} showHandle={false}>
      <DataTable
        rows={pageRows}
        columns={visibleColumns}
        rowId={row => row.id}
        searchAriaLabel="Search rows"
        bind:searchValue={pgQuery}
        onSearchInput={handleSearchInput}
        {showSearch}
        searchPlaceholder={pgPlaceholder || undefined}
        emptyMessage={pgEmptyMessage || undefined}
        {showPagination}
        chooserColumns={chooserEntries}
        onToggleColumn={handleToggleColumn}
        onResetColumns={handleResetColumns}
        paginationTrailing={tableTrailing}
        bind:sortKey={pgSortKey}
        bind:sortDirection={pgSortDirection}
        total={rowTotal}
        pageSize={pgPageSize}
        currentPage={pgPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        {selectable}
        selectedIds={pgSelected}
        onToggleSelection={handleToggleSelection}
        onToggleAll={handleToggleAll}
        allSelected={allRowsSelected}
        someSelected={someRowsSelected}
        selectAllAriaLabel="Select all rows"
        rowSelectAriaLabel={row => `Select ${row.name}`}
        {dense}
        {fillHeight}
        {bodyScroll}
        {resizable}
        resizeAriaLabel={column => `Resize ${column.header}`}
        {loading} />
    </ShowcaseStage>
  </ShowcaseSection>
</ShowcasePage>
