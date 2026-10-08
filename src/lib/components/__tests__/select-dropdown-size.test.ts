import { describe, expect, it } from 'vitest'
import { dimensionMetrics } from '../size-metrics'
import { SELECT_RATIOS, resolveSelectStep } from '../select-dropdown-styles'

describe('SelectDropdown size metrics', () => {
  it('scales every metric by one constant ratio of the size', () => {
    expect(dimensionMetrics('sm', SELECT_RATIOS)).toEqual({
      font: 13,
      padX: 12,
      padY: 8,
      minW: 112,
      gap: 6,
      icon: 16,
    })
    for (const px of [12, 16, 20, 24]) {
      const m = dimensionMetrics(px, SELECT_RATIOS)
      expect(m.font / px).toBeCloseTo(0.8125)
      expect(m.padX / px).toBeCloseTo(0.75)
      expect(m.padY / px).toBeCloseTo(0.5)
      expect(m.minW / px).toBeCloseTo(7)
      expect(m.gap / px).toBeCloseTo(0.375)
      expect(m.icon / px).toBeCloseTo(1)
    }
  })

  it('passes names through and snaps numbers for the stepped wrapper', () => {
    expect(resolveSelectStep('md')).toBe('md')
    expect(resolveSelectStep(14)).toBe('xs')
    expect(resolveSelectStep(Number.NaN)).toBe('sm')
  })
})
