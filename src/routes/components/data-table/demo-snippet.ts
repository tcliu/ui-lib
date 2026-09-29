// Show-code source for the DataTable demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. Scope-driven lines
// stay symbolic; the curated form options are baked in as literals.
// Single-quoted lines throughout: backticks and ${} inside them stay literal,
// so no escaping.

import { stageStaticCloseLines, stageStaticOpenLines } from '$lib/showcase/resizable-stage'

// Page-size choices demonstrated by the demo's pagination dropdown; the small 5
// keeps several pages visible so the placement is easy to see.
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

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

// Curated playground option: unset renders the component default, Yes/No force
// the value. Every option starts unset, so the cleared form applies no
// overrides.
export type TriState = '' | 'yes' | 'no'

export interface DataTableSnippetState {
  rows: DemoRow[]
  showSearch: TriState
  showPagination: TriState
  selectable: TriState
  dense: TriState
  resizable: TriState
  loading: TriState
  fillHeight: TriState
  bodyScroll: TriState
  placeholder: string
  emptyMessage: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
// Indented for the DataTable props inside the resizable stage.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`      ${name}${value === 'yes' ? '' : '={false}'}`]
}

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
  placeholder,
  emptyMessage,
}: DataTableSnippetState): string {
  const paneClass = fillHeight === 'yes' ? TABLE_STAGE_PANE_FILL : TABLE_STAGE_PANE
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
    '{#snippet tableTrailing()}',
    '  <span class="text-xs text-slate-400">{visibleTotal(rows, pgQuery)} rows</span>',
    '{/snippet}',
    ...stageStaticOpenLines('', paneClass),
    '    <DataTable',
    '      rows={visibleRows(rows, pgQuery, pgSortKey, pgSortDirection, pgPage, pgPageSize)}',
    '      columns={columns.filter(column => !hidden.has(column.key))}',
    '      rowId={row => row.id}',
    ...(showSearch === 'no'
      ? []
      : [
          '      searchAriaLabel="Search rows"',
          '      bind:searchValue={pgQuery}',
          '      onSearchInput={handleSearchInput}',
        ]),
    ...flagLine('showSearch', showSearch),
    ...(placeholder ? [`      searchPlaceholder="${escapeAttr(placeholder)}"`] : []),
    ...(emptyMessage ? [`      emptyMessage="${escapeAttr(emptyMessage)}"`] : []),
    ...flagLine('showPagination', showPagination),
    '      chooserColumns={columns.map(column => ({ key: column.key, header: column.header, checked: !hidden.has(column.key) }))}',
    '      onToggleColumn={handleToggleColumn}',
    '      onResetColumns={handleResetColumns}',
    '      paginationTrailing={tableTrailing}',
    '      bind:sortKey={pgSortKey}',
    '      bind:sortDirection={pgSortDirection}',
    '      total={visibleTotal(rows, pgQuery)}',
    '      pageSize={pgPageSize}',
    '      currentPage={pgPage}',
    '      onPageChange={handlePageChange}',
    '      onPageSizeChange={handlePageSizeChange}',
    `      pageSizeOptions={[${PAGE_SIZE_OPTIONS.join(', ')}]}`,
    ...flagLine('selectable', selectable),
    ...(selectable === 'yes'
      ? [
          '      selectedIds={pgSelected}',
          '      onToggleSelection={(id, checked) => (pgSelected = toggleSelection(pgSelected, id, checked))}',
          '      onToggleAll={() => (pgSelected = toggleAllSelected(pgSelected, rows.map(row => row.id)))}',
          '      allSelected={pgSelected.size > 0 && pgSelected.size === rows.length}',
          '      someSelected={pgSelected.size > 0 && pgSelected.size < rows.length}',
          '      selectAllAriaLabel="Select all rows"',
          '      rowSelectAriaLabel={row => `Select ${row.name}`}',
        ]
      : []),
    ...flagLine('dense', dense),
    ...flagLine('fillHeight', fillHeight),
    ...flagLine('bodyScroll', bodyScroll),
    ...flagLine('resizable', resizable),
    ...(resizable === 'yes' ? ['      resizeAriaLabel={column => `Resize ${column.header}`}'] : []),
    ...flagLine('loading', loading),
    '    />',
    ...stageStaticCloseLines(''),
  ]
  return lines.join('\n')
}
