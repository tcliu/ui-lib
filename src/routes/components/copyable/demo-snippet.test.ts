import { describe, expect, it } from 'vitest'
import { buildCopyableSnippet } from './demo-snippet'

describe('buildCopyableSnippet', () => {
  it('falls back to the default text while unset', () => {
    const source = buildCopyableSnippet({ text: '', textOn: false, copyPosition: '', copyPositionOn: true, textClass: '', textClassOn: false, containerClass: '', containerClassOn: false, ariaLabel: '', ariaLabelOn: false, tooltip: '', tooltipOn: false, children: '', size: '', sizeOn: true })
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
      text: 'npm run check',
      textOn: true,
      copyPosition: 'top-right',
      copyPositionOn: true,
      textClass: 'font-mono',
      textClassOn: true,
      containerClass: '',
      containerClassOn: false,
      ariaLabel: '',
      ariaLabelOn: false,
      tooltip: '',
      tooltipOn: false,
      children: '',
      size: '',
      sizeOn: true,
    })
    expect(source).toContain('text="npm run check"')
    expect(source).toContain('copyPosition="top-right"')
    expect(source).toContain('textClass="font-mono"')
    expect(source).not.toContain('<span>')
  })

  it('emits containerClass, copy labels, and tooltip when set', () => {
    const source = buildCopyableSnippet({
      text: '', textOn: false,
      copyPosition: '', copyPositionOn: true,
      textClass: '',
      textClassOn: false,
      containerClass: 'gap-2',
      containerClassOn: true,
      ariaLabel: 'Copy snippet',
      ariaLabelOn: true,
      tooltip: 'Copy to clipboard',
      tooltipOn: true,
      children: '',
      size: '',
      sizeOn: true,
    })
    expect(source).toContain('containerClass="gap-2"')
    expect(source).toContain('ariaLabel="Copy snippet"')
    expect(source).toContain('tooltip="Copy to clipboard"')
  })

  it('escapes attribute values', () => {
    const source = buildCopyableSnippet({
      text: '', textOn: false,
      copyPosition: '', copyPositionOn: true,
      textClass: 'a & "b"',
      textClassOn: true,
      containerClass: '',
      containerClassOn: false,
      ariaLabel: '',
      ariaLabelOn: false,
      tooltip: '',
      tooltipOn: false,
      children: '',
      size: '',
      sizeOn: true,
    })
    expect(source).toContain('textClass="a &amp; &quot;b&quot;"')
  })

  it('emits the children span when applied', () => {
    const source = buildCopyableSnippet({ text: '', textOn: false, copyPosition: '', copyPositionOn: true, textClass: '', textClassOn: false, containerClass: '', containerClassOn: false, ariaLabel: '', ariaLabelOn: false, tooltip: '', tooltipOn: false, children: 'Custom content', size: '', sizeOn: true })
    expect(source).toContain('<span>Custom content</span>')
    expect(source).toContain('</Copyable>')
  })

  it('escapes children text', () => {
    const source = buildCopyableSnippet({ text: '', textOn: false, copyPosition: '', copyPositionOn: true, textClass: '', textClassOn: false, containerClass: '', containerClassOn: false, ariaLabel: '', ariaLabelOn: false, tooltip: '', tooltipOn: false, children: 'a & <b>', size: '', sizeOn: true })
    expect(source).toContain('<span>a &amp; &lt;b&gt;</span>')
  })

  it('omits staged text overrides while their eye is off and emits them while on', () => {
    const off = buildCopyableSnippet({ text: '', textOn: false, copyPosition: '', copyPositionOn: true, textClass: 'font-mono', textClassOn: false, containerClass: 'gap-2', containerClassOn: false, ariaLabel: 'Copy snippet', ariaLabelOn: false, tooltip: 'Copy me', tooltipOn: false, children: '', size: '', sizeOn: true })
    expect(off).not.toContain('textClass=')
    expect(off).not.toContain('containerClass=')
    expect(off).not.toContain('ariaLabel=')
    expect(off).not.toContain('tooltip=')
    const on = buildCopyableSnippet({ text: '', textOn: false, copyPosition: '', copyPositionOn: true, textClass: 'font-mono', textClassOn: true, containerClass: 'gap-2', containerClassOn: true, ariaLabel: 'Copy snippet', ariaLabelOn: true, tooltip: 'Copy me', tooltipOn: true, children: '', size: '', sizeOn: true })
    expect(on).toContain('textClass="font-mono"')
    expect(on).toContain('containerClass="gap-2"')
    expect(on).toContain('ariaLabel="Copy snippet"')
    expect(on).toContain('tooltip="Copy me"')
  })

  it('emits a named size as a string and a numeric size as an expression', () => {
    expect(
      buildCopyableSnippet({ text: '', textOn: false, copyPosition: '', copyPositionOn: true, textClass: '', textClassOn: false, containerClass: '', containerClassOn: false, ariaLabel: '', ariaLabelOn: false, tooltip: '', tooltipOn: false, children: '', size: 'lg', sizeOn: true }),
    ).toContain('size="lg"')
    expect(
      buildCopyableSnippet({ text: '', textOn: false, copyPosition: '', copyPositionOn: true, textClass: '', textClassOn: false, containerClass: '', containerClassOn: false, ariaLabel: '', ariaLabelOn: false, tooltip: '', tooltipOn: false, children: '', size: '14', sizeOn: true }),
    ).toContain('size={14}')
    expect(
      buildCopyableSnippet({ text: '', textOn: false, copyPosition: '', copyPositionOn: true, textClass: '', textClassOn: false, containerClass: '', containerClassOn: false, ariaLabel: '', ariaLabelOn: false, tooltip: '', tooltipOn: false, children: '', size: 'huge', sizeOn: true }),
    ).not.toMatch(/^\s*size=/m)
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildCopyableSnippet({ text: '', textOn: false, copyPosition: 'inline', copyPositionOn: true, textClass: 'text-slate-400', textClassOn: false, containerClass: '', containerClassOn: false, ariaLabel: '', ariaLabelOn: false, tooltip: '', tooltipOn: false, children: '', size: 'md', sizeOn: true })
    expect(source).not.toContain('copyPosition=')
    expect(source).not.toContain('textClass=')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildCopyableSnippet({ text: '', textOn: false, copyPosition: 'top-right', copyPositionOn: false, textClass: '', textClassOn: false, containerClass: '', containerClassOn: false, ariaLabel: '', ariaLabelOn: false, tooltip: '', tooltipOn: false, children: '', size: 'lg', sizeOn: false })
    expect(off).not.toContain('copyPosition=')
    expect(off).not.toMatch(/^\s*size=/m)
  })

  it('falls back to the default text while the text eye is off', () => {
    const off = buildCopyableSnippet({ text: 'Custom text', textOn: false, copyPosition: '', copyPositionOn: true, textClass: '', textClassOn: false, containerClass: '', containerClassOn: false, ariaLabel: '', ariaLabelOn: false, tooltip: '', tooltipOn: false, children: '', size: '', sizeOn: true })
    expect(off).not.toContain('Custom text')
    expect(off).toContain('text="Copy me"')
  })
})
