import { describe, expect, it } from 'vitest'
import { STYLED_HEADER, buildTabsSnippet, type TabsSnippetState } from './demo-snippet'

function state(overrides: Partial<TabsSnippetState> = {}): TabsSnippetState {
  return {
    routeMode: '',
    className: '',
    classNameOn: false,
    ariaLabel: '',
    ariaLabelOn: true,
    pathname: '',
    pathnameOn: false,
    size: '',
    sizeOn: false,
    ...overrides,
  }
}

describe('buildTabsSnippet', () => {
  it('renders plain paths while unset', () => {
    const source = buildTabsSnippet(state())
    expect(source).toContain("path: 'overview'")
    expect(source).not.toContain('pathname=')
    expect(source).not.toContain('className=')
  })

  it('reads the nav label from scope while ariaLabel is unset', () => {
    const source = buildTabsSnippet(state())
    expect(source).toContain('ariaLabel={componentsLabel}')
    expect(source).not.toContain('ariaLabel="')
  })

  it('adds the route toggle and hash paths in route mode', () => {
    const source = buildTabsSnippet(state({ routeMode: 'yes' }))
    expect(source).toContain('pathname={routePath}')
    expect(source).toContain("path: '#overview'")
    expect(source).toContain('<Button onClick=')
  })

  it('appends the styled header classes when set', () => {
    const source = buildTabsSnippet(state({ className: STYLED_HEADER, classNameOn: true }))
    expect(source).toContain('className="flex w-full items-center gap-2 rounded-lg border border-cyan-500/40 p-2"')
  })

  it('emits a literal ariaLabel when set', () => {
    const source = buildTabsSnippet(state({ ariaLabel: 'Custom "tabs"' }))
    expect(source).toContain('ariaLabel="Custom &quot;tabs&quot;"')
    expect(source).not.toContain('ariaLabel={componentsLabel}')
  })

  it('emits a literal pathname when set', () => {
    const source = buildTabsSnippet(state({ pathname: 'details', pathnameOn: true }))
    expect(source).toContain('pathname="details"')
    expect(source).not.toContain('pathname={routePath}')
  })

  it('prefers the literal pathname over the route scope ref in route mode', () => {
    const source = buildTabsSnippet(state({ routeMode: 'yes', pathname: 'details', pathnameOn: true }))
    expect(source).toContain('pathname="details"')
    expect(source).not.toContain('pathname={routePath}')
  })

  it('stages the eye-gated className and pathname until applied', () => {
    const staged = buildTabsSnippet(state({ routeMode: 'yes', className: STYLED_HEADER, pathname: 'details' }))
    expect(staged).toContain('pathname={routePath}')
    expect(staged).not.toContain('pathname="details"')
    expect(staged).not.toContain('className=')
    const applied = buildTabsSnippet(state({ routeMode: 'yes', className: STYLED_HEADER, classNameOn: true, pathname: 'details', pathnameOn: true }))
    expect(applied).toContain('pathname="details"')
    expect(applied).not.toContain('pathname={routePath}')
    expect(applied).toContain(`className="${STYLED_HEADER}"`)
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildTabsSnippet(state({ ariaLabel: 'Components' }))
    expect(source).not.toContain('className=')
    expect(source).not.toContain('pathname="')
    expect(source).not.toContain('<Button onClick=')
  })

  it('emits a non-default size and omits the md default', () => {
    expect(buildTabsSnippet(state({ size: 'lg', sizeOn: true }))).toContain('  size="lg"')
    expect(buildTabsSnippet(state({ size: '18', sizeOn: true }))).toContain('  size={18}')
    expect(buildTabsSnippet(state({ size: 'md', sizeOn: true }))).not.toContain('size=')
    expect(buildTabsSnippet(state({ size: 'lg', sizeOn: false }))).not.toContain('size=')
  })

  it('reads the scope label while the staged ariaLabel eye is off', () => {
    const source = buildTabsSnippet(state({ ariaLabel: 'Custom tabs', ariaLabelOn: false }))
    expect(source).toContain('ariaLabel={componentsLabel}')
    expect(source).not.toContain('ariaLabel="')
  })
})
