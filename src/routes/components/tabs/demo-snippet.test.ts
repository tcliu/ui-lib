import { describe, expect, it } from 'vitest'
import { staged } from '$showcase/staged'
import { STYLED_HEADER, buildTabsSnippet, type TabsSnippetState } from './demo-snippet'

function state(overrides: Partial<TabsSnippetState> = {}): TabsSnippetState {
  return {
    routeMode: '',
    className: staged(''),
    ariaLabel: staged('', true),
    pathname: staged(''),
    size: staged(''),
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
    const source = buildTabsSnippet(state({ className: staged(STYLED_HEADER, true) }))
    expect(source).toContain('className="flex w-full items-center gap-2 rounded-lg border border-cyan-500/40 p-2"')
  })

  it('emits a literal ariaLabel when set', () => {
    const source = buildTabsSnippet(state({ ariaLabel: staged('Custom "tabs"', true) }))
    expect(source).toContain('ariaLabel="Custom &quot;tabs&quot;"')
    expect(source).not.toContain('ariaLabel={componentsLabel}')
  })

  it('emits a literal pathname when set', () => {
    const source = buildTabsSnippet(state({ pathname: staged('details', true) }))
    expect(source).toContain('pathname="details"')
    expect(source).not.toContain('pathname={routePath}')
  })

  it('prefers the literal pathname over the route scope ref in route mode', () => {
    const source = buildTabsSnippet(state({ routeMode: 'yes', pathname: staged('details', true) }))
    expect(source).toContain('pathname="details"')
    expect(source).not.toContain('pathname={routePath}')
  })

  it('stages the eye-gated className and pathname until applied', () => {
    const held = buildTabsSnippet(state({ routeMode: 'yes', className: staged(STYLED_HEADER), pathname: staged('details') }))
    expect(held).toContain('pathname={routePath}')
    expect(held).not.toContain('pathname="details"')
    expect(held).not.toContain('className=')
    const shown = buildTabsSnippet(state({ routeMode: 'yes', className: staged(STYLED_HEADER, true), pathname: staged('details', true) }))
    expect(shown).toContain('pathname="details"')
    expect(shown).not.toContain('pathname={routePath}')
    expect(shown).toContain(`className="${STYLED_HEADER}"`)
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildTabsSnippet(state({ ariaLabel: staged('Components', true) }))
    expect(source).not.toContain('className=')
    expect(source).not.toContain('pathname="')
    expect(source).not.toContain('<Button onClick=')
  })

  it('emits a non-default size and omits the md default', () => {
    expect(buildTabsSnippet(state({ size: staged('lg', true) }))).toContain('  size="lg"')
    expect(buildTabsSnippet(state({ size: staged('18', true) }))).toContain('  size={18}')
    expect(buildTabsSnippet(state({ size: staged('md', true) }))).not.toContain('size=')
    expect(buildTabsSnippet(state({ size: staged('lg') }))).not.toContain('size=')
  })

  it('reads the scope label while the staged ariaLabel eye is off', () => {
    const source = buildTabsSnippet(state({ ariaLabel: staged('Custom tabs') }))
    expect(source).toContain('ariaLabel={componentsLabel}')
    expect(source).not.toContain('ariaLabel="')
  })
})
