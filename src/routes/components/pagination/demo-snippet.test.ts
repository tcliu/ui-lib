import { describe, expect, it } from 'vitest'
import { STYLED_CLASS, buildPaginationSnippet } from './demo-snippet'

describe('buildPaginationSnippet', () => {
  it('omits size, options, labels, and className while unset', () => {
    const source = buildPaginationSnippet({ size: '', customOptions: '', customLabels: '', className: '' })
    expect(source).toContain('total={200}')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('pageSizeOptions=')
    expect(source).not.toContain('previousLabel=')
    expect(source).not.toContain('className=')
  })

  it('emits size, custom options, labels, and the styled wrapper', () => {
    const source = buildPaginationSnippet({ size: 'lg', customOptions: 'yes', customLabels: 'yes', className: STYLED_CLASS })
    expect(source).toContain('size="lg"')
    expect(source).toContain('pageSizeOptions={[5, 10, 25, 100]}')
    expect(source).toContain('previousLabel="Go back"')
    expect(source).toContain('className="rounded-lg border border-cyan-500/40 p-2"')
  })
})
