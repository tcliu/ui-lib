import { describe, expect, it } from 'vitest'
import { buildAppShellSnippet } from './demo-snippet'

describe('buildAppShellSnippet', () => {
  it('renders a bare AppShell while unset', () => {
    const source = buildAppShellSnippet({ collapseMode: '', visibility: '' })
    expect(source).toContain('<AppShell>')
    expect(source).not.toContain('collapseMode=')
    expect(source).not.toContain('open=')
  })

  it('emits collapseMode and closed state separately', () => {
    const source = buildAppShellSnippet({ collapseMode: 'rail', visibility: 'closed' })
    expect(source).toContain('<AppShell collapseMode="rail" open={false}>')
  })

  it('keeps the header and pane snippets behind the demo', () => {
    const source = buildAppShellSnippet({ collapseMode: '', visibility: '' })
    expect(source).toContain('{#snippet headerLeft()}')
    expect(source).toContain('{demoTitle}')
    expect(source).toContain('{navLabel}')
    expect(source).toContain('{bodyText}')
  })
})
