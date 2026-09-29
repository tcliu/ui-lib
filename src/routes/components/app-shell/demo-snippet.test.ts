import { describe, expect, it } from 'vitest'
import { SHELL_STAGE_DEFAULT_WIDTH, SHELL_STAGE_HOST, SHELL_STAGE_PANE, buildAppShellSnippet } from './demo-snippet'

const unset = { collapseMode: '', visibility: '', mode: '', rightPane: '', footer: '' }

describe('buildAppShellSnippet', () => {
  it('wraps the shell in the resizable stage so it can be narrowed in place', () => {
    const source = buildAppShellSnippet(unset)
    expect(source).toContain(`<div class="${SHELL_STAGE_HOST}">`)
    expect(source).toContain('<Resizable')
    expect(source).toContain('width={stageWidth}')
    expect(source).toContain('height={stageHeight}')
    expect(source).toContain('maxWidth="parent"')
    expect(source).toContain(`let stageWidth = $state(${SHELL_STAGE_DEFAULT_WIDTH})`)
    // The shell fills the stage and its own layout has no fixed min-width, so
    // it floats its pane over the text when the stage is narrowed.
    expect(source).toContain(`<div class="${SHELL_STAGE_PANE}">`)
    expect(source).not.toMatch(/min-w-\[/)
    expect(source).toContain('w-full min-w-0 flex-col overflow-hidden')
  })

  it('renders a bare AppShell while unset', () => {
    const source = buildAppShellSnippet(unset)
    expect(source).toContain(
      '<AppShell className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-800">',
    )
    expect(source).not.toContain('collapseMode=')
    expect(source).not.toContain('open=')
    expect(source).not.toContain('mode=')
    expect(source).not.toContain('rightPane')
    expect(source).not.toContain('{#snippet footer()}')
  })

  it('emits collapseMode and closed state separately', () => {
    const source = buildAppShellSnippet({ ...unset, collapseMode: 'rail', visibility: 'closed' })
    expect(source).toContain('collapseMode="rail" open={false}')
  })

  it('emits the drawer mode override', () => {
    const source = buildAppShellSnippet({ ...unset, mode: 'floating' })
    expect(source).toContain('mode="floating"')
  })

  it('emits the right pane snippet with its open state', () => {
    const source = buildAppShellSnippet({ ...unset, rightPane: 'open' })
    expect(source).toContain('rightOpen={true}')
    expect(source).toContain('{#snippet rightPane()}')
    expect(source).toContain('{bodyText}')
  })

  it('emits the footer snippet when shown', () => {
    const source = buildAppShellSnippet({ ...unset, footer: 'show' })
    expect(source).toContain('{#snippet footer()}')
    expect(source).toContain('{navLabel}')
    expect(source).toContain('{demoTitle}')
    // The footer reproduces the static demo's row wrapper.
    expect(source).toContain('<div class="flex min-w-0 flex-1 items-center justify-between gap-4">')
  })

  it('keeps the header and pane snippets behind the demo', () => {
    const source = buildAppShellSnippet(unset)
    expect(source).toContain('{#snippet header(api)}')
    expect(source).toContain('{demoTitle}')
    expect(source).toContain('{navLabel}')
    expect(source).toContain('{bodyText}')
  })

  it('reproduces the static header markup through scope labels only', () => {
    const source = buildAppShellSnippet(unset)
    // The playground scope exposes `showLabel`/`hideLabel`, not the page's i18n
    // helper: a bare `i18n` reference would throw when the snippet renders.
    expect(source).not.toContain('i18n')
    expect(source).toContain('{@const toggleLabel = api.open ? hideLabel : showLabel}')
    // Same props and class strings as the static demo's toggle and title.
    expect(source).toContain('className="-ml-1"')
    expect(source).toContain('tooltip={toggleLabel}')
    expect(source).toContain('tooltipAlign="left"')
    expect(source).toContain('preventFocusSteal')
    // Same icon size prop as the static demo (the icon default is larger).
    expect(source).toContain('<MenuIcon size="sm" />')
    expect(source).toContain('class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200"')
  })
})
