import { describe, expect, it } from 'vitest'
import { STYLED_HEADER, STYLED_TAB, buildTabsSnippet } from './demo-snippet'

describe('buildTabsSnippet', () => {
  it('renders plain paths while unset', () => {
    const source = buildTabsSnippet({ routeMode: '', headerClass: '', tabClass: '' })
    expect(source).toContain("path: 'overview'")
    expect(source).not.toContain('pathname=')
    expect(source).not.toContain('headerClass=')
    expect(source).not.toContain('  class=')
  })

  it('adds the route toggle and hash paths in route mode', () => {
    const source = buildTabsSnippet({ routeMode: 'yes', headerClass: '', tabClass: '' })
    expect(source).toContain('pathname={routePath}')
    expect(source).toContain("path: '#overview'")
    expect(source).toContain('<Button onClick=')
  })

  it('adds the styled header classes', () => {
    const source = buildTabsSnippet({ routeMode: '', headerClass: STYLED_HEADER, tabClass: STYLED_TAB })
    expect(source).toContain('headerClass="flex w-full items-center gap-2 rounded-lg border border-cyan-500/40 p-2"')
    expect(source).toContain('class="text-cyan-300"')
  })
})
