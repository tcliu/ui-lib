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

  let pgShowSearch = $state<TriState>('yes')
  let pgShowSearchOn = $state(true)
  let pgShowPagination = $state<TriState>('')
  let pgShowPaginationOn = $state(false)
  let pgSelectable = $state<TriState>('no')
  let pgSelectableOn = $state(false)
  let pgDense = $state<TriState>('no')
  let pgDenseOn = $state(false)
  let pgResizable = $state<TriState>('no')
  let pgResizableOn = $state(false)
  let pgLoading = $state<TriState>('no')
  let pgLoadingOn = $state(false)
  let pgFillHeight = $state<TriState>('no')
  let pgFillHeightOn = $state(false)
  let pgBodyScroll = $state<TriState>('no')
  let pgBodyScrollOn = $state(false)
  let pgPlaceholder = $state('Search')
  let pgPlaceholderOn = $state(false)
  let pgEmptyMessage = $state('No rows')
  let pgEmptyMessageOn = $state(false)
  let pgPageSizeText = $state('')
  let pgQuery = $state('')
  let pgQueryOn = $state(true)
  let pgPage = $state(1)
  let pgResetWidthsText = $state('0')
  let pgResetWidthsOn = $state(false)
  let pgSearchAriaLabel = $state('Search')
  let pgSearchAriaLabelOn = $state(false)
  let pgSearchKeys = $state<string[] | null>(null)
  // Eye toggles for the dialog rows below: `rows` is required content, so its
  // eye resets to the defaults; `searchKeys` is optional, so its eye omits
  // while off (the committed list stays in the dialog).
  let pgRowsEnabled = $state(true)
  let pgSearchKeysEnabled = $state(true)
  let pgChooserLabel = $state('Choose columns')
  let pgChooserLabelOn = $state(false)
  let pgChooserResetLabel = $state('Reset columns')
  let pgChooserResetLabelOn = $state(false)
  let pgSelectAllAriaLabel = $state('Select all')
  let pgSelectAllAriaLabelOn = $state(false)
  let pgAllSelected = $state<TriState>('')
  let pgAllSelectedOn = $state(false)
  let pgSomeSelected = $state<TriState>('')
  let pgSomeSelectedOn = $state(false)
  let pgContainerClassName = $state('')
  let pgContainerClassNameOn = $state(false)
  let pgTableClassName = $state('min-w-0')
  let pgTableClassNameOn = $state(false)
  let pgStorageKey = $state('')
  let pgStorageKeyOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgSortKey = $state<string | null>(null)
  let pgSortKeyOn = $state(true)
  let pgSortDirection = $state<'asc' | 'desc'>('asc')
  // The sort-direction eye resets the bindable to its default instead of
  // omitting: the seed always binds `pgSortDirection`, so off-state data
  // equals the default and nothing visibly changes.
  let pgSortDirectionOn = $state(true)
  let pgSelected = $state(new Set<string>())
  // Demo rows edit through the rows dialog as JSON; the cleared form restores
  // the default set.
  let pgRows = $state<DemoRow[]>(freshRows())
  const pgPageSize = $derived.by(() => {
    const parsed = Number.parseInt(pgPageSizeText, 10)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 10
  })
  // The pagination row's trailing count suffix. The `pagination` object prop is
  // read-only, so the suffix is fixed demo data rather than a Value cell.
  const TRAILING_SUFFIX = 'rows'

  const showSearch = $derived(pgShowSearchOn ? flagOn(pgShowSearch) : undefined)
  const showPagination = $derived(pgShowPaginationOn ? flagOn(pgShowPagination) : undefined)
  const selectable = $derived(pgSelectableOn ? flagOn(pgSelectable) : undefined)
  const dense = $derived(pgDenseOn ? flagOn(pgDense) : undefined)
  const resizable = $derived(pgResizableOn ? flagOn(pgResizable) : undefined)
  const loading = $derived(pgLoadingOn ? flagOn(pgLoading) : undefined)
  const fillHeight = $derived(pgFillHeightOn ? flagOn(pgFillHeight) : undefined)
  const bodyScroll = $derived(pgBodyScrollOn ? flagOn(pgBodyScroll) : undefined)
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const stagePaneClass = $derived(pgFillHeightOn && pgFillHeight === 'yes' ? TABLE_STAGE_PANE_FILL : TABLE_STAGE_PANE)

  // Fill height implies the fixed header band, so enabling it fills the Body
  // scroll field too; clearing it clears Body scroll. Enabling Body scroll
  // needs the fill-height parent, so it fills Fill height too.
  function applyFillHeight(value: string): void {
    pgFillHeight = value as TriState
    pgFillHeightOn = true
    pgBodyScroll = value === 'yes' ? 'yes' : 'no'
    pgBodyScrollOn = true
  }

  function applyBodyScroll(value: string): void {
    pgBodyScroll = value as TriState
    pgBodyScrollOn = true
    if (value === 'yes') {
      pgFillHeight = 'yes'
      pgFillHeightOn = true
    }
  }

  function clearPlayground() {
    pgShowSearch = 'yes'
    pgShowSearchOn = true
    pgShowPagination = ''
    pgShowPaginationOn = false
    pgSelectable = 'no'
    pgSelectableOn = false
    pgDense = 'no'
    pgDenseOn = false
    pgResizable = 'no'
    pgResizableOn = false
    pgLoading = 'no'
    pgLoadingOn = false
    pgFillHeight = 'no'
    pgFillHeightOn = false
    pgBodyScroll = 'no'
    pgBodyScrollOn = false
    pgPlaceholder = 'Search'
    pgPlaceholderOn = false
    pgEmptyMessage = 'No rows'
    pgEmptyMessageOn = false
    pgPageSizeText = ''
    pgQuery = ''
    pgQueryOn = true
    pgPage = 1
    pgResetWidthsText = '0'
    pgResetWidthsOn = false
    pgSearchAriaLabel = 'Search'
    pgSearchAriaLabelOn = false
    pgSearchKeys = null
    pgRowsEnabled = true
    pgSearchKeysEnabled = true
    pgChooserLabel = 'Choose columns'
    pgChooserLabelOn = false
    pgChooserResetLabel = 'Reset columns'
    pgChooserResetLabelOn = false
    pgSelectAllAriaLabel = 'Select all'
    pgSelectAllAriaLabelOn = false
    pgAllSelected = ''
    pgAllSelectedOn = false
    pgSomeSelected = ''
    pgSomeSelectedOn = false
    pgContainerClassName = ''
    pgContainerClassNameOn = false
    pgTableClassName = 'min-w-0'
    pgTableClassNameOn = false
    pgStorageKey = ''
    pgStorageKeyOn = false
    pgSize = 'md'
    pgSizeOn = false
    pgSortKey = null
    pgSortKeyOn = true
    pgSortDirection = 'asc'
    pgSortDirectionOn = true
    pgSelected = new Set<string>()
    pgRows = freshRows()
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
  const pageRows = $derived(visibleRows(pgRows, pgQuery, pgSortKey, pgSortDirection, pgPage, pgPageSize))
  const rowTotal = $derived(visibleTotal(pgRows, pgQuery))
  const allRowsSelected = $derived(pgSelected.size > 0 && pgSelected.size === pgRows.length)
  const someRowsSelected = $derived(pgSelected.size > 0 && pgSelected.size < pgRows.length)
  const demoResetWidths = $derived.by(() => {
    if (!pgResetWidthsOn) return undefined
    const parsed = Number.parseInt(pgResetWidthsText, 10)
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
  })

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
      pgRows.map(row => row.id),
    )
  }

  const code = $derived.by(() =>
    buildDataTableSnippet({
      rows: pgRows,
      showSearch: pgShowSearch,
      showSearchOn: pgShowSearchOn,
      showPagination: pgShowPagination,
      showPaginationOn: pgShowPaginationOn,
      selectable: pgSelectable,
      selectableOn: pgSelectableOn,
      dense: pgDense,
      denseOn: pgDenseOn,
      resizable: pgResizable,
      resizableOn: pgResizableOn,
      loading: pgLoading,
      loadingOn: pgLoadingOn,
      fillHeight: pgFillHeight,
      fillHeightOn: pgFillHeightOn,
      bodyScroll: pgBodyScroll,
      bodyScrollOn: pgBodyScrollOn,
      placeholder: pgPlaceholder,
      placeholderOn: pgPlaceholderOn,
      emptyMessage: pgEmptyMessage,
      emptyMessageOn: pgEmptyMessageOn,
      trailing: TRAILING_SUFFIX,
      searchAriaLabel: pgSearchAriaLabel,
      searchAriaLabelOn: pgSearchAriaLabelOn,
      searchKeys: pgSearchKeys,
      searchKeysEnabled: pgSearchKeysEnabled,
      chooserLabel: pgChooserLabel,
      chooserLabelOn: pgChooserLabelOn,
      chooserResetLabel: pgChooserResetLabel,
      chooserResetLabelOn: pgChooserResetLabelOn,
      selectAllAriaLabel: pgSelectAllAriaLabel,
      selectAllAriaLabelOn: pgSelectAllAriaLabelOn,
      allSelected: pgAllSelected,
      allSelectedOn: pgAllSelectedOn,
      someSelected: pgSomeSelected,
      someSelectedOn: pgSomeSelectedOn,
      containerClassName: pgContainerClassName,
      containerClassNameOn: pgContainerClassNameOn,
      tableClassName: pgTableClassName,
      tableClassNameOn: pgTableClassNameOn,
      storageKey: pgStorageKey,
      storageKeyOn: pgStorageKeyOn,
      resetWidthsSignal: pgResetWidthsText,
      resetWidthsSignalOn: pgResetWidthsOn,
      size: pgSize,
      sizeOn: pgSizeOn,
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
    boolField({ name: 'allSelected', defaultValue: '—', note: 'Header checkbox checked state. Interaction override; unset follows the selection.', value: pgAllSelected, onChange: v => (pgAllSelected = v as TriState), enabled: pgAllSelectedOn, setEnabled: v => (pgAllSelectedOn = v) }),
    {
      name: 'bodyScroll',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Fixed header band with a body-only scrollport (needs fillHeight).',
      editor: 'boolean',
      value: pgBodyScroll,
      onChange: applyBodyScroll,
      toggle: snippetToggle(pgBodyScrollOn, enabled => (pgBodyScrollOn = enabled)),
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
    textField({ name: 'chooserLabel', type: 'string?', defaultValue: "'Choose columns'", note: 'Accessible name for the column selector.', value: pgChooserLabel, onChange: v => (pgChooserLabel = v), editorDefaultValue: 'Choose columns', clearable: true, placeholder: 'Choose columns', enabled: pgChooserLabelOn, setEnabled: v => (pgChooserLabelOn = v) }),
    textField({ name: 'chooserResetLabel', type: 'string?', defaultValue: "'Reset columns'", note: 'Accessible name for the reset button.', value: pgChooserResetLabel, onChange: v => (pgChooserResetLabel = v), editorDefaultValue: 'Reset columns', clearable: true, placeholder: 'Reset columns', enabled: pgChooserResetLabelOn, setEnabled: v => (pgChooserResetLabelOn = v) }),
    textField({ name: 'containerClassName', type: 'string?', defaultValue: "''", note: 'Extra classes for the outer container; built-in scroll/border chrome when unset.', value: pgContainerClassName, onChange: v => (pgContainerClassName = v), editorDefaultValue: '', clearable: true, enabled: pgContainerClassNameOn, setEnabled: v => (pgContainerClassNameOn = v) }),
    boolField({ name: 'dense', defaultValue: 'false', note: 'Compact padding for panel tables.', value: pgDense, onChange: v => (pgDense = v as TriState), enabled: pgDenseOn, setEnabled: v => (pgDenseOn = v) }),
    textField({ name: 'emptyMessage', type: 'string?', defaultValue: "'No rows'", note: 'Shown when rows is empty.', value: pgEmptyMessage, onChange: v => (pgEmptyMessage = v), editorDefaultValue: 'No rows', clearable: true, placeholder: 'No rows', enabled: pgEmptyMessageOn, setEnabled: v => (pgEmptyMessageOn = v) }),
    {
      name: 'fillHeight',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Fills the parent; table body scrolls.',
      editor: 'boolean',
      value: pgFillHeight,
      onChange: applyFillHeight,
      toggle: snippetToggle(pgFillHeightOn, enabled => (pgFillHeightOn = enabled)),
      sync: { kind: 'tri' },
    },
    boolField({ name: 'loading', defaultValue: 'false', note: 'Shows the spinner when there are no rows yet.', value: pgLoading, onChange: v => (pgLoading = v as TriState), enabled: pgLoadingOn, setEnabled: v => (pgLoadingOn = v) }),
    boolField({ name: 'resizable', defaultValue: 'false', note: 'Draggable column resize handles.', value: pgResizable, onChange: v => (pgResizable = v as TriState), enabled: pgResizableOn, setEnabled: v => (pgResizableOn = v) }),
    {
      name: 'resetWidthsSignal',
      type: 'number?',
      defaultValue: '0',
      editorDefaultValue: '0',
      note: 'Rising signal: each new value drops managed and persisted widths.',
      editor: 'number',
      clearable: true,
      value: pgResetWidthsText,
      onChange: value => {
        pgResetWidthsText = value
        pgResetWidthsOn = true
      },
      toggle: snippetToggle(pgResetWidthsOn, enabled => (pgResetWidthsOn = enabled)),
      placeholder: '0',
      sync: { kind: 'number' },
    },
    jsonField({
      name: 'rows',
      type: 'DemoRow[]',
      note: 'Demo rows as JSON; the caller filters, sorts, and slices the current page. The eye resets to the default rows.',
      value: JSON.stringify(pgRows, null, 2),
      onChange: (draft: string) => {
        const parsed = parseRowsJson(draft)
        if (parsed) {
          pgRows = parsed
          pgRowsEnabled = true
        }
      },
      dialog: {
        valid: (draft: string) => parseRowsJson(draft) != null,
        invalidMessage: 'Invalid rows JSON. Use an array of { id, name, status } objects.',
        title: 'Edit rows',
      },
      toggle: resetToggle(
        pgRowsEnabled,
        enabled => (pgRowsEnabled = enabled),
        () => (pgRows = freshRows()),
      ),
    }),
    textField({ name: 'searchAriaLabel', type: 'string?', defaultValue: "'Search'", note: 'Accessible name for the search field.', value: pgSearchAriaLabel, onChange: v => (pgSearchAriaLabel = v), editorDefaultValue: 'Search', clearable: true, placeholder: 'Search', enabled: pgSearchAriaLabelOn, setEnabled: v => (pgSearchAriaLabelOn = v) }),
    jsonField({
      name: 'searchKeys',
      type: 'string[]',
      note: 'Bindable searchable column keys; derived from searchable columns when unset. The eye applies the list.',
      value: JSON.stringify(pgSearchKeys ?? ['name', 'status'], null, 2),
      onChange: (draft: string) => {
        const parsed = parseSearchKeysJson(draft)
        if (parsed) {
          pgSearchKeys = parsed
          pgSearchKeysEnabled = true
        }
      },
      dialog: {
        valid: (draft: string) => parseSearchKeysJson(draft) != null,
        invalidMessage: 'Invalid search-keys JSON. Use an array of strings.',
        title: 'Edit searchKeys',
      },
      toggle: snippetToggle(pgSearchKeysEnabled, enabled => (pgSearchKeysEnabled = enabled)),
      sync: {
        kind: 'scriptJson',
        parseJson: parseSearchKeysValue,
        setJson: value => (pgSearchKeys = value as string[]),
      },
    }),
    textField({ name: 'searchPlaceholder', type: 'string?', defaultValue: "'Search'", note: 'Search placeholder.', value: pgPlaceholder, onChange: v => (pgPlaceholder = v), editorDefaultValue: 'Search', clearable: true, placeholder: 'Search', enabled: pgPlaceholderOn, setEnabled: v => (pgPlaceholderOn = v) }),
    {
      name: 'searchValue',
      type: 'string?',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Bindable search text; filtering stays with the caller. The eye resets it to the default.',
      editor: 'text',
      clearable: true,
      value: pgQuery,
      onChange: value => {
        pgQuery = value
        pgQueryOn = true
      },
      toggle: resetToggle(
        pgQueryOn,
        enabled => (pgQueryOn = enabled),
        () => (pgQuery = ''),
      ),
    },
    textField({ name: 'selectAllAriaLabel', type: 'string?', defaultValue: "'Select all'", note: 'Accessible name for the header checkbox.', value: pgSelectAllAriaLabel, onChange: v => (pgSelectAllAriaLabel = v), editorDefaultValue: 'Select all', clearable: true, placeholder: 'Select all', enabled: pgSelectAllAriaLabelOn, setEnabled: v => (pgSelectAllAriaLabelOn = v) }),
    boolField({ name: 'selectable', defaultValue: 'false', note: 'Renders the checkbox column.', value: pgSelectable, onChange: v => (pgSelectable = v as TriState), enabled: pgSelectableOn, setEnabled: v => (pgSelectableOn = v) }),
    boolField({ name: 'showPagination', defaultValue: 'pagination configured', note: 'Renders the pagination footer. Unset, the footer renders only when `pagination` supplies its data and onPageChange.', value: pgShowPagination, onChange: v => (pgShowPagination = v as TriState), enabled: pgShowPaginationOn, setEnabled: v => (pgShowPaginationOn = v) }),
    boolField({ name: 'showSearch', defaultValue: 'true', note: 'Renders the search field.', value: pgShowSearch, onChange: v => (pgShowSearch = v as TriState), enabled: pgShowSearchOn, setEnabled: v => (pgShowSearchOn = v) }),
    sizeField({ note: 'Search, chooser, selection, and pagination scale; numbers are icon-scale pixels interpolated between the steps.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    boolField({ name: 'someSelected', defaultValue: '—', note: 'Header checkbox indeterminate state. Interaction override; unset follows the selection.', value: pgSomeSelected, onChange: v => (pgSomeSelected = v as TriState), enabled: pgSomeSelectedOn, setEnabled: v => (pgSomeSelectedOn = v) }),
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
      value: pgSortDirection,
      onChange: value => {
        pgSortDirection = value === 'desc' ? 'desc' : 'asc'
        pgSortDirectionOn = true
      },
      placeholder: 'asc',
      clearLabel: 'Clear sort direction',
      toggle: resetToggle(
        pgSortDirectionOn,
        enabled => (pgSortDirectionOn = enabled),
        () => (pgSortDirection = 'asc'),
      ),
    },
    {
      name: 'sortKey',
      type: 'string?',
      defaultValue: 'null',
      note: 'Bindable active sort column. The eye resets it to the default.',
      editor: 'text',
      clearable: true,
      value: pgSortKey ?? '',
      onChange: value => {
        pgSortKey = value === '' ? null : value
        pgSortKeyOn = true
      },
      toggle: resetToggle(
        pgSortKeyOn,
        enabled => (pgSortKeyOn = enabled),
        () => (pgSortKey = null),
      ),
    },
    textField({ name: 'storageKey', type: 'string?', defaultValue: '—', note: 'Persists resized widths under this key.', value: pgStorageKey, onChange: v => (pgStorageKey = v), clearable: true, enabled: pgStorageKeyOn, setEnabled: v => (pgStorageKeyOn = v) }),
    textField({ name: 'tableClassName', type: 'string?', defaultValue: "'min-w-0'", note: 'Extra classes for the table element; raise the minimum width when columns need a horizontal scroll floor.', value: pgTableClassName, onChange: v => (pgTableClassName = v), editorDefaultValue: 'min-w-0', clearable: true, placeholder: 'min-w-0', enabled: pgTableClassNameOn, setEnabled: v => (pgTableClassNameOn = v) }),
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
    }}

    sync={{ tag: 'DataTable' }}
    scopeRefresh={() => [pgQuery, pgPage, pgSortKey, pgSortDirection, pgSelected, hidden]}
  >
    <ShowcaseStage paneClass={stagePaneClass}>
      <DataTable
        rows={pageRows}
        columns={visibleColumns}
        rowId={row => row.id}
        searchAriaLabel={pgSearchAriaLabelOn && pgSearchAriaLabel ? pgSearchAriaLabel : undefined}
        bind:searchValue={pgQuery}
        searchKeys={pgSearchKeysEnabled ? pgSearchKeys ?? undefined : undefined}
        onSearchInput={handleSearchInput}
        {showSearch}
        searchPlaceholder={pgPlaceholderOn && pgPlaceholder ? pgPlaceholder : undefined}
        emptyMessage={pgEmptyMessageOn && pgEmptyMessage ? pgEmptyMessage : undefined}
        {showPagination}
        chooserColumns={chooserEntries}
        chooserLabel={pgChooserLabelOn && pgChooserLabel ? pgChooserLabel : undefined}
        chooserResetLabel={pgChooserResetLabelOn && pgChooserResetLabel ? pgChooserResetLabel : undefined}
        onToggleColumn={handleToggleColumn}
        onResetColumns={handleResetColumns}
        bind:sortKey={pgSortKey}
        bind:sortDirection={pgSortDirection}
        pagination={{
          total: rowTotal,
          pageSize: pgPageSize,
          currentPage: pgPage,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          trailing: tableTrailing,
        }}
        {selectable}
        selectedIds={pgSelected}
        onToggleSelection={handleToggleSelection}
        onToggleAll={handleToggleAll}
        allSelected={pgAllSelectedOn ? (pgAllSelected === '' ? allRowsSelected : pgAllSelected === 'yes') : undefined}
        someSelected={pgSomeSelectedOn ? (pgSomeSelected === '' ? someRowsSelected : pgSomeSelected === 'yes') : undefined}
        selectAllAriaLabel={pgSelectAllAriaLabelOn && pgSelectAllAriaLabel ? pgSelectAllAriaLabel : undefined}
        rowSelectAriaLabel={row => `Select ${row.name}`}
        {dense}
        {fillHeight}
        {bodyScroll}
        {resizable}
        resizeAriaLabel={column => `Resize ${column.header}`}
        containerClassName={pgContainerClassNameOn && pgContainerClassName ? pgContainerClassName : undefined}
        tableClassName={pgTableClassNameOn && pgTableClassName ? pgTableClassName : undefined}
        storageKey={pgStorageKeyOn && pgStorageKey ? pgStorageKey : undefined}
        size={demoSize}
        resetWidthsSignal={demoResetWidths}
        {loading} />
    </ShowcaseStage>
  </ShowcasePage>
