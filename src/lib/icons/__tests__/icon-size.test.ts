import { describe, expect, it } from 'vitest'
import { ICON_RATIO } from '$lib/size-scale'
import { resolveIconPx } from '../icon-size'

describe('resolveIconPx', () => {
  it('maps size names to the shared icon ratio of their pixel size', () => {
    expect(resolveIconPx('xs')).toBeCloseTo(12 * ICON_RATIO)
    expect(resolveIconPx('sm')).toBeCloseTo(14 * ICON_RATIO)
    expect(resolveIconPx('md')).toBeCloseTo(16 * ICON_RATIO)
    expect(resolveIconPx('lg')).toBeCloseTo(18 * ICON_RATIO)
    expect(resolveIconPx('xl')).toBeCloseTo(20 * ICON_RATIO)
  })

  it('scales finite numbers continuously by the same ratio', () => {
    expect(resolveIconPx(14)).toBeCloseTo(14 * ICON_RATIO)
    expect(resolveIconPx(13.5)).toBeCloseTo(13.5 * ICON_RATIO)
  })

  it('floors at the ratio of 1px and falls back to md for non-finite', () => {
    expect(resolveIconPx(-4)).toBeCloseTo(ICON_RATIO)
    expect(resolveIconPx(0)).toBeCloseTo(ICON_RATIO)
    expect(resolveIconPx(Number.NaN)).toBeCloseTo(16 * ICON_RATIO)
    expect(resolveIconPx(Number.POSITIVE_INFINITY)).toBeCloseTo(16 * ICON_RATIO)
  })
})
