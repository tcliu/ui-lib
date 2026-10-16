import { describe, expect, it } from 'vitest'
import { dimensionMetrics } from '../size-metrics'
import { SELECT_RATIOS } from '../select-dropdown-styles'
import { INPUT_RATIOS } from '../input-chrome'

describe('SelectDropdown size metrics', () => {
  it('scales every metric by one constant ratio of the size', () => {
    expect(dimensionMetrics('sm', SELECT_RATIOS)).toEqual({
      font: 11.375,
      line: 16.625,
      padX: 10.5,
      padY: 6.125,
      minW: 98,
      gap: 5.25,
      icon: 14,
      chevronInset: 5.25,
    })
    for (const px of [12, 14, 16, 18, 20]) {
      const m = dimensionMetrics(px, SELECT_RATIOS)
      expect(m.font / px).toBeCloseTo(0.8125)
      expect(m.line / px).toBeCloseTo(1.1875)
      expect(m.padX / px).toBeCloseTo(0.75)
      expect(m.padY / px).toBeCloseTo(0.4375)
      expect(m.minW / px).toBeCloseTo(7)
      expect(m.gap / px).toBeCloseTo(0.375)
      expect(m.icon / px).toBeCloseTo(1)
      expect(m.chevronInset / px).toBeCloseTo(0.375)
    }
  })

  // A trigger and a text field share a row, so the two boxes must measure the
  // same at every size (the 1px border is shared too). Pinning the line/padY
  // ratios keeps a padding tweak from silently breaking that alignment.
  it('keeps the trigger box the same height as the input chrome', () => {
    for (const px of [12, 14, 16, 18, 20]) {
      const input = dimensionMetrics(px, INPUT_RATIOS)
      const select = dimensionMetrics(px, SELECT_RATIOS)
      expect(input.line + 2 * input.padY).toBeCloseTo(select.line + 2 * select.padY)
    }
  })
})
