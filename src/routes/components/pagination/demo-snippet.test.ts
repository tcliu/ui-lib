import { describe, expect, it } from 'vitest'
import { staged } from '$showcase/staged'
import { CUSTOM_LABELS, DEFAULT_PAGE_SIZE_OPTIONS, STYLED_CLASS, buildPaginationSnippet, parseLabelsJson, parseLabelsValue, parsePageSizeOptionsJson, parsePageSizeOptionsValue } from './demo-snippet'

const base = {
  size: staged('', true),
  labels: staged({}, true),
  pageSizeOptions: staged([...DEFAULT_PAGE_SIZE_OPTIONS]),
  className: staged('', true),
  trailing: staged(''),
}

describe('buildPaginationSnippet', () => {
  it('omits size, labels, and className while unset', () => {
    const source = buildPaginationSnippet(base)
    expect(source).toContain('total={total}')
    expect(source).toContain('pageSize={pageSize}')
    expect(source).toContain('currentPage={currentPage}')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('labels=')
    expect(source).not.toContain('className=')
    expect(source).toContain('onPageSizeChange={handlePageSizeChange} />')
  })

  it('omits the labels map while its eye toggle is off', () => {
    const source = buildPaginationSnippet({ ...base, labels: staged({ previous: 'Back' }) })
    expect(source).not.toContain('labels=')
  })

  it('emits size, the labels object, and the styled wrapper', () => {
    const source = buildPaginationSnippet({
      ...base,
      size: staged('lg', true),
      labels: staged({ ...CUSTOM_LABELS }, true),
      pageSizeOptions: staged([...DEFAULT_PAGE_SIZE_OPTIONS]),
      className: staged(STYLED_CLASS, true),
    })
    expect(source).toContain('size="lg"')
    expect(source).toContain(
      'labels={{ previous: "Go back", next: "Go forward", pageSize: "Rows", current: "Page number", nav: "Results" }}',
    )
    expect(source).toContain('className="rounded-lg border border-cyan-500/40 p-2"')
  })

  it('omits the staged size while its eye is off', () => {
    expect(buildPaginationSnippet({ ...base, size: staged('lg') })).not.toContain('size=')
  })

  it('emits only the label fields that are set, in declaration order', () => {
    const source = buildPaginationSnippet({ ...base, labels: staged({ nav: 'Results', previous: 'Back' }, true) })
    expect(source).toContain('labels={{ previous: "Back", nav: "Results" }}')
    expect(source).not.toContain('next:')
  })

  it('escapes quotes in a label value', () => {
    const source = buildPaginationSnippet({ ...base, labels: staged({ previous: 'Go "back"' }, true) })
    expect(source).toContain('labels={{ previous: "Go &quot;back&quot;" }}')
  })

  it('validates labels drafts as known-field string objects', () => {
    expect(parseLabelsValue({ previous: 'Back', nav: 'Results' })).toEqual({ previous: 'Back', nav: 'Results' })
    expect(parseLabelsValue({})).toEqual({})
    expect(parseLabelsValue('labels')).toBeNull()
    expect(parseLabelsValue([{ previous: 'Back' }])).toBeNull()
    expect(parseLabelsValue({ previous: 'Back', unknown: 'x' })).toBeNull()
    expect(parseLabelsValue({ previous: 42 })).toBeNull()
    expect(parseLabelsJson('{"previous": "Back"}')).toEqual({ previous: 'Back' })
    expect(parseLabelsJson('not json')).toBeNull()
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildPaginationSnippet({ ...base, size: staged('14', true) })).toContain('size={14}')
    expect(buildPaginationSnippet({ ...base, size: staged('huge', true) })).not.toContain('size=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildPaginationSnippet({ ...base, size: staged('md', true) })
    expect(source).not.toContain('size=')
  })

  it('omits the trailing snippet while unset and emits it when set', () => {
    const unset = buildPaginationSnippet(base)
    expect(unset).not.toContain('trailing=')
    expect(unset).toContain('onPageSizeChange={handlePageSizeChange} />')
    const set = buildPaginationSnippet({ ...base, trailing: staged('1–200', true) })
    expect(set).toContain('trailing={trailing}')
    expect(set).toContain('{#snippet trailing()}')
    expect(set).toContain('<span>1–200</span>')
    expect(set).toContain('</Pagination>')
  })

  it('omits the staged className while its eye is off and emits it when on', () => {
    expect(buildPaginationSnippet({ ...base, className: staged(STYLED_CLASS) })).not.toContain('className=')
    expect(buildPaginationSnippet({ ...base, className: staged(STYLED_CLASS, true) })).toContain(
      'className="rounded-lg border border-cyan-500/40 p-2"',
    )
  })

  it('escapes trailing text', () => {
    const source = buildPaginationSnippet({ ...base, trailing: staged('a & <b>', true) })
    expect(source).toContain('<span>a &amp; &lt;b&gt;</span>')
  })

  it('omits pageSizeOptions while its eye is off or holding the defaults', () => {
    expect(buildPaginationSnippet(base)).not.toContain('pageSizeOptions=')
    expect(
      buildPaginationSnippet({
        ...base,
        pageSizeOptions: staged([...DEFAULT_PAGE_SIZE_OPTIONS], true),
      }),
    ).not.toContain('pageSizeOptions=')
  })

  it('emits pageSizeOptions from scope when enabled with custom choices', () => {
    const source = buildPaginationSnippet({ ...base, pageSizeOptions: staged([5, 15, 30], true) })
    expect(source).toContain('pageSizeOptions={pageSizeOptions}')
  })

  it('validates page-size options drafts as non-empty positive-integer arrays', () => {
    expect(parsePageSizeOptionsValue([5, 15, 30])).toEqual([5, 15, 30])
    expect(parsePageSizeOptionsValue([...DEFAULT_PAGE_SIZE_OPTIONS])).toEqual([10, 20, 50])
    expect(parsePageSizeOptionsValue([])).toBeNull()
    expect(parsePageSizeOptionsValue(['10'])).toBeNull()
    expect(parsePageSizeOptionsValue([10, 0])).toBeNull()
    expect(parsePageSizeOptionsValue([10, 2.5])).toBeNull()
    expect(parsePageSizeOptionsValue('options')).toBeNull()
    expect(parsePageSizeOptionsJson('[5, 15, 30]')).toEqual([5, 15, 30])
    expect(parsePageSizeOptionsJson('not json')).toBeNull()
    expect(parsePageSizeOptionsJson('{"pageSize": 10}')).toBeNull()
  })
})
