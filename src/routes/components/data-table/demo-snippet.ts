// Show-code source for the DataTable demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. Scope-driven lines
// stay symbolic; the curated form options are baked in as literals.
// Single-quoted lines throughout: backticks and ${} inside them stay literal,
// so no escaping.

import { escapeAttr, escapeText } from '$showcase/snippet-build'
import { sizeAttributeLine } from '$showcase/size-input'
import { stageStaticCloseLines, stageStaticOpenLines } from '$showcase/resizable-stage'

// A string attribute line, omitted while unset.
function textLine(name: string, value: string): string[] {
  return value ? [`      ${name}="${escapeAttr(value)}"`] : []
}

// Validate unknown data into a search-key list (every entry a string).
// Returns null for anything else, so the dialog and parse-back apply only
// well-shaped lists.
export function parseSearchKeysValue(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every(entry => typeof entry === 'string')) {
    return null
  }
  return [...value]
}

// Parse a search-keys editor draft (a JSON array of strings). Returns null
// for anything else, so the dialog can block OK and explain instead of
// applying half-shaped data.
export function parseSearchKeysJson(text: string): string[] | null {
  try {
    return parseSearchKeysValue(JSON.parse(text))
  } catch {
    return null
  }
}

// Validate unknown data into chooser entries against the demo's canonical
// columns: the same key set with canonical headers, in any order, with any
// checked combination. Headers derive from the column defs, so a draft with
// renamed headers or unknown keys returns null and the dialog blocks OK
// instead of applying a shape the demo cannot reproduce exactly.
export function parseChooserColumnsValue(
  value: unknown,
  canonical: { key: string; header: string }[],
): { key: string; header: string; checked: boolean }[] | null {
  if (!Array.isArray(value) || value.length !== canonical.length) {
    return null
  }
  const headersByKey = new Map(canonical.map(column => [column.key, column.header]))
  const seen = new Set<string>()
  const out: { key: string; header: string; checked: boolean }[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return null
    }
    const { key, header, checked } = entry as { key?: unknown; header?: unknown; checked?: unknown }
    if (typeof key !== 'string' || typeof header !== 'string' || typeof checked !== 'boolean') {
      return null
    }
    if (headersByKey.get(key) !== header || seen.has(key)) {
      return null
    }
    seen.add(key)
    out.push({ key, header, checked })
  }
  return out
}

// Parse a chooser-columns editor draft (a JSON array of
// `{ key, header, checked }` objects over the canonical columns). Returns null
// for anything else, so the dialog can block OK and explain instead of
// applying half-shaped data.
export function parseChooserColumnsJson(
  text: string,
  canonical: { key: string; header: string }[],
): { key: string; header: string; checked: boolean }[] | null {
  try {
    return parseChooserColumnsValue(JSON.parse(text), canonical)
  } catch {
    return null
  }
}

// Stage pane classes: `fillHeight` needs a bounded flex column so the table
// fills it and its pagination pins to the bottom; otherwise the pane is a plain
// full-width block.
export const TABLE_STAGE_PANE = 'w-full'
export const TABLE_STAGE_PANE_FILL = 'flex h-[28rem] w-full flex-col'

export interface DemoRow {
  id: string
  name: string
  status: string
}

// Default demo rows shared by the page and the snippet so the static demo and
// the Show-code source start from the same data.
export const DEFAULT_ROWS: DemoRow[] = [
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

// Validate unknown data into a demo-row list (every entry exactly
// `{ id, name, status }` strings, the shape the snippet builder emits).
// Returns null for anything else, so the dialog and commit apply only
// well-shaped lists that round-trip exactly.
export function parseRowsValue(value: unknown): DemoRow[] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const out: DemoRow[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return null
    }
    const record = entry as Record<string, unknown>
    const keys = Object.keys(record)
    if (
      keys.length !== 3 ||
      typeof record.id !== 'string' ||
      typeof record.name !== 'string' ||
      typeof record.status !== 'string'
    ) {
      return null
    }
    out.push({ id: record.id, name: record.name, status: record.status })
  }
  return out
}

// Parse a rows editor draft (a JSON array of `{ id, name, status }` objects).
// Returns null for anything else, so the dialog can block OK and explain
// instead of applying half-shaped data.
export function parseRowsJson(text: string): DemoRow[] | null {
  try {
    return parseRowsValue(JSON.parse(text))
  } catch {
    return null
  }
}

// Curated playground option: unset or the component default renders the
// default, Yes/No force the value. Options start at the default, so the
// cleared form applies no overrides.
export type TriState = '' | 'yes' | 'no'

export interface DataTableSnippetState {
  rows: DemoRow[]
  showSearch: TriState
  showSearchOn: boolean
  showPagination: TriState
  showPaginationOn: boolean
  selectable: TriState
  selectableOn: boolean
  dense: TriState
  denseOn: boolean
  resizable: TriState
  resizableOn: boolean
  loading: TriState
  loadingOn: boolean
  fillHeight: TriState
  fillHeightOn: boolean
  bodyScroll: TriState
  bodyScrollOn: boolean
  placeholder: string
  placeholderOn: boolean
  emptyMessage: string
  emptyMessageOn: boolean
  trailing: string
  searchAriaLabel: string
  searchAriaLabelOn: boolean
  searchKeys: string[] | null
  // Eye toggle for the optional search-keys list: off omits the prop and its
  // seed (the committed list stays in the dialog).
  searchKeysEnabled: boolean
  chooserLabel: string
  chooserLabelOn: boolean
  chooserResetLabel: string
  chooserResetLabelOn: boolean
  selectAllAriaLabel: string
  selectAllAriaLabelOn: boolean
  allSelected: TriState
  allSelectedOn: boolean
  someSelected: TriState
  someSelectedOn: boolean
  containerClassName: string
  containerClassNameOn: boolean
  tableClassName: string
  tableClassNameOn: boolean
  storageKey: string
  storageKeyOn: boolean
  resetWidthsSignal: string
  resetWidthsSignalOn: boolean
  size: string
  sizeOn: boolean
}

// Element text for the trailing span below.

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
// Indented for the DataTable props inside the resizable stage.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`      ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildDataTableSnippet({
  rows,
  showSearch,
  showSearchOn,
  showPagination,
  showPaginationOn,
  selectable,
  selectableOn,
  dense,
  denseOn,
  resizable,
  resizableOn,
  loading,
  loadingOn,
  fillHeight,
  fillHeightOn,
  bodyScroll,
  bodyScrollOn,
  placeholder,
  placeholderOn,
  emptyMessage,
  emptyMessageOn,
  trailing,
  searchAriaLabel,
  searchAriaLabelOn,
  searchKeys,
  searchKeysEnabled,
  chooserLabel,
  chooserLabelOn,
  chooserResetLabel,
  chooserResetLabelOn,
  selectAllAriaLabel,
  selectAllAriaLabelOn,
  allSelected,
  allSelectedOn,
  someSelected,
  someSelectedOn,
  containerClassName,
  containerClassNameOn,
  tableClassName,
  tableClassNameOn,
  storageKey,
  storageKeyOn,
  resetWidthsSignal,
  resetWidthsSignalOn,
  size,
  sizeOn,
}: DataTableSnippetState): string {
  const paneClass = fillHeightOn && fillHeight === 'yes' ? TABLE_STAGE_PANE_FILL : TABLE_STAGE_PANE
  // A rising widths-reset signal: emitted only while a positive integer, so
  // the cleared form applies no overrides.
  const resetSignal = Number.parseInt(resetWidthsSignal, 10)
  const lines = [
    '<script>',
    '  const rows = [',
    ...rows.map(row => `    { id: '${row.id}', name: '${row.name}', status: '${row.status}' },`),
    '  ]',
    '  const columns = [',
    "    { key: 'id', header: 'ID', cell: idCell },",
    "    { key: 'name', header: 'Name', sortable: true, searchable: true, cell: nameCell },",
    "    { key: 'status', header: 'Status', searchable: true, cell: statusCell },",
    '  ]',
    ...(searchKeys && searchKeysEnabled ? [`  let searchKeys = $state(${JSON.stringify(searchKeys)});`] : []),
    '</script>',
    '{#snippet nameCell(row)}',
    '  <strong class="font-medium text-slate-100">{row.name}</strong>',
    '{/snippet}',
    '{#snippet statusCell(row)}',
    '  <span class="text-slate-300">{row.status}</span>',
    '{/snippet}',
    '{#snippet idCell(row)}',
    '  <span class="font-mono text-slate-400">{row.id}</span>',
    '{/snippet}',
    ...(trailing
      ? [
          '{#snippet tableTrailing()}',
          `  <span class="text-xs text-slate-400">{visibleTotal(rows, pgQuery)} ${escapeText(trailing)}</span>`,
          '{/snippet}',
        ]
      : []),
    ...stageStaticOpenLines('', paneClass),
    '    <DataTable',
    '      rows={visibleRows(rows, pgQuery, pgSortKey, pgSortDirection, pgPage, demoPageSize)}',
    '      columns={columns.filter(column => !hidden.has(column.key))}',
    '      rowId={row => row.id}',
    ...(showSearchOn && showSearch === 'no'
      ? []
      : [
          ...(searchAriaLabelOn && searchAriaLabel ? textLine('searchAriaLabel', searchAriaLabel) : []),
          '      bind:searchValue={pgQuery}',
          ...(searchKeys && searchKeysEnabled ? ['      searchKeys={searchKeys}'] : []),
          '      onSearchInput={handleSearchInput}',
        ]),
    ...(showSearchOn ? flagLine('showSearch', showSearch, 'yes') : []),
    ...(placeholderOn && placeholder ? [`      searchPlaceholder="${escapeAttr(placeholder)}"`] : []),
    ...(emptyMessageOn && emptyMessage ? [`      emptyMessage="${escapeAttr(emptyMessage)}"`] : []),
    ...(showPaginationOn ? flagLine('showPagination', showPagination) : []),
    '      chooserColumns={columns.map(column => ({ key: column.key, header: column.header, checked: !hidden.has(column.key) }))}',
    ...(chooserLabelOn && chooserLabel ? textLine('chooserLabel', chooserLabel) : []),
    ...(chooserResetLabelOn && chooserResetLabel ? textLine('chooserResetLabel', chooserResetLabel) : []),
    '      onToggleColumn={handleToggleColumn}',
    '      onResetColumns={handleResetColumns}',
    '      bind:sortKey={pgSortKey}',
    '      bind:sortDirection={pgSortDirection}',
    '      pagination={{',
    '        total: visibleTotal(rows, pgQuery),',
    '        pageSize: demoPageSize,',
    '        currentPage: pgPage,',
    '        onPageChange: handlePageChange,',
    '        onPageSizeChange: handlePageSizeChange,',
    ...(trailing ? ['        trailing: tableTrailing,'] : []),
    '      }}',
    ...(selectableOn ? flagLine('selectable', selectable, 'no') : []),
    ...(selectableOn && selectable === 'yes'
      ? [
          '      selectedIds={pgSelected}',
          '      onToggleSelection={(id, checked) => (pgSelected = toggleSelection(pgSelected, id, checked))}',
          '      onToggleAll={() => (pgSelected = toggleAllSelected(pgSelected, rows.map(row => row.id)))}',
          ...(allSelectedOn
            ? allSelected === ''
              ? ['      allSelected={pgSelected.size > 0 && pgSelected.size === rows.length}']
              : flagLine('allSelected', allSelected)
            : []),
          ...(someSelectedOn
            ? someSelected === ''
              ? ['      someSelected={pgSelected.size > 0 && pgSelected.size < rows.length}']
              : flagLine('someSelected', someSelected)
            : []),
          ...(selectAllAriaLabelOn && selectAllAriaLabel ? textLine('selectAllAriaLabel', selectAllAriaLabel) : []),
          '      rowSelectAriaLabel={row => `Select ${row.name}`}',
        ]
      : []),
    ...(denseOn ? flagLine('dense', dense, 'no') : []),
    ...(fillHeightOn ? flagLine('fillHeight', fillHeight, 'no') : []),
    ...(bodyScrollOn ? flagLine('bodyScroll', bodyScroll, 'no') : []),
    ...(resizableOn ? flagLine('resizable', resizable, 'no') : []),
    ...(resizableOn && resizable === 'yes' ? ['      resizeAriaLabel={column => `Resize ${column.header}`}'] : []),
    ...(loadingOn ? flagLine('loading', loading, 'no') : []),
    ...(containerClassNameOn && containerClassName ? textLine('containerClassName', containerClassName) : []),
    ...(tableClassNameOn && tableClassName ? textLine('tableClassName', tableClassName) : []),
    ...(storageKeyOn && storageKey ? textLine('storageKey', storageKey) : []),
    // The size row prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, '      ') : []),
    ...(resetWidthsSignalOn && Number.isInteger(resetSignal) && resetSignal > 0 ? [`      resetWidthsSignal={${resetSignal}}`] : []),
    '    />',
    ...stageStaticCloseLines(''),
  ]
  return lines.join('\n')
}
