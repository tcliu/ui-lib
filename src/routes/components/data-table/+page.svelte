<script lang="ts">
  import DataTable, { type DataTableColumn } from '$lib/components/DataTable.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import ShowcaseStage from '$showcase/ShowcaseStage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { textField, boolField, sizeField, jsonField, snippetDialog } from '$showcase/snippet-field'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/staged'
  import {
    buildDataTableSnippet,
    DEFAULT_ROWS,
    parseChooserColumnsJson,
    parseRowsJson,
    parseSearchKeysJson,
    parseSearchKeysValue,
    TABLE_STAGE_PANE,
    TABLE_STAGE_PANE_FILL,
    type DemoRow,
  } from './demo-snippet'
  import { type TriState } from '$showcase/snippet-build'

  const i18n = getI18nContext()

  // Fresh copy behind a helper so the demo never mutates the shared default.
  function freshRows(): DemoRow[] {
    return DEFAULT_ROWS.map(row => ({ ...row }))
  }

  let hidden = $state(new Set<string>())

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.

  const INITIAL = {
    showSearch: staged('yes' as TriState),
    showPagination: staged('' as TriState),
    selectable: staged('no' as TriState),
    dense: staged('no' as TriState),
    resizable: staged('no' as TriState),
    loading: staged('no' as TriState),
    fillHeight: staged('no' as TriState),
    bodyScroll: staged('no' as TriState),
    placeholder: staged('Search...'),
    emptyMessage: staged('No rows'),
    pageSizeText: '',
    query: staged('', true),
    page: 1,
    resetWidthsText: staged('0'),
    searchAriaLabel: staged('Search'),
    searchKeys: staged(null as string[] | null, true),
    rows: staged(freshRows() as DemoRow[], true),
    chooserLabel: staged('Choose columns'),
    chooserResetLabel: staged('Reset columns'),
    selectAllAriaLabel: staged('Select all'),
    allSelected: staged('' as TriState),
    someSelected: staged('' as TriState),
    containerClassName: staged(''),
    tableClassName: staged('min-w-0'),
    storageKey: staged(''),
    storagePrefix: staged(''),
    size: staged('md'),
    // Bound demo state: the eye resets these to their defaults, and the
    // binding stays, so they start applied.
    sortKey: staged(null as string | null, true),
    sortDirection: staged('asc' as 'asc' | 'desc', true),
    selected: new Set<string>(),
  }
  let pg = $state(structuredClone(INITIAL))
  // Eye toggles for the dialog rows below: `rows` is required content, so its
  // eye resets to the defaults; `searchKeys` is optional, so its eye omits
  // while off (the committed list stays in the dialog).
  // The sort-direction eye resets the bindable to its default instead of
  // omitting: the seed always binds `pgSortDirection`, so off-state data
  // equals the default and nothing visibly changes.
  // Demo rows edit through the rows dialog as JSON; the cleared form restores
  // the default set.
  const demoPageSize = $derived.by(() => {
    const parsed = Number.parseInt(pg.pageSizeText, 10)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 10
  })
  // The pagination row's trailing count suffix. The `pagination` object prop is
  // read-only, so the suffix is fixed demo data rather than a Value cell.
  const TRAILING_SUFFIX = 'rows'

  const showSearch = $derived(appliedFlag(pg.showSearch))
  const showPagination = $derived(appliedFlag(pg.showPagination))
  const selectable = $derived(appliedFlag(pg.selectable))
  const dense = $derived(appliedFlag(pg.dense))
  const resizable = $derived(appliedFlag(pg.resizable))
  const loading = $derived(appliedFlag(pg.loading))
  const fillHeight = $derived(appliedFlag(pg.fillHeight))
  const bodyScroll = $derived(appliedFlag(pg.bodyScroll))
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const stagePaneClass = $derived(
    pg.fillHeight.on && pg.fillHeight.value === 'yes' ? TABLE_STAGE_PANE_FILL : TABLE_STAGE_PANE,
  )

  // Fill height implies the fixed header band, so enabling it fills the Body
  // scroll field too; clearing it clears Body scroll. Enabling Body scroll
  // needs the fill-height parent, so it fills Fill height too.
  function applyFillHeight(value: string): void {
    stage(pg.fillHeight, value as TriState)
    stage(pg.bodyScroll, value === 'yes' ? 'yes' : 'no')
  }

  function applyBodyScroll(value: string): void {
    stage(pg.bodyScroll, value as TriState)
    if (value === 'yes') {
      stage(pg.fillHeight, 'yes')
    }
  }

  function clearPlayground() {
    pg = structuredClone(INITIAL)
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
  const pageRows = $derived(
    visibleRows(pg.rows.value, pg.query.value, pg.sortKey.value, pg.sortDirection.value, pg.page, demoPageSize),
  )
  const rowTotal = $derived(visibleTotal(pg.rows.value, pg.query.value))
  const allRowsSelected = $derived(pg.selected.size > 0 && pg.selected.size === pg.rows.value.length)
  const someRowsSelected = $derived(pg.selected.size > 0 && pg.selected.size < pg.rows.value.length)
  const demoResetWidths = $derived.by(() => {
    const value = applied(pg.resetWidthsText)
    if (value === undefined) return undefined
    const parsed = Number.parseInt(value, 10)
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
  })

  function handleSearchInput() {
    pg.page = 1
  }
  function handleToggleColumn(key: string, checked: boolean) {
    hidden = toggleColumn(hidden, key, checked)
  }
  function handleResetColumns() {
    hidden = clearedColumns()
  }
  function handlePageChange(page: number) {
    pg.page = page
  }
  function handlePageSizeChange(size: number) {
    pg.pageSizeText = String(size)
    pg.page = 1
  }
  function handleToggleSelection(id: string, checked: boolean) {
    pg.selected = toggleSelection(pg.selected, id, checked)
  }
  function handleToggleAll() {
    pg.selected = toggleAllSelected(
      pg.selected,
      pg.rows.value.map(row => row.id),
    )
  }

  const code = $derived.by(() =>
    buildDataTableSnippet({
      rows: pg.rows,
      showSearch: pg.showSearch,
      showPagination: pg.showPagination,
      selectable: pg.selectable,
      dense: pg.dense,
      resizable: pg.resizable,
      loading: pg.loading,
      fillHeight: pg.fillHeight,
      bodyScroll: pg.bodyScroll,
      placeholder: pg.placeholder,
      emptyMessage: pg.emptyMessage,
      trailing: TRAILING_SUFFIX,
      searchAriaLabel: pg.searchAriaLabel,
      searchKeys: pg.searchKeys,
      chooserLabel: pg.chooserLabel,
      chooserResetLabel: pg.chooserResetLabel,
      selectAllAriaLabel: pg.selectAllAriaLabel,
      allSelected: pg.allSelected,
      someSelected: pg.someSelected,
      containerClassName: pg.containerClassName,
      tableClassName: pg.tableClassName,
      storageKey: pg.storageKey,
      storagePrefix: pg.storagePrefix,
      resetWidthsSignal: pg.resetWidthsText,
      size: pg.size,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. Interaction
  // state (search text, page, total, page size) rides scope, so those rows
  // have an editor but no sync entry. Fill height and body scroll assign
  // plainly on snippet sync so a hand-edited line round-trips; the
  // Value-column coupling lives in the appliers above.
  const fields: SyncableFieldConfig[] = $derived([
    boolField({ name: 'allSelected', defaultValue: '—', note: 'Header checkbox checked state. Interaction override; unset follows the selection.', ...eyeFlag(pg.allSelected) }),
    boolField({ name: 'bodyScroll', type: 'boolean?', defaultValue: 'false', note: 'Fixed header band with a body-only scrollport (needs fillHeight).', ...eyeFlag(pg.bodyScroll), onChange: applyBodyScroll }),
    // Eye-free by design: the entries derive from the live hidden-column set
    // (interaction state outside the curated form), so there is no staged
    // eye to apply — the dialog edits the checked set directly.
    jsonField({
      name: 'chooserColumns',
      type: 'ChooserColumn[]?',
      note: 'Column selector entries; checked writes the hidden-column set.',
      value: JSON.stringify(chooserEntries, null, 2),
      onChange: (draft: string) => {
        const parsed = parseChooserColumnsJson(draft, columns)
        if (parsed) hidden = new Set(parsed.filter(entry => !entry.checked).map(entry => entry.key))
      },
      dialog: snippetDialog(
        (draft: string) => parseChooserColumnsJson(draft, columns),
        'Invalid chooser JSON. Use an array of { key, header, checked } over the demo columns.',
      ),
    }),
    textField({ name: 'chooserLabel', type: 'string?', defaultValue: "'Choose columns'", note: 'Accessible name for the column selector.', editorDefaultValue: 'Choose columns', clearable: true, placeholder: 'Choose columns', ...eye(pg.chooserLabel) }),
    textField({ name: 'chooserResetLabel', type: 'string?', defaultValue: "'Reset columns'", note: 'Accessible name for the reset button.', editorDefaultValue: 'Reset columns', clearable: true, placeholder: 'Reset columns', ...eye(pg.chooserResetLabel) }),
    textField({ name: 'containerClassName', type: 'string?', defaultValue: "''", note: 'Extra classes for the outer container; built-in scroll/border chrome when unset.', editorDefaultValue: '', clearable: true, ...eye(pg.containerClassName) }),
    boolField({ name: 'dense', defaultValue: 'false', note: 'Compact padding for panel tables.', ...eyeFlag(pg.dense) }),
    textField({ name: 'emptyMessage', type: 'string?', defaultValue: "'No rows'", note: 'Shown when rows is empty.', editorDefaultValue: 'No rows', clearable: true, placeholder: 'No rows', ...eye(pg.emptyMessage) }),
    boolField({ name: 'fillHeight', type: 'boolean?', defaultValue: 'false', note: 'Fills the parent; table body scrolls.', ...eyeFlag(pg.fillHeight), onChange: applyFillHeight }),
    boolField({ name: 'loading', defaultValue: 'false', note: 'Shows the spinner when there are no rows yet.', ...eyeFlag(pg.loading) }),
    boolField({ name: 'resizable', defaultValue: 'false', note: 'Draggable column resize handles.', ...eyeFlag(pg.resizable) }),
    {
      name: 'resetWidthsSignal',
      type: 'number?',
      defaultValue: '0',
      editorDefaultValue: '0',
      note: 'Rising signal: each new value drops managed and persisted widths.',
      editor: 'number',
      clearable: true,
      ...eye(pg.resetWidthsText),
      onChange: value => stage(pg.resetWidthsText, value),
      toggle: eyeToggle(pg.resetWidthsText),
      placeholder: '0',
      sync: { kind: 'number' },
    },
    jsonField({
      name: 'rows',
      type: 'DemoRow[]',
      note: 'Demo rows as JSON; the caller filters, sorts, and slices the current page. The eye resets to the default rows.',
      value: JSON.stringify(pg.rows.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseRowsJson(draft)
        if (parsed) {
          stage(pg.rows, parsed)
        }
      },
      dialog: {
        valid: (draft: string) => parseRowsJson(draft) != null,
        invalidMessage: 'Invalid rows JSON. Use an array of { id, name, status } objects.',
        title: 'Edit rows',
      },
      toggle: eyeResetToggle(pg.rows, () => (pg.rows.value = freshRows())),
    }),
    textField({ name: 'searchAriaLabel', type: 'string?', defaultValue: "'Search'", note: 'Accessible name for the search field.', editorDefaultValue: 'Search', clearable: true, placeholder: 'Search', ...eye(pg.searchAriaLabel) }),
    jsonField({
      name: 'searchKeys',
      type: 'string[]?',
      note: 'Bindable searchable column keys; derived from searchable columns when unset. The eye applies the list.',
      value: JSON.stringify(pg.searchKeys.value ?? ['name', 'status'], null, 2),
      onChange: (draft: string) => {
        const parsed = parseSearchKeysJson(draft)
        if (parsed) {
          stage(pg.searchKeys, parsed)
        }
      },
      dialog: {
        valid: (draft: string) => parseSearchKeysJson(draft) != null,
        invalidMessage: 'Invalid search-keys JSON. Use an array of strings.',
        title: 'Edit searchKeys',
      },
      toggle: eyeToggle(pg.searchKeys),
      sync: {
        kind: 'scriptJson',
        parseJson: parseSearchKeysValue,
        setJson: value => (pg.searchKeys.value = value as string[]),
      },
    }),
    textField({ name: 'searchPlaceholder', type: 'string?', defaultValue: "'Search...'", note: 'Search placeholder.', editorDefaultValue: 'Search...', clearable: true, placeholder: 'Search...', ...eye(pg.placeholder) }),
    {
      name: 'searchValue',
      type: 'string?',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Bindable search text; filtering stays with the caller. The eye resets it to the default.',
      editor: 'text',
      clearable: true,
      ...eye(pg.query),
      onChange: value => stage(pg.query, value),
      toggle: eyeResetToggle(pg.query, () => (pg.query.value = '')),
    },
    textField({ name: 'selectAllAriaLabel', type: 'string?', defaultValue: "'Select all'", note: 'Accessible name for the header checkbox.', editorDefaultValue: 'Select all', clearable: true, placeholder: 'Select all', ...eye(pg.selectAllAriaLabel) }),
    boolField({ name: 'selectable', defaultValue: 'false', note: 'Renders the checkbox column.', ...eyeFlag(pg.selectable) }),
    boolField({ name: 'showPagination', defaultValue: 'pagination configured', note: 'Renders the pagination footer. Unset, the footer renders only when `pagination` supplies its data and onPageChange.', ...eyeFlag(pg.showPagination) }),
    boolField({ name: 'showSearch', defaultValue: 'true', note: 'Renders the search field.', ...eyeFlag(pg.showSearch) }),
    sizeField({ note: 'Search, chooser, selection, and pagination scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    boolField({ name: 'someSelected', defaultValue: '—', note: 'Header checkbox indeterminate state. Interaction override; unset follows the selection.', ...eyeFlag(pg.someSelected) }),
    {
      name: 'sortDirection',
      type: "'asc' | 'desc'",
      defaultValue: "'asc'",
      note: 'Bindable sort direction; the eye resets it to the default; clearing restores the default.',
      editor: 'enum',
      options: [
        { value: 'asc', label: 'asc' },
        { value: 'desc', label: 'desc' },
      ],
      ...eye(pg.sortDirection),
      onChange: value => stage(pg.sortDirection, value === 'desc' ? 'desc' : 'asc'),
      placeholder: 'asc',
      clearLabel: 'Clear sort direction',
      toggle: eyeResetToggle(pg.sortDirection, () => (pg.sortDirection.value = 'asc')),
    },
    {
      name: 'sortKey',
      type: 'string?',
      defaultValue: 'null',
      note: 'Bindable active sort column. The eye resets it to the default.',
      editor: 'text',
      clearable: true,
      ...eye(pg.sortKey),
      value: pg.sortKey.value ?? '',
      onChange: value => stage(pg.sortKey, value === '' ? null : value),
      toggle: eyeResetToggle(pg.sortKey, () => (pg.sortKey.value = null)),
    },
    textField({ name: 'storageKey', type: 'string?', defaultValue: '—', note: 'Persists resized widths under this key.', clearable: true, ...eye(pg.storageKey) }),
    textField({ name: 'storagePrefix', type: 'string?', defaultValue: '—', note: 'App-owned localStorage prefix for the persisted widths; the package prefix stays the read fallback.', clearable: true, ...eye(pg.storagePrefix) }),
    textField({ name: 'tableClassName', type: 'string?', defaultValue: "'min-w-0'", note: 'Extra classes for the table element; raise the minimum width when columns need a horizontal scroll floor.', editorDefaultValue: 'min-w-0', clearable: true, placeholder: 'min-w-0', ...eye(pg.tableClassName) }),
    {
      name: 'columns',
      type: 'DataTableColumn<T>[]',
      defaultValue: '—',
      note: 'Column defs with optional cell renderers.',
    },
    { name: 'pagination', type: 'DataTablePagination?', defaultValue: '—', note: 'Footer config: total/pageSize/currentPage plus onPageChange gate the footer; onPageSizeChange adds the page-size selector; pageSizeOptions customizes its choices; labels overrides the aria labels; trailing is a snippet pinned to the row’s right edge.' },
    { name: 'rowId', type: '(row: T) => string', defaultValue: '—', note: 'Stable key per row.' },
    { name: 'selectedIds', type: 'Set<string>?', defaultValue: '—', note: 'Selected row ids; managed by the caller.' },
    {
      name: 'variant',
      type: "'data' | 'docs'",
      defaultValue: "'data'",
      note: 'Docs presentation: plain overflow wrapper, non-sticky header, no row hover.',
    },
    {
      name: 'onResetColumns',
      type: '() => void',
      defaultValue: '—',
      note: 'Reset handler; the caller also bumps resetWidthsSignal to drop resized widths.',
    },
    {
      name: 'onSearchInput',
      type: '(event: Event) => void',
      defaultValue: '—',
      note: 'Search input handler.',
    },
    {
      name: 'onSearchKeydown',
      type: '(event: KeyboardEvent) => void',
      defaultValue: '—',
      note: 'Search keydown handler.',
    },
    {
      name: 'onSort',
      type: '(key, direction) => void',
      defaultValue: '—',
      note: 'Sort handler; or bind sortKey/sortDirection.',
    },
    { name: 'onToggleColumn', type: '(key, checked) => void', defaultValue: '—', note: 'Column visibility handler.' },
    {
      name: 'resizeAriaLabel',
      type: '(column) => string',
      defaultValue: '—',
      note: 'Accessible name for the resize handles.',
    },
    {
      name: 'sortAriaLabel',
      type: '(column, direction) => string',
      defaultValue: '—',
      note: 'Accessible name for the sort buttons.',
    },
  ])

  // The seed covers every curated option; only interaction state (search text,
  // page, sort, selection, hidden columns) rides scope, so refresh the live
  // preview on those without touching the editor text.
  </script>

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
  <span class="text-xs text-slate-400">{rowTotal} {TRAILING_SUFFIX}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="DataTable"
    {code}
    onReset={clearPlayground}
    scope={{
      hidden,
      pgQuery: pg.query.value,
      pgPage: pg.page,
      demoPageSize,
      pgSortKey: pg.sortKey.value,
      pgSortDirection: pg.sortDirection.value,
      pgShowSearch: pg.showSearch.value,
      pgShowPagination: pg.showPagination.value,
      pgSelectable: pg.selectable.value,
      pgDense: pg.dense.value,
      pgResizable: pg.resizable.value,
      pgPlaceholder: pg.placeholder.value,
      pgEmptyMessage: pg.emptyMessage.value,
      pgSelected: pg.selected,
      visibleRows,
      visibleTotal,
      toggleSelection,
      toggleAllSelected,
      handleSearchInput,
      handleToggleColumn,
      handleResetColumns,
      handlePageChange,
      handlePageSizeChange,
    }}

    sync={{ tag: 'DataTable' }}
    scopeRefresh={() => [pg.query.value, pg.page, pg.sortKey.value, pg.sortDirection.value, pg.selected, hidden, demoPageSize]}
  >
    <ShowcaseStage paneClass={stagePaneClass}>
      <DataTable
        rows={pageRows}
        columns={visibleColumns}
        rowId={row => row.id}
        searchAriaLabel={applied(pg.searchAriaLabel) || undefined}
        bind:searchValue={pg.query.value}
        searchKeys={applied(pg.searchKeys) ?? undefined}
        onSearchInput={handleSearchInput}
        {showSearch}
        searchPlaceholder={applied(pg.placeholder) || undefined}
        emptyMessage={applied(pg.emptyMessage) || undefined}
        {showPagination}
        chooserColumns={chooserEntries}
        chooserLabel={applied(pg.chooserLabel) || undefined}
        chooserResetLabel={applied(pg.chooserResetLabel) || undefined}
        onToggleColumn={handleToggleColumn}
        onResetColumns={handleResetColumns}
        bind:sortKey={pg.sortKey.value}
        bind:sortDirection={pg.sortDirection.value}
        pagination={{
          total: rowTotal,
          pageSize: demoPageSize,
          currentPage: pg.page,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          trailing: tableTrailing,
        }}
        {selectable}
        selectedIds={pg.selected}
        onToggleSelection={handleToggleSelection}
        onToggleAll={handleToggleAll}
        allSelected={pg.allSelected.on ? (pg.allSelected.value === '' ? allRowsSelected : pg.allSelected.value === 'yes') : undefined}
        someSelected={pg.someSelected.on ? (pg.someSelected.value === '' ? someRowsSelected : pg.someSelected.value === 'yes') : undefined}
        selectAllAriaLabel={applied(pg.selectAllAriaLabel) || undefined}
        rowSelectAriaLabel={row => `Select ${row.name}`}
        {dense}
        {fillHeight}
        {bodyScroll}
        {resizable}
        resizeAriaLabel={column => `Resize ${column.header}`}
        containerClassName={applied(pg.containerClassName) || undefined}
        tableClassName={applied(pg.tableClassName) || undefined}
        storageKey={applied(pg.storageKey) || undefined}
        storagePrefix={applied(pg.storagePrefix) || undefined}
        size={demoSize}
        resetWidthsSignal={demoResetWidths}
        {loading} />
    </ShowcaseStage>
  </ShowcasePage>
