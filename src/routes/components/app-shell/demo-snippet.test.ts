import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$showcase/snippet-playground'
import {
  SHELL_CHILDREN_CLASS,
  SHELL_PANE_ITEM,
  SHELL_PANE_LABEL,
  SHELL_STAGE_DEFAULT_WIDTH,
  SHELL_STAGE_FRAME,
  appShellChildrenMarkup,
  appShellFooterMarkup,
  appShellLeftPaneMarkup,
  appShellRightPaneMarkup,
  buildAppShellSnippet,
  classNamesJsonText,
  normalizeAppShellFooter,
  paneJsonText,
  parseAppShellChildren,
  parseAppShellFooter,
  parseAppShellLeftPane,
  parseAppShellRightPane,
  parseClassNamesExpression,
  parseClassNamesJson,
  parseClassNamesValue,
  parsePaneExpression,
  parsePaneJson,
  parsePaneValue,
  type AppShellSnippetState,
} from './demo-snippet'

const unset: AppShellSnippetState = {
  mode: '',
  modeOn: true,
  className: '',
  classNameOn: false,
  closeLabel: '',
  closeLabelOn: false,
  classNames: {},
  classNamesEnabled: true,
  left: {},
  right: {},
  leftEnabled: true,
  rightEnabled: true,
  children: '',
  childrenEnabled: true,
  headerEnabled: true,
  leftPane: '',
  leftPaneEnabled: true,
  rightPane: '',
  rightPaneEnabled: true,
  footer: '',
  footerEnabled: false,
}

describe('buildAppShellSnippet', () => {
  it('wraps the shell in the resizable frame so it can be narrowed in place', () => {
    const source = buildAppShellSnippet(unset)
    expect(source).toContain(`<Resizable\n  className="${SHELL_STAGE_FRAME}"`)
    expect(source).toContain('width={stageWidth}')
    expect(source).toContain('height={stageHeight}')
    expect(source).toContain('maxWidth="parent"')
    expect(source).toContain(`let stageWidth = $state(${SHELL_STAGE_DEFAULT_WIDTH})`)
    // The frame is the only wrapper: the shell is its direct child, so the
    // shell's own default classes render (no demo-only className override).
    expect(source).toContain('>\n  <AppShell')
    expect(source).not.toMatch(/min-w-\[/)
  })

  it('renders a bare AppShell while unset', () => {
    const source = buildAppShellSnippet(unset)
    // Unset, the shell carries no config overrides: the demo stage supplies the
    // box and the component's own default classes render.
    const tag = source.slice(source.indexOf('<AppShell'), source.indexOf('>', source.indexOf('<AppShell')))
    expect(tag).not.toContain('className')
    expect(tag).not.toContain('left=')
    expect(tag).not.toContain('right=')
    expect(tag).not.toContain('classNames')
    expect(source).not.toContain('mode=')
    expect(source).not.toContain('rightPane')
    expect(source).not.toContain('{#snippet footer()}')
  })

  it('emits the left pane config object with its open and collapse state', () => {
    const source = buildAppShellSnippet({
      ...unset,
      left: { open: false, collapseMode: 'rail' },
    })
    expect(source).toContain('left={{')
    expect(source).toContain('open: false')
    expect(source).toContain('collapseMode: "rail"')
  })

  it('emits the drawer mode override', () => {
    const source = buildAppShellSnippet({ ...unset, mode: 'floating', modeOn: true })
    expect(source).toContain('mode="floating"')
  })

  it('omits the staged mode while its eye is off', () => {
    const source = buildAppShellSnippet({ ...unset, mode: 'floating', modeOn: false })
    const tag = source.slice(source.indexOf('<AppShell'), source.indexOf('>', source.indexOf('<AppShell')))
    expect(tag).not.toContain('mode=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildAppShellSnippet({
      ...unset,
      mode: 'auto',
      modeOn: true,
      className: 'flex h-full min-h-0 flex-col bg-slate-950 text-slate-100',
      classNameOn: false,
    })
    const tag = source.slice(source.indexOf('<AppShell'), source.indexOf('>', source.indexOf('<AppShell')))
    expect(tag).not.toContain('mode=')
    expect(tag).not.toContain('className=')
  })

  it('emits numeric pane widths as entries in each config object', () => {
    const source = buildAppShellSnippet({
      ...unset,
      left: { size: 300, min: 160 },
      right: { size: 320 },
    })
    expect(source).toContain('size: 300')
    expect(source).toContain('min: 160')
    expect(source).toContain('size: 320')
  })

  it('omits an empty pane config instead of emitting an empty object', () => {
    const source = buildAppShellSnippet({ ...unset, left: {}, right: { size: 320 } })
    expect(source).not.toContain('left={{')
    expect(source).toContain('right={{')
  })

  it('omits a pane config while its eye toggle is off', () => {
    const source = buildAppShellSnippet({
      ...unset,
      classNames: { main: 'custom-main' },
      classNamesEnabled: false,
      left: { open: false, size: 300 },
      leftEnabled: false,
      right: { open: true },
      rightEnabled: false,
    })
    expect(source).not.toContain('classNames={{')
    expect(source).not.toContain('left={{')
    expect(source).not.toContain('right={{')
    expect(source).not.toContain('{#snippet rightPane()}')
  })

  it('omits the left pane content while its eye toggle is off', () => {
    const source = buildAppShellSnippet({ ...unset, leftPane: 'Nav', leftPaneEnabled: false })
    expect(source).not.toContain('{#snippet leftPane()}')
    expect(source).toContain('<AppShell')
  })

  it('omits the header block while its eye toggle is off', () => {
    const source = buildAppShellSnippet({ ...unset, headerEnabled: false })
    expect(source).not.toContain('{#snippet header(api)}')
    expect(source).toContain('<AppShell')
  })

  it('omits the right pane snippet while its eye toggle is off', () => {
    const source = buildAppShellSnippet({ ...unset, right: { open: true }, rightPaneEnabled: false })
    expect(source).toContain('right={{')
    expect(source).not.toContain('{#snippet rightPane()}')
  })

  it('emits label and class overrides as literals', () => {
    const source = buildAppShellSnippet({
      ...unset,
      className: 'custom-shell',
      classNameOn: true,
      classNames: { main: 'custom-main' },
      left: { storageKey: 'shell', resizeLabel: 'Resize' },
    })
    expect(source).toContain('className="custom-shell"')
    expect(source).toContain('classNames={{')
    expect(source).toContain('main: "custom-main"')
    expect(source).toContain('storageKey: "shell"')
    expect(source).toContain('resizeLabel: "Resize"')
  })

  it('omits staged text props while the eye is off and emits them while on', () => {
    const staged = buildAppShellSnippet({ ...unset, className: 'custom-shell', closeLabel: 'Close' })
    expect(staged).not.toContain('\n    className=')
    expect(staged).not.toContain('\n    closeLabel=')
    const applied = buildAppShellSnippet({
      ...unset,
      className: 'custom-shell',
      classNameOn: true,
      closeLabel: 'Close',
      closeLabelOn: true,
    })
    expect(applied).toContain('\n    className="custom-shell"')
    expect(applied).toContain('\n    closeLabel="Close"')
  })

  it('emits the right pane config object with its open state', () => {
    const source = buildAppShellSnippet({ ...unset, right: { open: true } })
    expect(source).toContain('right={{')
    expect(source).toContain('open: true')
    expect(source).toContain('{#snippet rightPane()}')
    expect(source).toContain('{bodyText}')
  })

  it('emits the footer snippet only while it is applied', () => {
    const applied = buildAppShellSnippet({
      ...unset,
      footerEnabled: true,
      footer: appShellFooterMarkup('Nav', 'Title'),
    })
    expect(applied).toContain('{#snippet footer()}')
    // The footer reproduces the static demo's row wrapper and both labels.
    expect(applied).toContain('<div class="flex min-w-0 flex-1 items-center justify-between gap-4">')
    expect(applied).toContain('<span class="text-xs text-slate-400">Nav</span>')
    expect(applied).toContain('<span class="text-xs text-slate-400">Title</span>')
    // The same markup with the eye toggle off renders no footer.
    expect(buildAppShellSnippet({ ...unset, footer: appShellFooterMarkup('Nav', 'Title') })).not.toContain(
      '{#snippet footer()}',
    )
  })

  it('omits the children block while the eye toggle is off', () => {
    const source = buildAppShellSnippet({ ...unset, childrenEnabled: false })
    expect(source).not.toContain(`<p class="${SHELL_CHILDREN_CLASS}">`)
  })

  it('keeps the header and pane snippets behind the demo', () => {
    const source = buildAppShellSnippet(unset)
    expect(source).toContain('{#snippet header(api)}')
    expect(source).toContain('{demoTitle}')
    expect(source).toContain('{navLabel}')
    expect(source).toContain('{bodyText}')
  })

  it('emits a rail-aware left-pane item whose label hides in the strip', () => {
    const source = buildAppShellSnippet(unset)
    expect(source).toContain(`<span class="${SHELL_PANE_ITEM}">`)
    expect(source).toContain(`<span class="${SHELL_PANE_LABEL}">{navLabel}</span>`)
    // The container-query variant tracks the pane's own width, not the viewport.
    expect(source).toContain('@max-[8rem]:hidden')
    expect(source).toContain('<MenuIcon className="shrink-0" />')
  })

  it('emits children markup verbatim when set and the canonical <p> otherwise', () => {
    const bare = buildAppShellSnippet(unset)
    expect(bare).toContain(`<p class="${SHELL_CHILDREN_CLASS}">{bodyText}</p>`)
    expect(bare).toContain('>{navLabel}</span>')

    const custom = buildAppShellSnippet({
      ...unset,
      children: '<div class="grid gap-2"><p>Body copy</p></div>',
      leftPane: 'Nav',
    })
    expect(custom).toContain('<div class="grid gap-2"><p>Body copy</p></div>')
    expect(custom).toContain('>{"Nav"}</span>')
    expect(custom).not.toContain('{bodyText}</p>')
  })

  it('emits committed children markup verbatim, entities and all', () => {
    const source = buildAppShellSnippet({
      ...unset,
      children: '<p title="a &amp; b">Fish &amp; Chips</p>',
    })
    expect(source).toContain('<p title="a &amp; b">Fish &amp; Chips</p>')
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
    // No `size` on the toggle icon: the Button icon box owns the geometry, so
    // the icon rides its default.
    expect(source).toContain('<MenuIcon />')
    expect(source).toContain('class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200"')
  })
})

describe('app-shell pane JSON', () => {
  it('round-trips a full pane config through the dialog text', () => {
    const pane = {
      open: false,
      size: 300,
      collapseMode: 'rail' as const,
      railWidth: 64,
      min: 160,
      max: 480,
      defaultSize: 288,
      storageKey: 'shell',
      resizeLabel: 'Resize',
      paneLabel: 'Left pane',
    }
    expect(parsePaneJson(paneJsonText(pane))).toEqual(pane)
    // Canonical key order, not commit order.
    expect(Object.keys(JSON.parse(paneJsonText({ paneLabel: 'x', open: true })))).toEqual([
      'open',
      'size',
      'collapseMode',
      'railWidth',
      'min',
      'max',
      'defaultSize',
      'storageKey',
      'resizeLabel',
      'paneLabel',
    ])
    // The empty seed prefills every key with null (still the component
    // default), and null entries parse back to unset.
    expect(JSON.parse(paneJsonText({}))).toEqual({
      open: null,
      size: null,
      collapseMode: null,
      railWidth: null,
      min: null,
      max: null,
      defaultSize: null,
      storageKey: null,
      resizeLabel: null,
      paneLabel: null,
    })
    expect(parsePaneJson(paneJsonText({}))).toEqual({})
    expect(parsePaneJson('{"open": null, "size": 300}')).toEqual({ size: 300 })
    expect(parsePaneJson('{}')).toEqual({})
  })

  it('rejects malformed and misshaped pane JSON', () => {
    expect(parsePaneJson('not json')).toBeNull()
    expect(parsePaneJson('[1, 2]')).toBeNull()
    expect(parsePaneJson('null')).toBeNull()
    expect(parsePaneJson('{"open": "yes"}')).toBeNull()
    expect(parsePaneJson('{"size": "300"}')).toBeNull()
    expect(parsePaneJson('{"size": NaN}')).toBeNull()
    expect(parsePaneJson('{"collapseMode": "fold"}')).toBeNull()
    expect(parsePaneJson('{"paneLabel": 7}')).toBeNull()
    // Unknown keys never apply: callbacks ride the demo object internally.
    expect(parsePaneJson('{"open": true, "onOpenChange": true}')).toBeNull()
    expect(parsePaneValue({ open: true, onSizeChange: () => {} })).toBeNull()
    expect(parsePaneValue(null)).toBeNull()
    expect(parsePaneValue('left')).toBeNull()
  })

  it('reads a compiled seed object literal back for the Value column', () => {
    expect(parsePaneExpression('{ open: false, size: 300, collapseMode: "rail" }')).toEqual({
      open: false,
      size: 300,
      collapseMode: 'rail',
    })
    expect(parsePaneExpression('{}')).toEqual({})
    // A hand-added function entry leaves the playground alone.
    expect(parsePaneExpression('{ open: true, onOpenChange: () => {} }')).toBeNull()
    expect(parsePaneExpression('not an object')).toBeNull()
  })
})

describe('app-shell class-names JSON', () => {
  it('round-trips a class-name map through the dialog text', () => {
    const map = { header: 'custom-header', main: 'custom-main' }
    expect(parseClassNamesJson(classNamesJsonText(map))).toEqual(map)
    // Canonical key order, not commit order.
    expect(Object.keys(JSON.parse(classNamesJsonText({ main: 'x', header: 'y' })))).toEqual([
      'header',
      'footer',
      'pane',
      'rightPane',
      'main',
      'splitter',
    ])
    // The empty seed prefills every key with null (still the built-in
    // classes), and null/empty entries parse back to unset.
    expect(JSON.parse(classNamesJsonText({}))).toEqual({
      header: null,
      footer: null,
      pane: null,
      rightPane: null,
      main: null,
      splitter: null,
    })
    expect(parseClassNamesJson(classNamesJsonText({}))).toEqual({})
    expect(parseClassNamesJson('{"main": null, "pane": "x", "header": ""}')).toEqual({ pane: 'x' })
    expect(parseClassNamesJson('{}')).toEqual({})
  })

  it('rejects malformed and misshaped class-names JSON', () => {
    expect(parseClassNamesJson('not json')).toBeNull()
    expect(parseClassNamesJson('["x"]')).toBeNull()
    expect(parseClassNamesJson('null')).toBeNull()
    expect(parseClassNamesJson('{"main": 7}')).toBeNull()
    expect(parseClassNamesJson('{"main": true}')).toBeNull()
    expect(parseClassNamesJson('{"header": "x", "bogus": "y"}')).toBeNull()
    expect(parseClassNamesValue(null)).toBeNull()
    expect(parseClassNamesValue('main')).toBeNull()
  })

  it('reads a compiled seed object literal back for the Value column', () => {
    expect(parseClassNamesExpression('{ main: "custom-main" }')).toEqual({ main: 'custom-main' })
    expect(parseClassNamesExpression('{}')).toEqual({})
    expect(parseClassNamesExpression('{ main: "x", bogus: 1 }')).toBeNull()
    expect(parseClassNamesExpression('not an object')).toBeNull()
  })
})

describe('app-shell snippet markup', () => {
  it('accepts free-form HTML children with any number of elements', () => {
    const markup = appShellChildrenMarkup('Hello')
    expect(markup).toBe('<p class="p-4 text-sm text-slate-300">Hello</p>')
    expect(parseAppShellChildren(markup)).toBe(markup)
    // Multiple, nested, and attributed elements are all reproduced verbatim.
    const nested = '<div class="grid gap-2"><p class="a">One</p><p class="b">Two</p></div>'
    expect(parseAppShellChildren(nested)).toBe(nested)
    // Void and self-closing tags need no matching close tag.
    const voids = '<p>a<br>b</p><img src="x" />'
    expect(parseAppShellChildren(voids)).toBe(voids)
    // Anything the static demo cannot reproduce exactly is rejected.
    expect(parseAppShellChildren('')).toBeNull()
    expect(parseAppShellChildren('<p>{text}</p>')).toBeNull()
    expect(parseAppShellChildren('<div><p>unclosed</p>')).toBeNull()
    expect(parseAppShellChildren('</p>')).toBeNull()
    expect(parseAppShellChildren('a < b')).toBeNull()
    expect(parseAppShellChildren('<script>alert(1)</script>')).toBeNull()
    expect(parseAppShellChildren('<slot></slot>')).toBeNull()
    expect(parseAppShellChildren('<p>a</p><!-- c -->')).toBeNull()
    expect(parseAppShellChildren('<Button variant="primary">Go</Button>')).toBeNull()
    expect(parseAppShellChildren('<p onclick="go()">Go</p>')).toBeNull()
    // A Svelte directive compiles in the seed but stays literal under `{@html}`.
    expect(parseAppShellChildren('<p class:x>Go</p>')).toBeNull()
    expect(parseAppShellChildren('<p transition:fade>Go</p>')).toBeNull()
    // HTML ignores `/>` on a non-void element, so the DOM would diverge.
    expect(parseAppShellChildren('<div><p/>text</div>')).toBeNull()
    // A quoted value is never read as an attribute name.
    const quoted = '<p title="foo onclick=1">Hi</p>'
    expect(parseAppShellChildren(quoted)).toBe(quoted)
  })

  it('round-trips the footer row markup through normalize', () => {
    const markup = appShellFooterMarkup('Nav', 'Title')
    expect(parseAppShellFooter(markup)).toEqual({ nav: 'Nav', title: 'Title' })
    expect(normalizeAppShellFooter(markup.replace(/\n/g, '\n  '))).toBe(markup)
    expect(parseAppShellFooter('<div class="custom"></div>')).toBeNull()
    // Trailing or leading content is unreproducible, so the anchor rejects it.
    expect(parseAppShellFooter(`${markup}\n<div>EXTRA</div>`)).toBeNull()
    expect(parseAppShellFooter(`PREFIX ${markup}`)).toBeNull()
  })

  it('round-trips the pane markups', () => {
    expect(parseAppShellLeftPane(appShellLeftPaneMarkup('Nav'))).toBe('Nav')
    expect(parseAppShellLeftPane('nope')).toBeNull()
    expect(parseAppShellLeftPane('<span class="x">Nav</span>')).toBeNull()
    expect(parseAppShellRightPane(appShellRightPaneMarkup('Aside'))).toBe('Aside')
    expect(parseAppShellRightPane('nope')).toBeNull()
    expect(parseAppShellRightPane('<div>Aside</div>')).toBeNull()
  })
})

describe('app-shell children snippet compilation', () => {
  const scope = {
    demoTitle: 'UI Library',
    navLabel: 'Components',
    bodyText: 'Body copy',
    showLabel: 'Show pane',
    hideLabel: 'Hide pane',
  }

  it('compiles the default children seed', { timeout: 30000 }, async () => {
    expect(typeof (await createSnippetComponent(buildAppShellSnippet(unset), scope))).toBe('function')
  })

  it('compiles a committed free-form children block with entities', { timeout: 30000 }, async () => {
    const source = buildAppShellSnippet({
      ...unset,
      children: '<div class="grid gap-2"><p>Fish &amp; Chips</p><img src="x" /></div>',
    })
    expect(typeof (await createSnippetComponent(source, scope))).toBe('function')
  })

  it('compiles a seed carrying the pane config and class-name objects', { timeout: 30000 }, async () => {
    const source = buildAppShellSnippet({
      ...unset,
      mode: 'floating',
      modeOn: true,
      classNames: { main: 'custom-main' },
      left: { open: false, size: 300, collapseMode: 'rail' },
      right: { open: true, size: 320 },
    })
    expect(typeof (await createSnippetComponent(source, scope))).toBe('function')
  })
})
