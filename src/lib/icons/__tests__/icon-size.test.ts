import { describe, expect, it } from 'vitest'
import { resolveIconPx } from '../icon-size'

describe('resolveIconPx', () => {
  it('maps size names to their pixel sizes', () => {
    expect(resolveIconPx('xs')).toBe(12)
    expect(resolveIconPx('sm')).toBe(14)
    expect(resolveIconPx('md')).toBe(16)
    expect(resolveIconPx('lg')).toBe(18)
    expect(resolveIconPx('xl')).toBe(20)
  })

  it('passes finite numbers through', () => {
    expect(resolveIconPx(14)).toBe(14)
    expect(resolveIconPx(13.5)).toBe(13.5)
  })

  it('floors at 1px and falls back to md for non-finite', () => {
    expect(resolveIconPx(-4)).toBe(1)
    expect(resolveIconPx(0)).toBe(1)
    expect(resolveIconPx(Number.NaN)).toBe(16)
    expect(resolveIconPx(Number.POSITIVE_INFINITY)).toBe(16)
  })
})
