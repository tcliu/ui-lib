import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$showcase/snippet-playground'
import { staged } from '$showcase/staged'
import { buildButtonsSnippet, buttonsChildrenSnippet, normalizeButtonsDraft, parseButtonsList, type ButtonsSnippetState } from './demo-snippet'

// A layout-preset class the builder only passes through, used to check the
// className override path.
const STACKED_CLASS = 'flex flex-col items-start gap-1'

function state(overrides: Partial<ButtonsSnippetState> = {}): ButtonsSnippetState {
  return {
    align: staged('', true),
    className: staged(''),
    size: staged('md'),
    buttonSize: 'md',
    children: staged('', true),
    ...overrides,
  }
}

describe('buildButtonsSnippet', () => {
  it('omits align and className while unset', () => {
    const source = buildButtonsSnippet(state())
    expect(source).toContain('<Buttons>')
    expect(source).not.toContain('align=')
    expect(source).not.toContain('className=')
  })

  it('emits an empty layout while the children toggle is off', () => {
    const source = buildButtonsSnippet(state({ children: staged('', false) }))
    expect(source).toBe('<Buttons>\n</Buttons>')
    expect(source).not.toContain('{okLabel}')
  })

  it('emits the chosen align', () => {
    const source = buildButtonsSnippet(state({ align: staged('center', true) }))
    expect(source).toContain('<Buttons align="center">')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildButtonsSnippet(state({ align: staged('left', true) }))
    expect(source).toContain('<Buttons>')
    expect(source).not.toContain('align=')
  })

  it('omits the staged align while its eye is off', () => {
    const source = buildButtonsSnippet(state({ align: staged('center') }))
    expect(source).not.toContain('align=')
  })

  it('drops align when className takes over', () => {
    const source = buildButtonsSnippet(state({ align: staged('center', true), className: staged(STACKED_CLASS, true) }))
    expect(source).not.toContain('align=')
    expect(source).toContain(`className="${STACKED_CLASS}"`)
  })

  it('emits the stacked class override', () => {
    const source = buildButtonsSnippet(state({ className: staged(STACKED_CLASS, true) }))
    expect(source).toContain('className="flex flex-col items-start gap-1"')
  })

  it('emits the chosen size', () => {
    const source = buildButtonsSnippet(state({ size: staged('lg', true) }))
    expect(source).toContain('<Buttons size="lg">')
  })

  it('emits a numeric size as an expression', () => {
    const source = buildButtonsSnippet(state({ size: staged('20', true) }))
    expect(source).toContain('<Buttons size={20}>')
  })

  it('omits the default size (the Value column prefills it)', () => {
    const source = buildButtonsSnippet(state({ size: staged('md', true) }))
    expect(source).toContain('<Buttons>')
    expect(source).not.toContain('size=')
  })

  it('omits the staged size while its eye is off', () => {
    const source = buildButtonsSnippet(state({ size: staged('lg') }))
    expect(source).not.toContain('size=')
  })

  it('drops the size when className takes over', () => {
    const source = buildButtonsSnippet(state({ size: staged('lg', true), className: staged(STACKED_CLASS, true) }))
    expect(source).not.toContain('size=')
    expect(source).toContain(`className="${STACKED_CLASS}"`)
  })

  it('emits the button size on every button of the canonical pair', () => {
    const source = buildButtonsSnippet(state({ buttonSize: 'lg' }))
    expect(source).toContain('<Button size="lg" variant="primary">{okLabel}</Button>')
    expect(source).toContain('<Button size="lg" variant="outline">{cancelLabel}</Button>')
  })

  it('emits a numeric button size as an expression', () => {
    const source = buildButtonsSnippet(state({ buttonSize: '20' }))
    expect(source).toContain('<Button size={20} variant="primary">')
  })

  it('omits the button size while it is unset or at the default', () => {
    expect(buildButtonsSnippet(state())).not.toContain('size=')
    expect(buildButtonsSnippet(state({ buttonSize: 'md' }))).not.toContain('size=')
    expect(buildButtonsSnippet(state({ buttonSize: '' }))).not.toContain('size=')
  })

  it('injects the button size into custom children', () => {
    const source = buildButtonsSnippet(
      state({ buttonSize: 'lg', children: staged('<Button variant="primary">Create</Button>\n<Button>Reset</Button>', true) }),
    )
    expect(source).toContain('<Button size="lg" variant="primary">Create</Button>')
    expect(source).toContain('<Button size="lg">Reset</Button>')
  })

  it('leaves custom children untouched without a button size', () => {
    const source = buildButtonsSnippet(state({ buttonSize: '', children: staged('<Button variant="primary">Create</Button>', true) }))
    expect(source).toContain('<Button variant="primary">Create</Button>')
  })

  it('stages the className override until applied', () => {
    const parked = buildButtonsSnippet(state({ align: staged('center', true), className: staged(STACKED_CLASS) }))
    expect(parked).toContain('<Buttons align="center">')
    expect(parked).not.toContain('className=')
    const applied = buildButtonsSnippet(state({ align: staged('center', true), className: staged(STACKED_CLASS, true) }))
    expect(applied).not.toContain('align=')
    expect(applied).toContain(`className="${STACKED_CLASS}"`)
  })

  it('reads both labels from scope while unset', () => {
    const source = buildButtonsSnippet(state())
    expect(source).not.toContain('<script>')
    expect(source).toContain('{okLabel}')
    expect(source).toContain('{cancelLabel}')
  })

  it('emits customized children verbatim', () => {
    const source = buildButtonsSnippet(
      state({ children: staged('<Button variant="primary">Create</Button>\n<Button variant="danger">Delete</Button>', true) }),
    )
    expect(source).toContain('<Button variant="primary">Create</Button>')
    expect(source).toContain('<Button variant="danger">Delete</Button>')
    expect(source).not.toContain('{okLabel}')
  })

  it('escapes ampersands in verbatim labels so the seed compiles', () => {
    const source = buildButtonsSnippet(state({ children: staged('<Button>Fish & Chips</Button>', true) }))
    expect(source).toContain('<Button>Fish &amp; Chips</Button>')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildButtonsSnippet(state()), {
      okLabel: 'OK',
      cancelLabel: 'Cancel',
    })
    expect(typeof component).toBe('function')
  })

  it('compiles the generated snippet with customized children', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(
      buildButtonsSnippet(
        state({ children: staged('<Button variant="primary">Create</Button>\n<Button>Fish & Chips</Button>', true) }),
      ),
      {
        okLabel: 'OK',
        cancelLabel: 'Cancel',
      },
    )
    expect(typeof component).toBe('function')
  })
})

describe('buttonsChildrenSnippet / parseButtonsList / normalizeButtonsDraft', () => {
  it('renders the canonical pair from the labels', () => {
    const source = buttonsChildrenSnippet('OK', 'Cancel')
    expect(source).toBe('<Button variant="primary">OK</Button>\n<Button variant="outline">Cancel</Button>')
  })

  it('parses any number of buttons with their variants', () => {
    expect(parseButtonsList('<Button variant="primary">Create</Button>')).toEqual([
      { kind: 'button', variant: 'primary', label: 'Create' },
    ])
    expect(
      parseButtonsList(
        '<Button variant="primary">Create</Button>\n<Button>Reset</Button>\n<Button variant="danger">Delete</Button>',
      ),
    ).toEqual([
      { kind: 'button', variant: 'primary', label: 'Create' },
      { kind: 'button', variant: 'secondary', label: 'Reset' },
      { kind: 'button', variant: 'danger', label: 'Delete' },
    ])
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseButtonsList('  <Button variant="primary">OK</Button>\n  <Button>Cancel</Button>  ')).toEqual([
      { kind: 'button', variant: 'primary', label: 'OK' },
      { kind: 'button', variant: 'secondary', label: 'Cancel' },
    ])
  })

  it('accepts plain text alongside buttons', () => {
    expect(
      parseButtonsList('<Button variant="primary">OK</Button>\n<Button variant="outline">Cancel</Button>\n123'),
    ).toEqual([
      { kind: 'button', variant: 'primary', label: 'OK' },
      { kind: 'button', variant: 'outline', label: 'Cancel' },
      { kind: 'text', text: '123' },
    ])
  })

  it('accepts plain div, span, and p elements with text content', () => {
    expect(
      parseButtonsList('<Button variant="primary">OK</Button>\n<Button variant="outline">Cancel</Button>\n<div>123</div>'),
    ).toEqual([
      { kind: 'button', variant: 'primary', label: 'OK' },
      { kind: 'button', variant: 'outline', label: 'Cancel' },
      { kind: 'html', tag: 'div', text: '123' },
    ])
    expect(parseButtonsList('<Button>A</Button><span>hi</span><p>yo</p>')).toEqual([
      { kind: 'button', variant: 'secondary', label: 'A' },
      { kind: 'html', tag: 'span', text: 'hi' },
      { kind: 'html', tag: 'p', text: 'yo' },
    ])
  })

  it('rejects attributed, nested, and foreign elements', () => {
    expect(parseButtonsList('<Button>A</Button>\n<div class="x">123</div>')).toBeNull()
    expect(parseButtonsList('<Button>A</Button>\n<div><span>123</span></div>')).toBeNull()
    expect(parseButtonsList('<Button>A</Button>\n<div><Button>B</Button></div>')).toBeNull()
    expect(parseButtonsList('<Button>A</Button>\n<DIV>123</DIV>')).toBeNull()
    expect(parseButtonsList('<Button>A</Button>\n<section>123</section>')).toBeNull()
    expect(parseButtonsList('<div>123</div>')).toBeNull()
  })

  it('accepts leading and inline text', () => {
    expect(parseButtonsList('v1\n<Button>A</Button> B <Button>C</Button>')).toEqual([
      { kind: 'text', text: 'v1' },
      { kind: 'button', variant: 'secondary', label: 'A' },
      { kind: 'text', text: 'B' },
      { kind: 'button', variant: 'secondary', label: 'C' },
    ])
  })

  it('accepts ampersands and lone braces in text', () => {
    expect(parseButtonsList('<Button>Fish & Chips</Button>\na } b')).toEqual([
      { kind: 'button', variant: 'secondary', label: 'Fish & Chips' },
      { kind: 'text', text: 'a } b' },
    ])
  })

  it('round-trips the canonical snippet', () => {
    const parsed = parseButtonsList(buttonsChildrenSnippet('Apply', 'Reset'))
    expect(parsed).toEqual([
      { kind: 'button', variant: 'primary', label: 'Apply' },
      { kind: 'button', variant: 'outline', label: 'Reset' },
    ])
  })

  it('rejects drafts that are not pure Button markup and text', () => {
    expect(parseButtonsList('')).toBeNull()
    expect(parseButtonsList('not markup')).toBeNull()
    expect(parseButtonsList('123')).toBeNull()
    expect(parseButtonsList('<Button>Only</Button>\nsome < text')).toBeNull()
    expect(parseButtonsList('<Button>A</Button>\n{a}')).toBeNull()
    expect(parseButtonsList('<Button variant="banana">A</Button>\n<Button>B</Button>')).toBeNull()
    expect(parseButtonsList('<Button variant="">A</Button>\n<Button>B</Button>')).toBeNull()
    expect(parseButtonsList('<Button variant="primary" accent="rose">A</Button>\n<Button>B</Button>')).toBeNull()
    expect(parseButtonsList('<Button>A {clicks}</Button>')).toBeNull()
    expect(parseButtonsList('<Button>A<B</Button>')).toBeNull()
  })

  it('normalizes a committed draft to one trimmed button per line', () => {
    expect(normalizeButtonsDraft('  <Button>A</Button>  \n\n  <Button>B</Button>\n')).toBe(
      '<Button>A</Button>\n<Button>B</Button>',
    )
  })
})
