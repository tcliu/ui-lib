import { describe, expect, it } from 'vitest'
import { staged } from '#showcase/playground/staged.js'
import {
  DISMISS_HANDLER,
  STYLED_PANEL,
  buildBaseBodyLines,
  buildBaseDialogSnippet,
  parseBaseBodyMarkup,
  type BaseDialogSnippetState,
} from './demo-snippet'

const defaultChildren = buildBaseBodyLines({
  body: 'Dialog body content.',
  buttons: [
    { variant: 'primary', label: 'OK', onClick: DISMISS_HANDLER },
    { variant: 'outline', label: 'Cancel', onClick: DISMISS_HANDLER },
  ],
})

function state(overrides: Partial<BaseDialogSnippetState> = {}): BaseDialogSnippetState {
  return {
    widthVariant: staged('', true),
    heightVariant: staged('', true),
    size: staged('', true),
    className: staged('', true),
    children: staged(defaultChildren, true),
    title: staged('', true),
    closeLabel: staged('', true),
    header: staged('', false),
    ariaLabel: staged(''),
    dismissDisabled: staged('', true),
    ...overrides,
  }
}

describe('buildBaseDialogSnippet', () => {
  it('emits ariaLabel and dismissDisabled when staged on', () => {
    const on = buildBaseDialogSnippet(
      state({ ariaLabel: staged('Dialog', true), dismissDisabled: staged('yes', true) }),
    )
    expect(on).toContain('ariaLabel="Dialog"')
    expect(on).toContain('dismissDisabled')
    const off = buildBaseDialogSnippet(
      state({ ariaLabel: staged('Dialog'), dismissDisabled: staged('yes') }),
    )
    expect(off).not.toContain('ariaLabel=')
    expect(off).not.toContain('dismissDisabled')
  })

  it('renders the titled dialog with the given children while set', () => {
    const source = buildBaseDialogSnippet(state())
    expect(source).toContain('title={dialogTitle}')
    expect(source).not.toContain('closeLabel=')
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
    expect(source).not.toContain('size=')
    // Indented: the static <Buttons> row line also carries a className.
    expect(source).not.toContain('    className=')
    expect(source).toContain('<p>Dialog body content.</p>')
    expect(source).toContain('<Buttons align="right">')
    expect(source).toContain('<Button variant="primary" onClick={() => (open = false)}>OK</Button>')
    expect(source).toContain('<Button variant="outline" onClick={() => (open = false)}>Cancel</Button>')
    expect(source).toContain('</BaseDialog>')
  })

  it('emits width/height variants and styled classes', () => {
    const source = buildBaseDialogSnippet(
      state({
        widthVariant: staged('xl', true),
        heightVariant: staged('2xl', true),
        className: staged(STYLED_PANEL, true),
      }),
    )
    expect(source).toContain('title={dialogTitle}')
    expect(source).toContain('widthVariant="xl"')
    expect(source).toContain('heightVariant="2xl"')
    expect(source).toContain('className="border-cyan-500/40"')
  })

  it('emits the size shorthand when set', () => {
    const source = buildBaseDialogSnippet(state({ size: staged('4xl', true) }))
    expect(source).toContain('size="4xl"')
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildBaseDialogSnippet(state({ widthVariant: staged('md', true), heightVariant: staged('auto', true) }))
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
  })

  it('omits sizing props while their eyes are off', () => {
    const source = buildBaseDialogSnippet(
      state({
        widthVariant: staged('xl', false),
        heightVariant: staged('2xl', false),
        size: staged('4xl', false),
      }),
    )
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
    expect(source).not.toContain('size=')
  })

  it('omits the body and self-closes when children are off', () => {
    const source = buildBaseDialogSnippet(state({ children: staged('') }))
    expect(source).toContain('onCancel={() => (open = false)} />')
    expect(source).not.toContain('Dialog body content.')
    expect(source).not.toContain('</BaseDialog>')
  })

  it('emits custom handlers verbatim and escapes text', () => {
    const source = buildBaseDialogSnippet(
      state({
        children: staged(
          buildBaseBodyLines({
            body: 'Fish & chips',
            buttons: [{ variant: 'primary', label: 'Go & see', onClick: "() => alert('hi')" }],
          }),
          true,
        ),
      }),
    )
    expect(source).toContain('<p>Fish &amp; chips</p>')
    expect(source).toContain(`<Button variant="primary" onClick={() => alert('hi')}>Go &amp; see</Button>`)
  })

  it('round-trips children markup through parse and normalize', () => {
    const markup = buildBaseBodyLines({
      body: 'Custom & body',
      buttons: [{ variant: 'primary', label: 'Go', onClick: DISMISS_HANDLER }],
    })
    expect(parseBaseBodyMarkup(markup)).toEqual({
      body: 'Custom & body',
      buttons: [{ variant: 'primary', label: 'Go', onClick: DISMISS_HANDLER }],
    })
    expect(parseBaseBodyMarkup('nope')).toBeNull()
    expect(parseBaseBodyMarkup('<p>Body</p>')).toBeNull()
    expect(
      parseBaseBodyMarkup('<p>Body</p>\n<Buttons align="right">\n  <Button variant="unknown">Go</Button>\n</Buttons>'),
    ).toBeNull()
  })

  it('accepts nested custom handlers and rejects unbalanced ones', () => {
    const nested = buildBaseBodyLines({
      body: 'Body',
      buttons: [{ variant: 'primary', label: 'Go', onClick: "() => alert({ text: 'hi {there}' })" }],
    })
    expect(parseBaseBodyMarkup(nested)?.buttons[0]?.onClick).toBe("() => alert({ text: 'hi {there}' })")
    expect(
      parseBaseBodyMarkup('<p>Body</p>\n<Buttons align="right">\n  <Button variant="primary" onClick={() => alert(>Go</Button>\n</Buttons>'),
    ).toBeNull()
    expect(
      parseBaseBodyMarkup('<p>Body</p>\n<Buttons align="right">\n  <Button variant="primary" onClick={}>Go</Button>\n</Buttons>'),
    ).toBeNull()
  })

  it('emits the title and close labels when set', () => {
    const source = buildBaseDialogSnippet(
      state({ title: staged('Say "hi"', true), closeLabel: staged('Dismiss', true) }),
    )
    expect(source).toContain('title="Say &quot;hi&quot;"')
    expect(source).toContain('closeLabel="Dismiss"')
  })

  it('omits staged text props while their eye is off and emits them when on', () => {
    const off = buildBaseDialogSnippet(
      state({ className: staged(STYLED_PANEL, false), title: staged('Hi', false), closeLabel: staged('Dismiss', false) }),
    )
    expect(off).toContain('title={dialogTitle}')
    expect(off).not.toContain('closeLabel=')
    expect(off).not.toContain('    className=')
    const on = buildBaseDialogSnippet(
      state({ className: staged(STYLED_PANEL, true), title: staged('Hi', true), closeLabel: staged('Dismiss', true) }),
    )
    expect(on).toContain('title="Hi"')
    expect(on).toContain('closeLabel="Dismiss"')
    expect(on).toContain('className="border-cyan-500/40"')
  })

  it('emits the header snippet while applied', () => {
    const source = buildBaseDialogSnippet(
      state({
        header: staged('<Copyable text="$.user"><span>$.user</span></Copyable>', true),
      }),
    )
    expect(source).toContain('    {#snippet header()}')
    expect(source).toContain('      <Copyable text="$.user"><span>$.user</span></Copyable>')
    expect(source).toContain('    {/snippet}')
    expect(source).toContain('</BaseDialog>')
  })

  it('keeps the dialog open with slots applied while children are off', () => {
    const source = buildBaseDialogSnippet(
      state({
        children: staged(''),
        header: staged('<Copyable text="t"><span>t</span></Copyable>', true),
      }),
    )
    expect(source).toContain('onCancel={() => (open = false)}>')
    expect(source).toContain('{#snippet header()}')
    expect(source).not.toContain('Dialog body content.')
  })

  it('omits the header snippet while its eye is off', () => {
    const source = buildBaseDialogSnippet(
      state({
        header: staged('<Copyable text="t"><span>t</span></Copyable>', false),
      }),
    )
    expect(source).not.toContain('{#snippet header()}')
  })
})
