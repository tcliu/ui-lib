import { describe, expect, it } from 'vitest'
import { STAGE_PANE, STAGE_ROW } from '$lib/showcase/resizable-stage'
import { buildDataTableSnippet, type DataTableSnippetState } from './demo-snippet'

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
    for (const flag of ['showSearch', 'showPagination', 'selectable', 'dense', 'resizable', 'loading']) {
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

  it('wraps the table in the resizable stage the page renders', () => {
    const source = buildDataTableSnippet(base)
    expect(source).toContain('let stageWidth = $state(100)')
    expect(source).toContain(`<div class="${STAGE_ROW}">`)
    expect(source).toContain(`<div class="${STAGE_PANE} w-full" style={\`flex-basis:\${stageWidth}%\`}>`)
    expect(source).toContain('value={stageWidth}')
    expect(source).toContain('onChange={next => (stageWidth = next)}')
    expect(source).toContain('ariaLabel={resizeLabel}')
    expect(source.indexOf('</script>')).toBeLessThan(source.indexOf('stageWidth}%'))
  })

  it('escapes placeholder quotes for the attribute', () => {
    const source = buildDataTableSnippet({ ...base, placeholder: 'Find "rows"' })
    expect(source).toContain('searchPlaceholder="Find &quot;rows&quot;"')
  })
})
