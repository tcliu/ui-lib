import { describe, expect, it } from 'vitest'
import { APP_SHELL_DESKTOP_BREAKPOINT } from '$lib/app-shell'
import { buildAppShellSnippet } from './demo-snippet'

const unset = { collapseMode: '', visibility: '', mode: '', rightPane: '' }

describe('buildAppShellSnippet', () => {
  it('keeps the demo stage at or above the dock breakpoint', () => {
    const source = buildAppShellSnippet(unset)
    // The demo stage must stay wide enough that the shell's own container
    // never falls under the breakpoint, which would float the pane over the
    // text instead of docking it beside the content.
    const match = source.match(/min-w-\[(\d+(?:\.\d+)?)rem\]/)
    expect(match).not.toBeNull()
    expect(Number(match![1]) * 16).toBeGreaterThanOrEqual(APP_SHELL_DESKTOP_BREAKPOINT)
    // The scroll wrapper is a non-interactive overflow container.
    expect(source).toContain('overflow-x-auto" tabindex="-1"')
  })

  it('renders a bare AppShell while unset', () => {
    const source = buildAppShellSnippet(unset)
    expect(source).toContain('<AppShell>')
    expect(source).not.toContain('collapseMode=')
    expect(source).not.toContain('open=')
    expect(source).not.toContain('mode=')
    expect(source).not.toContain('rightPane')
  })

  it('emits collapseMode and closed state separately', () => {
    const source = buildAppShellSnippet({ ...unset, collapseMode: 'rail', visibility: 'closed' })
    expect(source).toContain('<AppShell collapseMode="rail" open={false}>')
  })

  it('emits the drawer mode override', () => {
    const source = buildAppShellSnippet({ ...unset, mode: 'floating' })
    expect(source).toContain('<AppShell mode="floating">')
  })

  it('emits the right pane snippet with its open state', () => {
    const source = buildAppShellSnippet({ ...unset, rightPane: 'open' })
    expect(source).toContain('<AppShell rightOpen={true}>')
    expect(source).toContain('{#snippet rightPane()}')
    expect(source).toContain('{bodyText}')
  })

  it('keeps the header and pane snippets behind the demo', () => {
    const source = buildAppShellSnippet(unset)
    expect(source).toContain('{#snippet headerLeft()}')
    expect(source).toContain('{demoTitle}')
    expect(source).toContain('{navLabel}')
    expect(source).toContain('{bodyText}')
  })
})
