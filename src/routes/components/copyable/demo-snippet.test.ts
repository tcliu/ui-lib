import { describe, expect, it } from 'vitest'
import { staged } from '$showcase/staged'
import { buildCopyableSnippet } from './demo-snippet'

describe('buildCopyableSnippet', () => {
  it('falls back to the default text while unset', () => {
    const source = buildCopyableSnippet({ text: staged(''), copyPosition: staged('', true), textClass: staged(''), containerClass: staged(''), ariaLabel: staged(''), tooltip: staged(''), children: staged(''), size: staged('', true) })
    expect(source).toContain('text="Copy me"')
    expect(source).not.toContain('copyPosition=')
    expect(source).not.toContain('textClass=')
    expect(source).not.toContain('containerClass=')
    expect(source).not.toContain('ariaLabel=')
    expect(source).not.toContain('tooltip=')
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('<span>')
    expect(source).toContain('/>')
  })

  it('emits text, position, and textClass when set', () => {
    const source = buildCopyableSnippet({
      text: staged('npm run check', true),
      copyPosition: staged('top-right', true),
      textClass: staged('font-mono', true),
      containerClass: staged(''),
      ariaLabel: staged(''),
      tooltip: staged(''),
      children: staged(''),
      size: staged('', true),
    })
    expect(source).toContain('text="npm run check"')
    expect(source).toContain('copyPosition="top-right"')
    expect(source).toContain('textClass="font-mono"')
    expect(source).not.toContain('<span>')
  })

  it('emits containerClass, copy labels, and tooltip when set', () => {
    const source = buildCopyableSnippet({
      text: staged(''),
      copyPosition: staged('', true),
      textClass: staged(''),
      containerClass: staged('gap-2', true),
      ariaLabel: staged('Copy snippet', true),
      tooltip: staged('Copy to clipboard', true),
      children: staged(''),
      size: staged('', true),
    })
    expect(source).toContain('containerClass="gap-2"')
    expect(source).toContain('ariaLabel="Copy snippet"')
    expect(source).toContain('tooltip="Copy to clipboard"')
  })

  it('escapes attribute values', () => {
    const source = buildCopyableSnippet({
      text: staged(''),
      copyPosition: staged('', true),
      textClass: staged('a & "b"', true),
      containerClass: staged(''),
      ariaLabel: staged(''),
      tooltip: staged(''),
      children: staged(''),
      size: staged('', true),
    })
    expect(source).toContain('textClass="a &amp; &quot;b&quot;"')
  })

  it('emits the children span when applied', () => {
    const source = buildCopyableSnippet({ text: staged(''), copyPosition: staged('', true), textClass: staged(''), containerClass: staged(''), ariaLabel: staged(''), tooltip: staged(''), children: staged('Custom content', true), size: staged('', true) })
    expect(source).toContain('<span>Custom content</span>')
    expect(source).toContain('</Copyable>')
  })

  it('escapes children text', () => {
    const source = buildCopyableSnippet({ text: staged(''), copyPosition: staged('', true), textClass: staged(''), containerClass: staged(''), ariaLabel: staged(''), tooltip: staged(''), children: staged('a & <b>', true), size: staged('', true) })
    expect(source).toContain('<span>a &amp; &lt;b&gt;</span>')
  })

  it('omits staged text overrides while their eye is off and emits them while on', () => {
    const off = buildCopyableSnippet({ text: staged(''), copyPosition: staged('', true), textClass: staged('font-mono', false), containerClass: staged('gap-2', false), ariaLabel: staged('Copy snippet', false), tooltip: staged('Copy me', false), children: staged(''), size: staged('', true) })
    expect(off).not.toContain('textClass=')
    expect(off).not.toContain('containerClass=')
    expect(off).not.toContain('ariaLabel=')
    expect(off).not.toContain('tooltip=')
    const on = buildCopyableSnippet({ text: staged(''), copyPosition: staged('', true), textClass: staged('font-mono', true), containerClass: staged('gap-2', true), ariaLabel: staged('Copy snippet', true), tooltip: staged('Copy me', true), children: staged(''), size: staged('', true) })
    expect(on).toContain('textClass="font-mono"')
    expect(on).toContain('containerClass="gap-2"')
    expect(on).toContain('ariaLabel="Copy snippet"')
    expect(on).toContain('tooltip="Copy me"')
  })

  it('emits a named size as a string and a numeric size as an expression', () => {
    expect(
      buildCopyableSnippet({ text: staged(''), copyPosition: staged('', true), textClass: staged(''), containerClass: staged(''), ariaLabel: staged(''), tooltip: staged(''), children: staged(''), size: staged('lg', true) }),
    ).toContain('size="lg"')
    expect(
      buildCopyableSnippet({ text: staged(''), copyPosition: staged('', true), textClass: staged(''), containerClass: staged(''), ariaLabel: staged(''), tooltip: staged(''), children: staged(''), size: staged('14', true) }),
    ).toContain('size={14}')
    expect(
      buildCopyableSnippet({ text: staged(''), copyPosition: staged('', true), textClass: staged(''), containerClass: staged(''), ariaLabel: staged(''), tooltip: staged(''), children: staged(''), size: staged('huge', true) }),
    ).not.toMatch(/^\s*size=/m)
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildCopyableSnippet({ text: staged(''), copyPosition: staged('inline', true), textClass: staged('text-slate-400', false), containerClass: staged(''), ariaLabel: staged(''), tooltip: staged(''), children: staged(''), size: staged('md', true) })
    expect(source).not.toContain('copyPosition=')
    expect(source).not.toContain('textClass=')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildCopyableSnippet({ text: staged(''), copyPosition: staged('top-right', false), textClass: staged(''), containerClass: staged(''), ariaLabel: staged(''), tooltip: staged(''), children: staged(''), size: staged('lg', false) })
    expect(off).not.toContain('copyPosition=')
    expect(off).not.toMatch(/^\s*size=/m)
  })

  it('falls back to the default text while the text eye is off', () => {
    const off = buildCopyableSnippet({ text: staged('Custom text', false), copyPosition: staged('', true), textClass: staged(''), containerClass: staged(''), ariaLabel: staged(''), tooltip: staged(''), children: staged(''), size: staged('', true) })
    expect(off).not.toContain('Custom text')
    expect(off).toContain('text="Copy me"')
  })
})
