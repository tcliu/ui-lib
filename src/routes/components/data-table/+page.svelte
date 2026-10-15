<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import DataTable, { type DataTableColumn } from '$lib/components/DataTable.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseStage from '$lib/showcase/ShowcaseStage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { textField, boolField, sizeField, jsonField, resetToggle, snippetDialog, snippetToggle } from '$lib/showcase/snippet-field'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
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
    type TriState,
  } from './demo-snippet'

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
    showSearch: 'yes' as TriState,
    showSearchOn: true,
    showPagination: '' as TriState,
    showPaginationOn: false,
    selectable: 'no' as TriState,
    selectableOn: false,
    dense: 'no' as TriState,
    denseOn: false,
    resizable: 'no' as TriState,
    resizableOn: false,
    loading: 'no' as TriState,
    loadingOn: false,
    fillHeight: 'no' as TriState,
    fillHeightOn: false,
    bodyScroll: 'no' as TriState,
    bodyScrollOn: false,
    placeholder: 'Search',
    placeholderOn: false,
    emptyMessage: 'No rows',
    emptyMessageOn: false,
    pageSizeText: '',
    query: '',
    queryOn: true,
    page: 1,
    resetWidthsText: '0',
    resetWidthsOn: false,
    searchAriaLabel: 'Search',
    searchAriaLabelOn: false,
    searchKeys: null as string[] | null,
    rowsEnabled: true,
    searchKeysEnabled: true,
    chooserLabel: 'Choose columns',
    chooserLabelOn: false,
    chooserResetLabel: 'Reset columns',
    chooserResetLabelOn: false,
    selectAllAriaLabel: 'Select all',
    selectAllAriaLabelOn: false,
    allSelected: '' as TriState,
    allSelectedOn: false,
    someSelected: '' as TriState,
    someSelectedOn: false,
    containerClassName: '',
    containerClassNameOn: false,
    tableClassName: 'min-w-0',
    tableClassNameOn: false,
    storageKey: '',
    storageKeyOn: false,
    size: 'md',
    sizeOn: false,
    sortKey: null as string | null,
    sortKeyOn: true,
    sortDirection: 'asc' as 'asc' | 'desc',
    sortDirectionOn: true,
    selected: new Set<string>(),
    rows: freshRows() as DemoRow[],
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

  const showSearch = $derived(pg.showSearchOn ? flagOn(pg.showSearch) : undefined)
  const showPagination = $derived(pg.showPaginationOn ? flagOn(pg.showPagination) : undefined)
  const selectable = $derived(pg.selectableOn ? flagOn(pg.selectable) : undefined)
  const dense = $derived(pg.denseOn ? flagOn(pg.dense) : undefined)
  const resizable = $derived(pg.resizableOn ? flagOn(pg.resizable) : undefined)
  const loading = $derived(pg.loadingOn ? flagOn(pg.loading) : undefined)
  const fillHeight = $derived(pg.fillHeightOn ? flagOn(pg.fillHeight) : undefined)
  const bodyScroll = $derived(pg.bodyScrollOn ? flagOn(pg.bodyScroll) : undefined)
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const stagePaneClass = $derived(pg.fillHeightOn && pg.fillHeight === 'yes' ? TABLE_STAGE_PANE_FILL : TABLE_STAGE_PANE)

  // Fill height implies the fixed header band, so enabling it fills the Body
  // scroll field too; clearing it clears Body scroll. Enabling Body scroll
  // needs the fill-height parent, so it fills Fill height too.
  function applyFillHeight(value: string): void {
    pg.fillHeight = value as TriState
    pg.fillHeightOn = true
    pg.bodyScroll = value === 'yes' ? 'yes' : 'no'
    pg.bodyScrollOn = true
  }

  function applyBodyScroll(value: string): void {
    pg.bodyScroll = value as TriState
    pg.bodyScrollOn = true
    if (value === 'yes') {
      pg.fillHeight = 'yes'
      pg.fillHeightOn = true
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
  const pageRows = $derived(visibleRows(pg.rows, pg.query, pg.sortKey, pg.sortDirection, pg.page, demoPageSize))
  const rowTotal = $derived(visibleTotal(pg.rows, pg.query))
  const allRowsSelected = $derived(pg.selected.size > 0 && pg.selected.size === pg.rows.length)
  const someRowsSelected = $derived(pg.selected.size > 0 && pg.selected.size < pg.rows.length)
  const demoResetWidths = $derived.by(() => {
    if (!pg.resetWidthsOn) return undefined
    const parsed = Number.parseInt(pg.resetWidthsText, 10)
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
      pg.rows.map(row => row.id),
    )
  }

  const code = $derived.by(() =>
    buildDataTableSnippet({
      rows: pg.rows,
      showSearch: pg.showSearch,
      showSearchOn: pg.showSearchOn,
      showPagination: pg.showPagination,
      showPaginationOn: pg.showPaginationOn,
      selectable: pg.selectable,
      selectableOn: pg.selectableOn,
      dense: pg.dense,
      denseOn: pg.denseOn,
      resizable: pg.resizable,
      resizableOn: pg.resizableOn,
      loading: pg.loading,
      loadingOn: pg.loadingOn,
      fillHeight: pg.fillHeight,
      fillHeightOn: pg.fillHeightOn,
      bodyScroll: pg.bodyScroll,
      bodyScrollOn: pg.bodyScrollOn,
      placeholder: pg.placeholder,
      placeholderOn: pg.placeholderOn,
      emptyMessage: pg.emptyMessage,
      emptyMessageOn: pg.emptyMessageOn,
      trailing: TRAILING_SUFFIX,
      searchAriaLabel: pg.searchAriaLabel,
      searchAriaLabelOn: pg.searchAriaLabelOn,
      searchKeys: pg.searchKeys,
      searchKeysEnabled: pg.searchKeysEnabled,
      chooserLabel: pg.chooserLabel,
      chooserLabelOn: pg.chooserLabelOn,
      chooserResetLabel: pg.chooserResetLabel,
      chooserResetLabelOn: pg.chooserResetLabelOn,
      selectAllAriaLabel: pg.selectAllAriaLabel,
      selectAllAriaLabelOn: pg.selectAllAriaLabelOn,
      allSelected: pg.allSelected,
      allSelectedOn: pg.allSelectedOn,
      someSelected: pg.someSelected,
      someSelectedOn: pg.someSelectedOn,
      containerClassName: pg.containerClassName,
      containerClassNameOn: pg.containerClassNameOn,
      tableClassName: pg.tableClassName,
      tableClassNameOn: pg.tableClassNameOn,
      storageKey: pg.storageKey,
      storageKeyOn: pg.storageKeyOn,
      resetWidthsSignal: pg.resetWidthsText,
      resetWidthsSignalOn: pg.resetWidthsOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
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
    boolField({ name: 'allSelected', defaultValue: '—', note: 'Header checkbox checked state. Interaction override; unset follows the selection.', value: pg.allSelected, onChange: v => (pg.allSelected = v as TriState), enabled: pg.allSelectedOn, setEnabled: v => (pg.allSelectedOn = v) }),
    {
      name: 'bodyScroll',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Fixed header band with a body-only scrollport (needs fillHeight).',
      editor: 'boolean',
      value: pg.bodyScroll,
      onChange: applyBodyScroll,
      toggle: snippetToggle(pg.bodyScrollOn, enabled => (pg.bodyScrollOn = enabled)),
      sync: { kind: 'tri' },
    },
    // Eye-free by design: the entries derive from the live hidden-column set
    // (interaction state outside the curated form), so there is no staged
    // eye to apply — the dialog edits the checked set directly.
    jsonField({
      name: 'chooserColumns',
      type: 'ChooserColumn[]',
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
    textField({ name: 'chooserLabel', type: 'string?', defaultValue: "'Choose columns'", note: 'Accessible name for the column selector.', value: pg.chooserLabel, onChange: v => (pg.chooserLabel = v), editorDefaultValue: 'Choose columns', clearable: true, placeholder: 'Choose columns', enabled: pg.chooserLabelOn, setEnabled: v => (pg.chooserLabelOn = v) }),
    textField({ name: 'chooserResetLabel', type: 'string?', defaultValue: "'Reset columns'", note: 'Accessible name for the reset button.', value: pg.chooserResetLabel, onChange: v => (pg.chooserResetLabel = v), editorDefaultValue: 'Reset columns', clearable: true, placeholder: 'Reset columns', enabled: pg.chooserResetLabelOn, setEnabled: v => (pg.chooserResetLabelOn = v) }),
    textField({ name: 'containerClassName', type: 'string?', defaultValue: "''", note: 'Extra classes for the outer container; built-in scroll/border chrome when unset.', value: pg.containerClassName, onChange: v => (pg.containerClassName = v), editorDefaultValue: '', clearable: true, enabled: pg.containerClassNameOn, setEnabled: v => (pg.containerClassNameOn = v) }),
    boolField({ name: 'dense', defaultValue: 'false', note: 'Compact padding for panel tables.', value: pg.dense, onChange: v => (pg.dense = v as TriState), enabled: pg.denseOn, setEnabled: v => (pg.denseOn = v) }),
    textField({ name: 'emptyMessage', type: 'string?', defaultValue: "'No rows'", note: 'Shown when rows is empty.', value: pg.emptyMessage, onChange: v => (pg.emptyMessage = v), editorDefaultValue: 'No rows', clearable: true, placeholder: 'No rows', enabled: pg.emptyMessageOn, setEnabled: v => (pg.emptyMessageOn = v) }),
    {
      name: 'fillHeight',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Fills the parent; table body scrolls.',
      editor: 'boolean',
      value: pg.fillHeight,
      onChange: applyFillHeight,
      toggle: snippetToggle(pg.fillHeightOn, enabled => (pg.fillHeightOn = enabled)),
      sync: { kind: 'tri' },
    },
    boolField({ name: 'loading', defaultValue: 'false', note: 'Shows the spinner when there are no rows yet.', value: pg.loading, onChange: v => (pg.loading = v as TriState), enabled: pg.loadingOn, setEnabled: v => (pg.loadingOn = v) }),
    boolField({ name: 'resizable', defaultValue: 'false', note: 'Draggable column resize handles.', value: pg.resizable, onChange: v => (pg.resizable = v as TriState), enabled: pg.resizableOn, setEnabled: v => (pg.resizableOn = v) }),
    {
      name: 'resetWidthsSignal',
      type: 'number?',
      defaultValue: '0',
      editorDefaultValue: '0',
      note: 'Rising signal: each new value drops managed and persisted widths.',
      editor: 'number',
      clearable: true,
      value: pg.resetWidthsText,
      onChange: value => {
        pg.resetWidthsText = value
        pg.resetWidthsOn = true
      },
      toggle: snippetToggle(pg.resetWidthsOn, enabled => (pg.resetWidthsOn = enabled)),
      placeholder: '0',
      sync: { kind: 'number' },
    },
    jsonField({
      name: 'rows',
      type: 'DemoRow[]',
      note: 'Demo rows as JSON; the caller filters, sorts, and slices the current page. The eye resets to the default rows.',
      value: JSON.stringify(pg.rows, null, 2),
      onChange: (draft: string) => {
        const parsed = parseRowsJson(draft)
        if (parsed) {
          pg.rows = parsed
          pg.rowsEnabled = true
        }
      },
      dialog: {
        valid: (draft: string) => parseRowsJson(draft) != null,
        invalidMessage: 'Invalid rows JSON. Use an array of { id, name, status } objects.',
        title: 'Edit rows',
      },
      toggle: resetToggle(
        pg.rowsEnabled,
        enabled => (pg.rowsEnabled = enabled),
        () => (pg.rows = freshRows()),
      ),
    }),
    textField({ name: 'searchAriaLabel', type: 'string?', defaultValue: "'Search'", note: 'Accessible name for the search field.', value: pg.searchAriaLabel, onChange: v => (pg.searchAriaLabel = v), editorDefaultValue: 'Search', clearable: true, placeholder: 'Search', enabled: pg.searchAriaLabelOn, setEnabled: v => (pg.searchAriaLabelOn = v) }),
    jsonField({
      name: 'searchKeys',
      type: 'string[]',
      note: 'Bindable searchable column keys; derived from searchable columns when unset. The eye applies the list.',
      value: JSON.stringify(pg.searchKeys ?? ['name', 'status'], null, 2),
      onChange: (draft: string) => {
        const parsed = parseSearchKeysJson(draft)
        if (parsed) {
          pg.searchKeys = parsed
          pg.searchKeysEnabled = true
        }
      },
      dialog: {
        valid: (draft: string) => parseSearchKeysJson(draft) != null,
        invalidMessage: 'Invalid search-keys JSON. Use an array of strings.',
        title: 'Edit searchKeys',
      },
      toggle: snippetToggle(pg.searchKeysEnabled, enabled => (pg.searchKeysEnabled = enabled)),
      sync: {
        kind: 'scriptJson',
        parseJson: parseSearchKeysValue,
        setJson: value => (pg.searchKeys = value as string[]),
      },
    }),
    textField({ name: 'searchPlaceholder', type: 'string?', defaultValue: "'Search'", note: 'Search placeholder.', value: pg.placeholder, onChange: v => (pg.placeholder = v), editorDefaultValue: 'Search', clearable: true, placeholder: 'Search', enabled: pg.placeholderOn, setEnabled: v => (pg.placeholderOn = v) }),
    {
      name: 'searchValue',
      type: 'string?',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Bindable search text; filtering stays with the caller. The eye resets it to the default.',
      editor: 'text',
      clearable: true,
      value: pg.query,
      onChange: value => {
        pg.query = value
        pg.queryOn = true
      },
      toggle: resetToggle(
        pg.queryOn,
        enabled => (pg.queryOn = enabled),
        () => (pg.query = ''),
      ),
    },
    textField({ name: 'selectAllAriaLabel', type: 'string?', defaultValue: "'Select all'", note: 'Accessible name for the header checkbox.', value: pg.selectAllAriaLabel, onChange: v => (pg.selectAllAriaLabel = v), editorDefaultValue: 'Select all', clearable: true, placeholder: 'Select all', enabled: pg.selectAllAriaLabelOn, setEnabled: v => (pg.selectAllAriaLabelOn = v) }),
    boolField({ name: 'selectable', defaultValue: 'false', note: 'Renders the checkbox column.', value: pg.selectable, onChange: v => (pg.selectable = v as TriState), enabled: pg.selectableOn, setEnabled: v => (pg.selectableOn = v) }),
    boolField({ name: 'showPagination', defaultValue: 'pagination configured', note: 'Renders the pagination footer. Unset, the footer renders only when `pagination` supplies its data and onPageChange.', value: pg.showPagination, onChange: v => (pg.showPagination = v as TriState), enabled: pg.showPaginationOn, setEnabled: v => (pg.showPaginationOn = v) }),
    boolField({ name: 'showSearch', defaultValue: 'true', note: 'Renders the search field.', value: pg.showSearch, onChange: v => (pg.showSearch = v as TriState), enabled: pg.showSearchOn, setEnabled: v => (pg.showSearchOn = v) }),
    sizeField({ note: 'Search, chooser, selection, and pagination scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    boolField({ name: 'someSelected', defaultValue: '—', note: 'Header checkbox indeterminate state. Interaction override; unset follows the selection.', value: pg.someSelected, onChange: v => (pg.someSelected = v as TriState), enabled: pg.someSelectedOn, setEnabled: v => (pg.someSelectedOn = v) }),
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
      value: pg.sortDirection,
      onChange: value => {
        pg.sortDirection = value === 'desc' ? 'desc' : 'asc'
        pg.sortDirectionOn = true
      },
      placeholder: 'asc',
      clearLabel: 'Clear sort direction',
      toggle: resetToggle(
        pg.sortDirectionOn,
        enabled => (pg.sortDirectionOn = enabled),
        () => (pg.sortDirection = 'asc'),
      ),
    },
    {
      name: 'sortKey',
      type: 'string?',
      defaultValue: 'null',
      note: 'Bindable active sort column. The eye resets it to the default.',
      editor: 'text',
      clearable: true,
      value: pg.sortKey ?? '',
      onChange: value => {
        pg.sortKey = value === '' ? null : value
        pg.sortKeyOn = true
      },
      toggle: resetToggle(
        pg.sortKeyOn,
        enabled => (pg.sortKeyOn = enabled),
        () => (pg.sortKey = null),
      ),
    },
    textField({ name: 'storageKey', type: 'string?', defaultValue: '—', note: 'Persists resized widths under this key.', value: pg.storageKey, onChange: v => (pg.storageKey = v), clearable: true, enabled: pg.storageKeyOn, setEnabled: v => (pg.storageKeyOn = v) }),
    textField({ name: 'tableClassName', type: 'string?', defaultValue: "'min-w-0'", note: 'Extra classes for the table element; raise the minimum width when columns need a horizontal scroll floor.', value: pg.tableClassName, onChange: v => (pg.tableClassName = v), editorDefaultValue: 'min-w-0', clearable: true, placeholder: 'min-w-0', enabled: pg.tableClassNameOn, setEnabled: v => (pg.tableClassNameOn = v) }),
    {
      name: 'columns',
      type: 'DataTableColumn<T>[]',
      defaultValue: '—',
      note: 'Column defs with optional cell renderers.',
    },
    { name: 'pagination', type: 'DataTablePagination', defaultValue: '—', note: 'Footer config: total/pageSize/currentPage plus onPageChange gate the footer; onPageSizeChange adds the page-size selector; pageSizeOptions customizes its choices; labels overrides the aria labels; trailing is a snippet pinned to the row’s right edge.' },
    { name: 'rowId', type: '(row: T) => string', defaultValue: '—', note: 'Stable key per row.' },
    { name: 'selectedIds', type: 'Set<string>', defaultValue: '—', note: 'Selected row ids; managed by the caller.' },
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
      pgQuery: pg.query,
      pgPage: pg.page,
      demoPageSize,
      pgSortKey: pg.sortKey,
      pgSortDirection: pg.sortDirection,
      pgShowSearch: pg.showSearch,
      pgShowPagination: pg.showPagination,
      pgSelectable: pg.selectable,
      pgDense: pg.dense,
      pgResizable: pg.resizable,
      pgPlaceholder: pg.placeholder,
      pgEmptyMessage: pg.emptyMessage,
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
    scopeRefresh={() => [pg.query, pg.page, pg.sortKey, pg.sortDirection, pg.selected, hidden]}
  >
    <ShowcaseStage paneClass={stagePaneClass}>
      <DataTable
        rows={pageRows}
        columns={visibleColumns}
        rowId={row => row.id}
        searchAriaLabel={pg.searchAriaLabelOn && pg.searchAriaLabel ? pg.searchAriaLabel : undefined}
        bind:searchValue={pg.query}
        searchKeys={pg.searchKeysEnabled ? pg.searchKeys ?? undefined : undefined}
        onSearchInput={handleSearchInput}
        {showSearch}
        searchPlaceholder={pg.placeholderOn && pg.placeholder ? pg.placeholder : undefined}
        emptyMessage={pg.emptyMessageOn && pg.emptyMessage ? pg.emptyMessage : undefined}
        {showPagination}
        chooserColumns={chooserEntries}
        chooserLabel={pg.chooserLabelOn && pg.chooserLabel ? pg.chooserLabel : undefined}
        chooserResetLabel={pg.chooserResetLabelOn && pg.chooserResetLabel ? pg.chooserResetLabel : undefined}
        onToggleColumn={handleToggleColumn}
        onResetColumns={handleResetColumns}
        bind:sortKey={pg.sortKey}
        bind:sortDirection={pg.sortDirection}
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
        allSelected={pg.allSelectedOn ? (pg.allSelected === '' ? allRowsSelected : pg.allSelected === 'yes') : undefined}
        someSelected={pg.someSelectedOn ? (pg.someSelected === '' ? someRowsSelected : pg.someSelected === 'yes') : undefined}
        selectAllAriaLabel={pg.selectAllAriaLabelOn && pg.selectAllAriaLabel ? pg.selectAllAriaLabel : undefined}
        rowSelectAriaLabel={row => `Select ${row.name}`}
        {dense}
        {fillHeight}
        {bodyScroll}
        {resizable}
        resizeAriaLabel={column => `Resize ${column.header}`}
        containerClassName={pg.containerClassNameOn && pg.containerClassName ? pg.containerClassName : undefined}
        tableClassName={pg.tableClassNameOn && pg.tableClassName ? pg.tableClassName : undefined}
        storageKey={pg.storageKeyOn && pg.storageKey ? pg.storageKey : undefined}
        size={demoSize}
        resetWidthsSignal={demoResetWidths}
        {loading} />
    </ShowcaseStage>
  </ShowcasePage>
