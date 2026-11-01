import { describe, expect, it } from 'vitest'
import { staged } from '$showcase/playground/staged'
import {
  STYLED_CLASS,
  buildFormFieldChildrenMarkup,
  buildFormFieldSnippet,
  normalizeFormFieldChildrenDraft,
  parseFormFieldChildSegments,
  parseFormFieldChildrenMarkup,
  type FormFieldSnippetState,
} from './demo-snippet'

function state(overrides: Partial<FormFieldSnippetState> = {}): FormFieldSnippetState {
  return {
    label: staged(''),
    htmlFor: staged(''),
    className: staged('', true),
    layout: staged('', true),
    size: staged(''),
    children: staged('', true),
    ...overrides,
  }
}

describe('buildFormFieldSnippet', () => {
  it('uses the scoped default label while unset', () => {
    const source = buildFormFieldSnippet(state())
    expect(source).toContain('<FormField label={defaultLabel}>')
    expect(source).not.toContain('htmlFor=')
    expect(source).not.toContain('className=')
    expect(source).not.toContain('layout=')
    expect(source).not.toContain('id=')
  })

  it('emits label, htmlFor, and input id when set', () => {
    const source = buildFormFieldSnippet(state({
      label: staged('Name', true),
      htmlFor: staged('demo', true),
    }))
    expect(source).toContain('<FormField label="Name" htmlFor="demo">')
    expect(source).toContain('  <TextInput bind:value id="demo" />')
  })

  it('emits the inline layout', () => {
    const source = buildFormFieldSnippet(state({ layout: staged('inline', true) }))
    expect(source).toContain('<FormField label={defaultLabel} layout="inline">')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildFormFieldSnippet(state({ layout: staged('stacked', true) }))
    expect(source).not.toContain('layout=')
  })

  it('emits the styled wrapper class', () => {
    const source = buildFormFieldSnippet(state({ className: staged(STYLED_CLASS, true) }))
    expect(source).toContain('className="rounded-md border border-cyan-500/40 p-3"')
  })

  it('omits the staged layout while its eye is off', () => {
    const source = buildFormFieldSnippet(state({ layout: staged('inline') }))
    expect(source).not.toContain('layout=')
  })

  it('omits className while its eye toggle is off and emits it while on', () => {
    const off = buildFormFieldSnippet(state({ className: staged('mt-2') }))
    expect(off).not.toContain('className=')
    const on = buildFormFieldSnippet(state({ className: staged('mt-2', true) }))
    expect(on).toContain('className="mt-2"')
  })

  it('emits a non-default size and omits the md default', () => {
    expect(buildFormFieldSnippet(state({ size: staged('lg', true) }))).toContain(' size="lg"')
    expect(buildFormFieldSnippet(state({ size: staged('18', true) }))).toContain(' size={18}')
    expect(buildFormFieldSnippet(state({ size: staged('md', true) }))).not.toContain('size=')
    expect(buildFormFieldSnippet(state({ size: staged('lg') }))).not.toContain('size=')
  })

  it('emits a hand-typed className', () => {
    const source = buildFormFieldSnippet(state({ className: staged('mt-2', true) }))
    expect(source).toContain('className="mt-2"')
  })

  it('escapes quotes in the label', () => {
    const source = buildFormFieldSnippet(state({ label: staged('Say "hi"', true) }))
    expect(source).toContain('label="Say &quot;hi&quot;"')
  })

  it('omits the control when children is off', () => {
    const source = buildFormFieldSnippet(state({ children: staged('', false) }))
    expect(source).toBe('<FormField label={defaultLabel}></FormField>')
  })

  it('emits committed children verbatim', () => {
    const source = buildFormFieldSnippet(state({
      children: staged('<TextInput bind:value id="demo-id" />\n<span>note-123</span>', true),
    }))
    expect(source).toContain('  <TextInput bind:value id="demo-id" />')
    expect(source).toContain('  <span>note-123</span>')
  })

  it('omits staged label and htmlFor while their eyes are off and keeps the fallbacks', () => {
    const off = buildFormFieldSnippet(state({ label: staged('Name'), htmlFor: staged('demo') }))
    expect(off).not.toContain('label="Name"')
    expect(off).not.toContain('htmlFor="demo"')
    expect(off).not.toContain('id="demo"')
    expect(off).toContain('label={defaultLabel}')
  })
})

describe('parseFormFieldChildrenMarkup', () => {
  it('accepts the canonical TextInput with and without an id', () => {
    expect(parseFormFieldChildrenMarkup('<TextInput bind:value id="demo" />')).toBe(
      '<TextInput bind:value id="demo" />',
    )
    expect(parseFormFieldChildrenMarkup('<TextInput bind:value />')).toBe('<TextInput bind:value />')
    expect(buildFormFieldChildrenMarkup({ htmlFor: 'demo' })).toBe('<TextInput bind:value id="demo" />')
  })

  it('accepts arbitrary HTML elements and text alongside controls', () => {
    const draft = ['<TextInput bind:value id="demo-id" />', '<span>note-123</span>', 'plain-123'].join('\n')
    expect(parseFormFieldChildrenMarkup(draft)).toBe(draft)
  })

  it('rejects expressions, components, unbalanced, and handler markup', () => {
    expect(parseFormFieldChildrenMarkup('')).toBeNull()
    expect(parseFormFieldChildrenMarkup('<div />')).toBeNull()
    expect(parseFormFieldChildrenMarkup('<TextInput bind:value={value} />')).toBeNull()
    expect(parseFormFieldChildrenMarkup('<MyControl />')).toBeNull()
    expect(parseFormFieldChildrenMarkup('<span>oops')).toBeNull()
    expect(parseFormFieldChildrenMarkup('<span>{label}</span>')).toBeNull()
    expect(parseFormFieldChildrenMarkup('<script>alert(1)</script>')).toBeNull()
    expect(parseFormFieldChildrenMarkup('<button onclick="go()">x</button>')).toBeNull()
  })

  it('normalizes drafts to one trimmed line per row', () => {
    expect(normalizeFormFieldChildrenDraft('  <span>a</span>\n\n   plain  \n')).toBe('<span>a</span>\nplain')
  })
})

describe('parseFormFieldChildSegments', () => {
  it('splits controls from verbatim HTML', () => {
    expect(
      parseFormFieldChildSegments('<TextInput bind:value id="demo-id" />\n<span>note-123</span>\nplain-123'),
    ).toEqual([
      { kind: 'textinput', id: 'demo-id' },
      { kind: 'html', html: '<span>note-123</span>\nplain-123' },
    ])
    expect(parseFormFieldChildSegments('<TextInput bind:value />')).toEqual([{ kind: 'textinput', id: '' }])
    expect(parseFormFieldChildSegments('<div />')).toBeNull()
  })
})
