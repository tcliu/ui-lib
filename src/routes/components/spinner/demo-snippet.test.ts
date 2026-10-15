import { describe, expect, it } from 'vitest'
import { buildSpinnerSnippet } from './demo-snippet'

describe('buildSpinnerSnippet', () => {
  it('omits className while unset', () => {
    const source = buildSpinnerSnippet({ size: '', sizeOn: true, tint: '', tintOn: true })
    expect(source).not.toContain('className=')
    expect(source).toContain('<Spinner />')
  })

  it('emits size and tint separately', () => {
    const source = buildSpinnerSnippet({ size: 'lg', sizeOn: true, tint: 'text-cyan-400', tintOn: true })
    expect(source).toContain('<Spinner size="lg" className="text-cyan-400" />')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildSpinnerSnippet({ size: 'md', sizeOn: true, tint: '', tintOn: true })
    expect(source).toContain('<Spinner />')
    expect(source).not.toContain('size=')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildSpinnerSnippet({ size: '20', sizeOn: true, tint: '', tintOn: true })).toContain('size={20}')
    expect(buildSpinnerSnippet({ size: 'huge', sizeOn: true, tint: '', tintOn: true })).not.toContain('size=')
  })

  it('keeps size when only tint is set', () => {
    const source = buildSpinnerSnippet({ size: '', sizeOn: true, tint: 'text-cyan-400', tintOn: true })
    expect(source).toContain('<Spinner className="text-cyan-400" />')
  })

  it('keeps the labeled row behind the demo', () => {
    const source = buildSpinnerSnippet({ size: '', sizeOn: true, tint: '', tintOn: true })
    expect(source).toContain('{reloadLabel}')
  })

  it('omits the staged size while its eye is off', () => {
    expect(buildSpinnerSnippet({ size: 'lg', sizeOn: false, tint: '', tintOn: true })).not.toContain('size=')
  })

  it('omits the staged tint while its eye is off', () => {
    expect(buildSpinnerSnippet({ size: '', sizeOn: true, tint: 'text-cyan-400', tintOn: false })).not.toContain('className=')
  })
})
