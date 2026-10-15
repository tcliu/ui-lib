import { describe, expect, it } from 'vitest'
import { FONT_RATIO, resolveFontPx, SIZE_ORDER, SIZE_PX } from '../size-scale'

// Canonical scale every sized component shares: names are aliases for
// icon-scale pixels, numbers are positions on the same axis, and font size
// is always the dimension times FONT_RATIO.
describe('size-scale', () => {
  it('maps names to the icon steps', () => {
    expect(SIZE_PX).toEqual({ xs: 12, sm: 14, md: 16, lg: 18, xl: 20 })
    expect(SIZE_ORDER).toEqual(['xs', 'sm', 'md', 'lg', 'xl'])
    expect(FONT_RATIO).toBe(0.875)
  })

  it('resolves fonts as dimension times the fixed ratio', () => {
    expect(resolveFontPx('xs')).toBe(10.5)
    expect(resolveFontPx('sm')).toBe(12.25)
    expect(resolveFontPx('md')).toBe(14)
    expect(resolveFontPx('lg')).toBe(15.75)
    expect(resolveFontPx('xl')).toBe(17.5)
    expect(resolveFontPx(16)).toBe(14)
    expect(resolveFontPx(14)).toBe(12.25)
    expect(resolveFontPx(19)).toBe(16.625)
    expect(resolveFontPx(0)).toBe(0.875)
    expect(resolveFontPx(Number.NaN)).toBe(14)
  })
})
