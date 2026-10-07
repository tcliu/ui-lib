import { describe, expect, it } from 'vitest'
import {
  FONT_PX,
  lerp,
  nearestStep,
  resolveFontPx,
  resolveSizeStep,
  SIZE_PX,
} from '../size-scale'

// Canonical scale every sized component shares: names are aliases for
// icon-scale pixels, numbers are positions on the same axis.
describe('size-scale', () => {
  it('maps names to the icon steps', () => {
    expect(SIZE_PX).toEqual({ xs: 12, sm: 16, md: 20, lg: 24 })
    expect(FONT_PX).toEqual({ xs: 11, sm: 13, md: 15, lg: 18 })
  })

  it('snaps to the nearest step, ties to the smaller', () => {
    expect(nearestStep(12)).toBe('xs')
    expect(nearestStep(14)).toBe('xs')
    expect(nearestStep(18)).toBe('sm')
    expect(nearestStep(100)).toBe('lg')
  })

  it('resolves wrapper steps with a 1px floor', () => {
    expect(resolveSizeStep('md')).toBe('md')
    expect(resolveSizeStep(14)).toBe('xs')
    expect(resolveSizeStep(0)).toBe('xs')
    expect(resolveSizeStep(Number.NaN)).toBe('sm')
  })

  it('lerps to a tenth, floored at zero', () => {
    expect(lerp(11, 13, 0.5)).toBe(12)
    expect(lerp(80, 112, -2.75)).toBe(0)
  })

  it('resolves fonts for names, hits, interpolation, and extrapolation', () => {
    expect(resolveFontPx('sm')).toBe(13)
    expect(resolveFontPx(16)).toBe(13)
    expect(resolveFontPx(14)).toBe(12)
    expect(resolveFontPx(19)).toBe(14.5)
    expect(resolveFontPx(0)).toBe(5.5)
    expect(resolveFontPx(Number.NaN)).toBe(13)
  })
})
