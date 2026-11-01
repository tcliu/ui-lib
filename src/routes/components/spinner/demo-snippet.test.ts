import { describe, expect, it } from 'vitest'
import { staged } from '$showcase/playground/staged'
import { buildSpinnerSnippet } from './demo-snippet'

describe('buildSpinnerSnippet', () => {
  it('omits className while unset', () => {
    const source = buildSpinnerSnippet({ size: staged('', true), tint: staged('', true) })
    expect(source).not.toContain('className=')
    expect(source).toContain('<Spinner />')
  })

  it('emits size and tint separately', () => {
    const source = buildSpinnerSnippet({ size: staged('lg', true), tint: staged('text-cyan-400', true) })
    expect(source).toContain('<Spinner size="lg" className="text-cyan-400" />')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildSpinnerSnippet({ size: staged('md', true), tint: staged('', true) })
    expect(source).toContain('<Spinner />')
    expect(source).not.toContain('size=')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildSpinnerSnippet({ size: staged('20', true), tint: staged('', true) })).toContain('size={20}')
    expect(buildSpinnerSnippet({ size: staged('huge', true), tint: staged('', true) })).not.toContain('size=')
  })

  it('keeps size when only tint is set', () => {
    const source = buildSpinnerSnippet({ size: staged('', true), tint: staged('text-cyan-400', true) })
    expect(source).toContain('<Spinner className="text-cyan-400" />')
  })

  it('keeps the labeled row behind the demo', () => {
    const source = buildSpinnerSnippet({ size: staged('', true), tint: staged('', true) })
    expect(source).toContain('{reloadLabel}')
  })

  it('omits the staged size while its eye is off', () => {
    expect(buildSpinnerSnippet({ size: staged('lg'), tint: staged('', true) })).not.toContain('size=')
  })

  it('omits the staged tint while its eye is off', () => {
    expect(buildSpinnerSnippet({ size: staged('', true), tint: staged('text-cyan-400') })).not.toContain('className=')
  })
})
