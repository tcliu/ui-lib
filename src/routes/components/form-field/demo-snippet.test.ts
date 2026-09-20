import { describe, expect, it } from 'vitest'
import { STYLED_CLASS, buildFormFieldSnippet } from './demo-snippet'

describe('buildFormFieldSnippet', () => {
  it('uses the scoped default label while unset', () => {
    const source = buildFormFieldSnippet({ label: '', htmlFor: '', className: '' })
    expect(source).toContain('<FormField label={defaultLabel}>')
    expect(source).not.toContain('htmlFor=')
    expect(source).not.toContain('className=')
    expect(source).not.toContain('id=')
  })

  it('emits label, htmlFor, and input id when set', () => {
    const source = buildFormFieldSnippet({ label: 'Name', htmlFor: 'demo', className: '' })
    expect(source).toContain('<FormField label="Name" htmlFor="demo">')
    expect(source).toContain('id="demo"')
  })

  it('emits the styled wrapper class', () => {
    const source = buildFormFieldSnippet({ label: '', htmlFor: '', className: STYLED_CLASS })
    expect(source).toContain('className="rounded-md border border-cyan-500/40 p-3"')
  })

  it('emits a hand-typed className', () => {
    const source = buildFormFieldSnippet({ label: '', htmlFor: '', className: 'mt-2' })
    expect(source).toContain('className="mt-2"')
  })

  it('escapes quotes in the label', () => {
    const source = buildFormFieldSnippet({ label: 'Say "hi"', htmlFor: '', className: '' })
    expect(source).toContain('label="Say &quot;hi&quot;"')
  })
})
