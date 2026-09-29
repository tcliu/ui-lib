import { describe, expect, it } from 'vitest'
import { STAGE_PANE, STAGE_ROW } from '$lib/showcase/resizable-stage'
import {
  buildDataTableSnippet,
  PAGE_SIZE_OPTIONS,
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
  showPagination: '',
  selectable: '',
  dense: '',
  resizable: '',
  loading: '',
  fillHeight: '',
  bodyScroll: '',
  placeholder: '',
  emptyMessage: '',
}

describe('buildDataTableSnippet', () => {
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
  })

  it('emits the loading flag when set', () => {
    const source = buildDataTableSnippet({ ...base, loading: 'yes' })
    expect(source).toContain('\n      loading\n')
  })

  it('adds selection wiring only while selectable', () => {
    const source = buildDataTableSnippet({ ...base, selectable: 'yes' })
    expect(source).toContain('\n      selectable\n')
    expect(source).toContain('selectedIds={pgSelected}')
    const explicit = buildDataTableSnippet({ ...base, selectable: 'no' })
    expect(explicit).toContain('selectable={false}')
    expect(explicit).not.toContain('selectedIds=')
  })

  it('wraps the table in the handle-less static stage the page renders', () => {
    const source = buildDataTableSnippet(base)
    expect(source).toContain(`<div class="${STAGE_ROW}">`)
    expect(source).toContain(`<div class="${STAGE_PANE} ${TABLE_STAGE_PANE}">`)
    expect(source).not.toContain('stageWidth')
    expect(source).not.toContain('role="separator"')
  })

  it('always offers the demo page-size options including 5', () => {
    const source = buildDataTableSnippet(base)
    expect(source).toContain(`pageSizeOptions={[${PAGE_SIZE_OPTIONS.join(', ')}]}`)
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
    const source = buildDataTableSnippet({ ...base, placeholder: 'Find "rows"' })
    expect(source).toContain('searchPlaceholder="Find &quot;rows&quot;"')
  })
})
