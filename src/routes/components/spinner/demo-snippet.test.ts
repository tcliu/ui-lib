import { describe, expect, it } from 'vitest'
import { buildSpinnerSnippet } from './demo-snippet'

describe('buildSpinnerSnippet', () => {
  it('omits className while unset', () => {
    const source = buildSpinnerSnippet({ size: '', tint: '' })
    expect(source).not.toContain('className=')
    expect(source).toContain('<Spinner />')
  })

  it('emits size and tint separately', () => {
    const source = buildSpinnerSnippet({ size: 'md', tint: 'text-cyan-400' })
    expect(source).toContain('<Spinner size="md" className="text-cyan-400" />')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildSpinnerSnippet({ size: '20', tint: '' })).toContain('size={20}')
    expect(buildSpinnerSnippet({ size: 'huge', tint: '' })).not.toContain('size=')
  })

  it('keeps size when only tint is set', () => {
    const source = buildSpinnerSnippet({ size: '', tint: 'text-cyan-400' })
    expect(source).toContain('<Spinner className="text-cyan-400" />')
  })

  it('keeps the labeled row behind the demo', () => {
    const source = buildSpinnerSnippet({ size: '', tint: '' })
    expect(source).toContain('{reloadLabel}')
  })
})
