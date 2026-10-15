import { describe, expect, it } from 'vitest'
import { CUSTOM_LABELS, DEFAULT_PAGE_SIZE_OPTIONS, STYLED_CLASS, buildPaginationSnippet, parseLabelsJson, parseLabelsValue, parsePageSizeOptionsJson, parsePageSizeOptionsValue } from './demo-snippet'

const base = {
  size: '',
  sizeOn: true,
  labels: {},
  labelsEnabled: true,
  pageSizeOptions: [...DEFAULT_PAGE_SIZE_OPTIONS],
  pageSizeOptionsEnabled: false,
  className: '',
  classNameOn: true,
  trailing: '',
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
    const source = buildPaginationSnippet({ ...base, labels: { previous: 'Back' }, labelsEnabled: false })
    expect(source).not.toContain('labels=')
  })

  it('emits size, the labels object, and the styled wrapper', () => {
    const source = buildPaginationSnippet({
      size: 'lg',
      sizeOn: true,
      labels: { ...CUSTOM_LABELS },
      labelsEnabled: true,
      pageSizeOptions: [...DEFAULT_PAGE_SIZE_OPTIONS],
      pageSizeOptionsEnabled: false,
      className: STYLED_CLASS,
      classNameOn: true,
      trailing: '',
    })
    expect(source).toContain('size="lg"')
    expect(source).toContain(
      'labels={{ previous: "Go back", next: "Go forward", pageSize: "Rows", current: "Page number", nav: "Results" }}',
    )
    expect(source).toContain('className="rounded-lg border border-cyan-500/40 p-2"')
  })

  it('omits the staged size while its eye is off', () => {
    expect(buildPaginationSnippet({ ...base, size: 'lg', sizeOn: false })).not.toContain('size=')
  })

  it('emits only the label fields that are set, in declaration order', () => {
    const source = buildPaginationSnippet({ ...base, labels: { nav: 'Results', previous: 'Back' } })
    expect(source).toContain('labels={{ previous: "Back", nav: "Results" }}')
    expect(source).not.toContain('next:')
  })

  it('escapes quotes in a label value', () => {
    const source = buildPaginationSnippet({ ...base, labels: { previous: 'Go "back"' } })
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
    expect(buildPaginationSnippet({ ...base, size: '14' })).toContain('size={14}')
    expect(buildPaginationSnippet({ ...base, size: 'huge' })).not.toContain('size=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildPaginationSnippet({ ...base, size: 'md' })
    expect(source).not.toContain('size=')
  })

  it('omits the trailing snippet while unset and emits it when set', () => {
    const unset = buildPaginationSnippet(base)
    expect(unset).not.toContain('trailing=')
    expect(unset).toContain('onPageSizeChange={handlePageSizeChange} />')
    const set = buildPaginationSnippet({ ...base, trailing: '1–200' })
    expect(set).toContain('trailing={trailing}')
    expect(set).toContain('{#snippet trailing()}')
    expect(set).toContain('<span>1–200</span>')
    expect(set).toContain('</Pagination>')
  })

  it('omits the staged className while its eye is off and emits it when on', () => {
    expect(buildPaginationSnippet({ ...base, className: STYLED_CLASS, classNameOn: false })).not.toContain('className=')
    expect(buildPaginationSnippet({ ...base, className: STYLED_CLASS, classNameOn: true })).toContain(
      'className="rounded-lg border border-cyan-500/40 p-2"',
    )
  })

  it('escapes trailing text', () => {
    const source = buildPaginationSnippet({ ...base, trailing: 'a & <b>' })
    expect(source).toContain('<span>a &amp; &lt;b&gt;</span>')
  })

  it('omits pageSizeOptions while its eye is off or holding the defaults', () => {
    expect(buildPaginationSnippet(base)).not.toContain('pageSizeOptions=')
    expect(
      buildPaginationSnippet({
        ...base,
        pageSizeOptions: [...DEFAULT_PAGE_SIZE_OPTIONS],
        pageSizeOptionsEnabled: true,
      }),
    ).not.toContain('pageSizeOptions=')
  })

  it('emits pageSizeOptions from scope when enabled with custom choices', () => {
    const source = buildPaginationSnippet({ ...base, pageSizeOptions: [5, 15, 30], pageSizeOptionsEnabled: true })
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
