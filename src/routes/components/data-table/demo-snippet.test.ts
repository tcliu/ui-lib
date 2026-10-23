import { describe, expect, it } from 'vitest'
import { STAGE_PANE, STAGE_ROW } from '$lib/showcase/resizable-stage'
import {
  buildDataTableSnippet,
  parseChooserColumnsJson,
  parseChooserColumnsValue,
  parseRowsJson,
  parseRowsValue,
  parseSearchKeysJson,
  parseSearchKeysValue,
  TABLE_STAGE_PANE,
  TABLE_STAGE_PANE_FILL,
  type DataTableSnippetState,
} from './demo-snippet'

const base: DataTableSnippetState = {
  rows: [
    { id: 'p1', name: 'Catalog', status: 'Active' },
    { id: 'p2', name: 'Editor', status: 'Draft' },
  ],
  showSearch: '',
  showSearchOn: true,
  showPagination: '',
  showPaginationOn: true,
  selectable: '',
  selectableOn: true,
  dense: '',
  denseOn: true,
  resizable: '',
  resizableOn: true,
  loading: '',
  loadingOn: true,
  fillHeight: '',
  fillHeightOn: true,
  bodyScroll: '',
  bodyScrollOn: true,
  placeholder: '',
  placeholderOn: false,
  emptyMessage: '',
  emptyMessageOn: false,
  trailing: '',
  searchAriaLabel: '',
  searchAriaLabelOn: false,
  searchKeys: null,
  searchKeysEnabled: true,
  chooserLabel: '',
  chooserLabelOn: false,
  chooserResetLabel: '',
  chooserResetLabelOn: false,
  selectAllAriaLabel: '',
  selectAllAriaLabelOn: false,
  allSelected: '',
  allSelectedOn: true,
  someSelected: '',
  someSelectedOn: true,
  containerClassName: '',
  containerClassNameOn: false,
  tableClassName: '',
  tableClassNameOn: false,
  storageKey: '',
  storageKeyOn: false,
  resetWidthsSignal: '',
  resetWidthsSignalOn: true,
  size: '',
  sizeOn: true,
}

describe('buildDataTableSnippet', () => {
  it('omits the trailing snippet while unset and emits the suffix when set', () => {
    const unset = buildDataTableSnippet(base)
    expect(unset).not.toContain('trailing: tableTrailing,')
    expect(unset).not.toContain('{#snippet tableTrailing()}')
    const set = buildDataTableSnippet({ ...base, trailing: 'entries' })
    expect(set).toContain('trailing: tableTrailing,')
    expect(set).toContain('{#snippet tableTrailing()}')
    expect(set).toContain('{visibleTotal(rows, pgQuery)} entries</span>')
  })

  it('escapes the trailing suffix', () => {
    const source = buildDataTableSnippet({ ...base, trailing: 'a & <b>' })
    expect(source).toContain('{visibleTotal(rows, pgQuery)} a &amp; &lt;b&gt;</span>')
  })

  it('emits the pagination object with the scope paging wiring', () => {
    const source = buildDataTableSnippet(base)
    expect(source).toContain('pagination={{')
    expect(source).toContain('total: visibleTotal(rows, pgQuery),')
    expect(source).toContain('pageSize: demoPageSize,')
    expect(source).toContain('currentPage: pgPage,')
    expect(source).toContain('onPageChange: handlePageChange,')
    expect(source).toContain('onPageSizeChange: handlePageSizeChange,')
  })

  it('declares rows and columns in a leading script', () => {
    const source = buildDataTableSnippet(base)
    expect(source.startsWith('<script>')).toBe(true)
    expect(source).toContain("{ id: 'p1', name: 'Catalog', status: 'Active' },")
    expect(source).toContain("{ key: 'name', header: 'Name', sortable: true")
    expect(source.indexOf('</script>')).toBeGreaterThan(0)
    expect(source.indexOf('</script>')).toBeLessThan(source.indexOf('<DataTable'))
  })

  it('omits every tri-state flag while unset', () => {
    const source = buildDataTableSnippet(base)
    for (const flag of [
      'showSearch',
      'showPagination',
      'selectable',
      'dense',
      'resizable',
      'loading',
      'fillHeight',
      'bodyScroll',
    ]) {
      expect(source).not.toContain(`\n      ${flag}`)
    }
    expect(source).not.toContain('selectedIds=')
    expect(source).not.toContain('resizeAriaLabel=')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('emits the loading flag when set', () => {
    const source = buildDataTableSnippet({ ...base, loading: 'yes' })
    expect(source).toContain('\n      loading\n')
  })

  it('emits a named size as a string and a numeric size as an expression', () => {
    expect(buildDataTableSnippet({ ...base, size: 'lg', sizeOn: true })).toContain('size="lg"')
    expect(buildDataTableSnippet({ ...base, size: '14', sizeOn: true })).toContain('size={14}')
    expect(buildDataTableSnippet({ ...base, size: 'huge', sizeOn: true })).not.toMatch(/^\s*size=/m)
  })

  it('adds selection wiring only while selectable', () => {
    const source = buildDataTableSnippet({ ...base, selectable: 'yes' })
    expect(source).toContain('\n      selectable\n')
    expect(source).toContain('selectedIds={pgSelected}')
    const explicit = buildDataTableSnippet({ ...base, selectable: 'no' })
    expect(explicit).not.toContain('selectable')
    expect(explicit).not.toContain('selectedIds=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildDataTableSnippet({
      ...base,
      showSearch: 'yes',
      selectable: 'no',
      dense: 'no',
      resizable: 'no',
      loading: 'no',
      fillHeight: 'no',
      bodyScroll: 'no',
      size: 'md',
      sizeOn: true,
    })
    for (const flag of [
      'showSearch',
      'selectable',
      'dense',
      'resizable',
      'loading',
      'fillHeight',
      'bodyScroll',
    ]) {
      expect(source).not.toContain(`\n      ${flag}`)
    }
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('emits ={false} for a default-true flag when cleared', () => {
    expect(buildDataTableSnippet({ ...base, showSearch: 'no' })).toContain('showSearch={false}')
  })

  it('wraps the table in the handle-less static stage the page renders', () => {
    const source = buildDataTableSnippet(base)
    expect(source).toContain(`<div class="${STAGE_ROW}">`)
    expect(source).toContain(`<div class="${STAGE_PANE} ${TABLE_STAGE_PANE}">`)
    expect(source).not.toContain('stageWidth')
    expect(source).not.toContain('role="separator"')
  })

  it('bounds the stage and emits the flag only while fillHeight is on', () => {
    const off = buildDataTableSnippet(base)
    expect(off).not.toContain('\n      fillHeight')
    expect(off).toContain(`<div class="${STAGE_PANE} ${TABLE_STAGE_PANE}"`)

    const on = buildDataTableSnippet({ ...base, fillHeight: 'yes' })
    expect(on).toContain('\n      fillHeight\n')
    expect(on).toContain(`<div class="${STAGE_PANE} ${TABLE_STAGE_PANE_FILL}"`)
  })

  it('emits the bodyScroll flag when set', () => {
    const source = buildDataTableSnippet({ ...base, bodyScroll: 'yes' })
    expect(source).toContain('\n      bodyScroll\n')
  })

  it('escapes placeholder quotes for the attribute', () => {
    const source = buildDataTableSnippet({ ...base, placeholder: 'Find "rows"', placeholderOn: true })
    expect(source).toContain('searchPlaceholder="Find &quot;rows&quot;"')
  })

  it('omits every label while unset and emits each literal when set', () => {
    const source = buildDataTableSnippet(base)
    for (const label of [
      'searchAriaLabel=',
      'chooserLabel=',
      'chooserResetLabel=',
      'selectAllAriaLabel=',
      'containerClassName=',
      'tableClassName=',
      'storageKey=',
    ]) {
      expect(source).not.toContain(label)
    }
    const set = buildDataTableSnippet({
      ...base,
      selectable: 'yes',
      searchAriaLabel: 'Find rows',
      searchAriaLabelOn: true,
      chooserLabel: 'Columns',
      chooserLabelOn: true,
      chooserResetLabel: 'Reset',
      chooserResetLabelOn: true,
      selectAllAriaLabel: 'Select all',
      selectAllAriaLabelOn: true,
      containerClassName: 'custom-wrap',
      containerClassNameOn: true,
      tableClassName: 'min-w-[40rem]',
      tableClassNameOn: true,
      storageKey: 'demo-widths',
      storageKeyOn: true,
    })
    expect(set).toContain('searchAriaLabel="Find rows"')
    expect(set).toContain('chooserLabel="Columns"')
    expect(set).toContain('chooserResetLabel="Reset"')
    expect(set).toContain('selectAllAriaLabel="Select all"')
    expect(set).toContain('containerClassName="custom-wrap"')
    expect(set).toContain('tableClassName="min-w-[40rem]"')
    expect(set).toContain('storageKey="demo-widths"')
  })

  it('omits staged text props while the eye is off and emits them while on', () => {
    const staged = buildDataTableSnippet({ ...base, chooserLabel: 'Columns', storageKey: 'demo-widths' })
    expect(staged).not.toContain('chooserLabel=')
    expect(staged).not.toContain('storageKey=')
    const applied = buildDataTableSnippet({
      ...base,
      chooserLabel: 'Columns',
      chooserLabelOn: true,
      storageKey: 'demo-widths',
      storageKeyOn: true,
    })
    expect(applied).toContain('chooserLabel="Columns"')
    expect(applied).toContain('storageKey="demo-widths"')
  })

  it('omits the staged size while its eye is off', () => {
    expect(buildDataTableSnippet({ ...base, size: 'lg', sizeOn: false })).not.toMatch(/^\s*size=/m)
  })

  it('seeds searchKeys as script-local state only while set', () => {
    expect(buildDataTableSnippet(base)).not.toContain('searchKeys')
    const set = buildDataTableSnippet({ ...base, searchKeys: ['name', 'status'] })
    expect(set).toContain('let searchKeys = $state(["name","status"]);')
    expect(set).toContain('searchKeys={searchKeys}')
  })

  it('omits searchKeys while its eye is off, keeping the committed list', () => {
    const source = buildDataTableSnippet({ ...base, searchKeys: ['name', 'status'], searchKeysEnabled: false })
    expect(source).not.toContain('searchKeys')
  })

  it('validates search-keys drafts as string arrays', () => {
    expect(parseSearchKeysValue(['name'])).toEqual(['name'])
    expect(parseSearchKeysValue('name')).toBeNull()
    expect(parseSearchKeysValue([42])).toBeNull()
    expect(parseSearchKeysJson('["name", "status"]')).toEqual(['name', 'status'])
    expect(parseSearchKeysJson('not json')).toBeNull()
    expect(parseSearchKeysJson('{"name": 1}')).toBeNull()
  })

  it('validates rows drafts as { id, name, status } arrays', () => {
    const valid = [{ id: 'p1', name: 'Catalog', status: 'Active' }]
    expect(parseRowsValue(valid)).toEqual(valid)
    expect(parseRowsValue([])).toEqual([])
    expect(parseRowsValue('rows')).toBeNull()
    expect(parseRowsValue([{ id: 'p1', name: 'Catalog' }])).toBeNull()
    expect(parseRowsValue([{ id: 'p1', name: 'Catalog', status: 42 }])).toBeNull()
    expect(parseRowsValue([{ id: 'p1', name: 'Catalog', status: 'Active', extra: true }])).toBeNull()
    expect(parseRowsJson(JSON.stringify(valid))).toEqual(valid)
    expect(parseRowsJson('not json')).toBeNull()
    expect(parseRowsJson('{"id": "p1"}')).toBeNull()
  })

  it('keeps scope selection expressions until an override forces a literal', () => {
    const scoped = buildDataTableSnippet({ ...base, selectable: 'yes' })
    expect(scoped).toContain('allSelected={pgSelected.size > 0 && pgSelected.size === rows.length}')
    expect(scoped).toContain('someSelected={pgSelected.size > 0 && pgSelected.size < rows.length}')
    const forced = buildDataTableSnippet({ ...base, selectable: 'yes', allSelected: 'yes', someSelected: 'no' })
    expect(forced).toContain('\n      allSelected\n')
    expect(forced).toContain('someSelected={false}')
    expect(forced).not.toContain('pgSelected.size')
  })

  it('omits staged boolean flags while their eye is off', () => {
    const source = buildDataTableSnippet({
      ...base,
      showSearch: 'no',
      showSearchOn: false,
      dense: 'yes',
      denseOn: false,
      loading: 'yes',
      loadingOn: false,
      selectable: 'yes',
      selectableOn: false,
      allSelected: 'yes',
      allSelectedOn: false,
      someSelected: 'yes',
      someSelectedOn: false,
      resizable: 'yes',
      resizableOn: false,
      fillHeight: 'yes',
      fillHeightOn: false,
      bodyScroll: 'yes',
      bodyScrollOn: false,
      showPagination: 'yes',
      showPaginationOn: false,
    })
    for (const flag of [
      'showSearch',
      'showPagination',
      'selectable',
      'dense',
      'resizable',
      'loading',
      'fillHeight',
      'bodyScroll',
      'allSelected',
      'someSelected',
    ]) {
      expect(source).not.toContain(flag)
    }
    expect(source).not.toContain('selectedIds=')
    expect(source).not.toContain('resizeAriaLabel=')
  })

  it('omits the widths-reset signal while its eye is off', () => {
    const source = buildDataTableSnippet({ ...base, resetWidthsSignal: '2', resetWidthsSignalOn: false })
    expect(source).not.toContain('resetWidthsSignal=')
    expect(buildDataTableSnippet({ ...base, resetWidthsSignal: '2', resetWidthsSignalOn: true })).toContain(
      'resetWidthsSignal={2}',
    )
  })
  it('emits the widths-reset signal only while a positive integer', () => {
    expect(buildDataTableSnippet(base)).not.toContain('resetWidthsSignal=')
    expect(buildDataTableSnippet({ ...base, resetWidthsSignal: '0' })).not.toContain('resetWidthsSignal=')
    expect(buildDataTableSnippet({ ...base, resetWidthsSignal: 'nope' })).not.toContain('resetWidthsSignal=')
    expect(buildDataTableSnippet({ ...base, resetWidthsSignal: '2' })).toContain('resetWidthsSignal={2}')
  })

  it('validates chooser drafts against the canonical columns', () => {
    const canonical = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
    ]
    const valid = [
      { key: 'id', header: 'ID', checked: true },
      { key: 'name', header: 'Name', checked: false },
    ]
    expect(parseChooserColumnsValue(valid, canonical)).toEqual(valid)
    expect(parseChooserColumnsValue([], canonical)).toBeNull()
    expect(parseChooserColumnsValue(valid, [...canonical, { key: 'status', header: 'Status' }])).toBeNull()
    expect(parseChooserColumnsValue([{ key: 'id', header: 'ID' }, valid[1]], canonical)).toBeNull()
    expect(
      parseChooserColumnsValue(
        [
          { key: 'id', header: 'ID', checked: true },
          { key: 'id', header: 'ID', checked: false },
        ],
        canonical,
      ),
    ).toBeNull()
    expect(
      parseChooserColumnsValue(
        [
          { key: 'id', header: 'Renamed', checked: true },
          { key: 'name', header: 'Name', checked: true },
        ],
        canonical,
      ),
    ).toBeNull()
    expect(parseChooserColumnsJson(JSON.stringify(valid), canonical)).toEqual(valid)
    expect(parseChooserColumnsJson('not json', canonical)).toBeNull()
  })
})
