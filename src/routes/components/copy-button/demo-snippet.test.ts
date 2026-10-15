import { describe, expect, it } from 'vitest'
import { DEFAULT_TEXT, buildCopyButtonSnippet, type CopyButtonSnippetState } from './demo-snippet'

const base: CopyButtonSnippetState = {
  text: '',
  textOn: false,
  ariaLabel: '',
  ariaLabelOn: false,
  tooltip: '',
  tooltipOn: false,
  size: '',
  sizeOn: true,
}

describe('buildCopyButtonSnippet', () => {
  it('falls back to the default text and omits unset props', () => {
    const source = buildCopyButtonSnippet(base)
    expect(source).toContain(`>${DEFAULT_TEXT}</span>`)
    expect(source).toContain(`text="${DEFAULT_TEXT}"`)
    expect(source).not.toContain('ariaLabel=')
    expect(source).not.toContain('tooltip=')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('emits a named size as a string and a numeric size as an expression', () => {
    expect(buildCopyButtonSnippet({ ...base, size: 'lg' })).toContain('size="lg"')
    expect(buildCopyButtonSnippet({ ...base, size: '14' })).toContain('size={14}')
    expect(buildCopyButtonSnippet({ ...base, size: 'huge' })).not.toMatch(/^\s*size=/m)
  })

  it('omits component defaults (the Value column prefills them)', () => {
    expect(buildCopyButtonSnippet({ ...base, size: 'md' })).not.toMatch(/^\s*size=/m)
  })

  it('omits the staged size while its eye is off', () => {
    expect(buildCopyButtonSnippet({ ...base, size: 'lg', sizeOn: false })).not.toMatch(/^\s*size=/m)
  })

  it('emits and escapes the accessible name and tooltip', () => {
    const source = buildCopyButtonSnippet({
      ...base,
      ariaLabel: 'Copy "link"',
      ariaLabelOn: true,
      tooltip: 'Copy link',
      tooltipOn: true,
    })
    expect(source).toContain('ariaLabel="Copy &quot;link&quot;"')
    expect(source).toContain('tooltip="Copy link"')
  })

  it('omits staged labels while their eye is off and emits them while on', () => {
    const off = buildCopyButtonSnippet({ ...base, ariaLabel: 'Copy link', tooltip: 'Copy link' })
    expect(off).not.toContain('ariaLabel=')
    expect(off).not.toContain('tooltip=')
    const on = buildCopyButtonSnippet({ ...base, ariaLabel: 'Copy link', ariaLabelOn: true, tooltip: 'Copy link', tooltipOn: true })
    expect(on).toContain('ariaLabel="Copy link"')
    expect(on).toContain('tooltip="Copy link"')
  })

  it('escapes markup in the copied and displayed text', () => {
    const source = buildCopyButtonSnippet({ ...base, text: 'a <b> & c', textOn: true })
    expect(source).toContain('a &lt;b&gt; &amp; c')
    expect(source).toContain('text="a &lt;b&gt; &amp; c"')
  })

  it('falls back to the default text while the text eye is off', () => {
    const off = buildCopyButtonSnippet({ ...base, text: 'Custom text', textOn: false })
    expect(off).not.toContain('Custom text')
    expect(off).toContain(`text="${DEFAULT_TEXT}"`)
  })
})
