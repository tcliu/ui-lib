// Show-code source for the DataTable demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. Scope-driven lines
// stay symbolic; the curated form options are baked in as literals.
// Single-quoted lines throughout: backticks and ${} inside them stay literal,
// so no escaping.

import { boolAttrLine, enumAttrLine, escapeText, sizeAttrLine, textAttrLine, type TriState } from '#showcase/playground/snippet-build.js'
import { stageStaticCloseLines, stageStaticOpenLines } from '#showcase/shell/resizable-stage.js'
import type { Staged } from '#showcase/playground/staged.js'

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

// One distinct demo name per row, so the table exercises four pages of unique
// records at the default page size.
const DEMO_NAMES = [
  'Catalog',
  'Editor',
  'Viewer',
  'Sync',
  'Archive',
  'Portal',
  'Ledger',
  'Billing',
  'Invoicing',
  'Payments',
  'Receipts',
  'Refunds',
  'Disputes',
  'Settlements',
  'Clearing',
  'Treasury',
  'Custody',
  'Collateral',
  'Margin',
  'Exposure',
  'Limits',
  'Compliance',
  'Audit',
  'Reporting',
  'Analytics',
  'Dashboard',
  'Insights',
  'Forecast',
  'Budget',
  'Planning',
  'Procurement',
  'Inventory',
  'Warehouse',
  'Shipping',
  'Tracking',
  'Routing',
  'Dispatch',
  'Fulfillment',
  'Orders',
  'Checkout',
  'Pricing',
  'Discounts',
  'Subscriptions',
  'Renewals',
  'Trials',
  'Onboarding',
  'Identity',
  'Access',
  'Roles',
  'Permissions',
  'Sessions',
  'Notifications',
  'Messaging',
  'Inbox',
  'Threads',
  'Comments',
  'Reactions',
  'Publishing',
  'Drafts',
  'Reviews',
  'Approvals',
  'Workflows',
  'Automations',
  'Integrations',
  'Webhooks',
  'Connectors',
  'Imports',
  'Exports',
  'Backups',
  'Recovery',
  'Monitoring',
  'Alerts',
  'Incidents',
  'Support',
  'Knowledge',
]

// Default demo rows shared by the page and the snippet so the static demo and
// the Show-code source start from the same data.
export const DEFAULT_ROWS: DemoRow[] = DEMO_NAMES.map((name, index) => {
  const n = index + 1
  return { id: `p${n}`, name, status: n % 3 === 0 ? 'Draft' : 'Active' }
})

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

// Parse a column-filter map: an object of non-blank keys to string values, the
// shape `filters` takes. Anything else returns null so the dialog can refuse it.
export function parseFiltersValue(value: unknown): Record<string, string> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const out: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') {
      return null
    }
    out[key] = entry
  }
  return out
}

export function parseFiltersJson(text: string): Record<string, string> | null {
  try {
    return parseFiltersValue(JSON.parse(text))
  } catch {
    return null
  }
}

export interface DataTableSnippetState {
  rows: Staged<DemoRow[]>
  showSearch: Staged<TriState>
  showPagination: Staged<TriState>
  selectable: Staged<TriState>
  dense: Staged<TriState>
  resizable: Staged<TriState>
  loading: Staged<TriState>
  fillHeight: Staged<TriState>
  bodyScroll: Staged<TriState>
  bordered: Staged<TriState>
  placeholder: Staged<string>
  emptyMessage: Staged<string>
  trailing: string
  searchAriaLabel: Staged<string>
  // Eye toggle for the optional search-keys list: off omits the prop and its
  // seed (the committed list stays in the dialog).
  searchKeys: Staged<string[] | null>
  chooserLabel: Staged<string>
  chooserResetLabel: Staged<string>
  columnFilters: Staged<TriState>
  filters: Staged<Record<string, string>>
  selectAllAriaLabel: Staged<string>
  allSelected: Staged<TriState>
  someSelected: Staged<TriState>
  containerClassName: Staged<string>
  tableClassName: Staged<string>
  storageKey: Staged<string>
  storagePrefix: Staged<string>
  variant: Staged<string>
  resetWidthsSignal: Staged<string>
  size: Staged<string>
}

// Element text for the trailing span below.

export function buildDataTableSnippet({
  rows,
  showSearch,
  showPagination,
  selectable,
  dense,
  resizable,
  loading,
  fillHeight,
  bodyScroll,
  bordered,
  placeholder,
  emptyMessage,
  trailing,
  searchAriaLabel,
  searchKeys,
  chooserLabel,
  chooserResetLabel,
  columnFilters,
  filters,
  selectAllAriaLabel,
  allSelected,
  someSelected,
  containerClassName,
  tableClassName,
  storageKey,
  storagePrefix,
  variant,
  resetWidthsSignal,
  size,
}: DataTableSnippetState): string {
  const paneClass = fillHeight.on && fillHeight.value === 'yes' ? TABLE_STAGE_PANE_FILL : TABLE_STAGE_PANE
  // A rising widths-reset signal: emitted only while a positive integer, so
  // the cleared form applies no overrides.
  const resetSignal = Number.parseInt(resetWidthsSignal.value, 10)
  const lines = [
    '<script>',
    '  const rows = [',
    ...rows.value.map(row => `    { id: '${row.id}', name: '${row.name}', status: '${row.status}' },`),
    '  ]',
    '  const columns = [',
    "    { key: 'id', header: 'ID', cell: idCell },",
    "    { key: 'name', header: 'Name', sortable: true, searchable: true, filterable: true, cell: nameCell },",
    "    { key: 'status', header: 'Status', searchable: true, filterable: true, cell: statusCell },",
    '  ]',
    ...(searchKeys.value && searchKeys.on ? [`  let searchKeys = $state(${JSON.stringify(searchKeys.value)});`] : []),
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
          `  <span class="text-xs text-slate-400">{visibleTotal(rows, pgQuery, pgFilters)} ${escapeText(trailing)}</span>`,
          '{/snippet}',
        ]
      : []),
    ...stageStaticOpenLines('', paneClass),
    '    <DataTable',
    '      rows={visibleRows(rows, pgQuery, pgFilters, pgSortKey, pgSortDirection, pgPage, demoPageSize)}',
    '      columns={columns.filter(column => !hidden.has(column.key))}',
    '      rowId={row => row.id}',
    ...(showSearch.on && showSearch.value === 'no'
      ? []
      : [
          ...textAttrLine('searchAriaLabel', searchAriaLabel, '      '),
          '      bind:searchValue={pgQuery}',
          ...(searchKeys.value && searchKeys.on ? ['      searchKeys={searchKeys}'] : []),
          '      onSearchInput={handleSearchInput}',
        ]),
    ...boolAttrLine('showSearch', showSearch, 'yes', '      '),
    ...textAttrLine('searchPlaceholder', placeholder, '      '),
    ...textAttrLine('emptyMessage', emptyMessage, '      '),
    ...boolAttrLine('showPagination', showPagination, '', '      '),
    '      chooserColumns={columns.map(column => ({ key: column.key, header: column.header, checked: !hidden.has(column.key) }))}',
    ...textAttrLine('chooserLabel', chooserLabel, '      '),
    ...textAttrLine('chooserResetLabel', chooserResetLabel, '      '),
    '      onToggleColumn={handleToggleColumn}',
    '      onResetColumns={handleResetColumns}',
    ...boolAttrLine('columnFilters', columnFilters, 'no', '      '),
    ...(filters.on ? ['      bind:filters={pgFilters}', '      onFilter={handleFilter}'] : []),
    '      bind:sortKey={pgSortKey}',
    '      bind:sortDirection={pgSortDirection}',
    '      pagination={{',
    '        total: visibleTotal(rows, pgQuery, pgFilters),',
    '        pageSize: demoPageSize,',
    '        currentPage: pgPage,',
    '        onPageChange: handlePageChange,',
    '        onPageSizeChange: handlePageSizeChange,',
    ...(trailing ? ['        trailing: tableTrailing,'] : []),
    '      }}',
    ...boolAttrLine('selectable', selectable, 'no', '      '),
    ...(selectable.on && selectable.value === 'yes'
      ? [
          '      selectedIds={pgSelected}',
          '      onToggleSelection={(id, checked) => (pgSelected = toggleSelection(pgSelected, id, checked))}',
          '      onToggleAll={() => (pgSelected = toggleAllSelected(pgSelected, rows.map(row => row.id)))}',
          ...(allSelected.on
            ? allSelected.value === ''
              ? ['      allSelected={pgSelected.size > 0 && pgSelected.size === rows.length}']
              : boolAttrLine('allSelected', allSelected, '', '      ')
            : []),
          ...(someSelected.on
            ? someSelected.value === ''
              ? ['      someSelected={pgSelected.size > 0 && pgSelected.size < rows.length}']
              : boolAttrLine('someSelected', someSelected, '', '      ')
            : []),
          ...textAttrLine('selectAllAriaLabel', selectAllAriaLabel, '      '),
          '      rowSelectAriaLabel={row => `Select ${row.name}`}',
        ]
      : []),
    ...boolAttrLine('dense', dense, 'no', '      '),
    ...boolAttrLine('fillHeight', fillHeight, 'no', '      '),
    ...boolAttrLine('bodyScroll', bodyScroll, 'no', '      '),
    ...boolAttrLine('bordered', bordered, 'yes', '      '),
    ...boolAttrLine('resizable', resizable, 'no', '      '),
    ...(resizable.on && resizable.value === 'yes' ? ['      resizeAriaLabel={column => `Resize ${column.header}`}'] : []),
    ...boolAttrLine('loading', loading, 'no', '      '),
    ...textAttrLine('containerClassName', containerClassName, '      '),
    ...textAttrLine('tableClassName', tableClassName, '      '),
    ...textAttrLine('storageKey', storageKey, '      '),
    ...textAttrLine('storagePrefix', storagePrefix, '      '),
    // The variant row prefills its `data` default; the builder omits it.
    ...enumAttrLine('variant', variant, 'data', '      '),
    // The size row prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...sizeAttrLine(size, '      '),
    ...(resetWidthsSignal.on && Number.isInteger(resetSignal) && resetSignal > 0 ? [`      resetWidthsSignal={${resetSignal}}`] : []),
    '    />',
    ...stageStaticCloseLines(''),
  ]
  return lines.join('\n')
}
