import { describe, expect, it } from 'vitest'
import { dimensionMetrics } from './size-metrics'
import { SELECT_GUTTER_SHARE, SELECT_RATIOS, SELECT_TRIGGER_UTILITIES } from './select-dropdown-styles'
import { INPUT_RATIOS } from './input-chrome'

describe('SelectDropdown size metrics', () => {
  it('scales every metric by one constant ratio of the size', () => {
    expect(dimensionMetrics('sm', SELECT_RATIOS)).toEqual({
      font: 11.375,
      line: 16.625,
      padX: 14 * 0.5625,
      padY: 14 * 0.39375,
      minW: 98,
      gap: 5.25,
      icon: 14,
    })
    for (const px of [12, 14, 16, 18, 20]) {
      const m = dimensionMetrics(px, SELECT_RATIOS)
      expect(m.font / px).toBeCloseTo(0.8125)
      expect(m.line / px).toBeCloseTo(1.1875)
      expect(m.padX / px).toBeCloseTo(0.5625)
      expect(m.padY / px).toBeCloseTo(0.39375)
      expect(m.minW / px).toBeCloseTo(7)
      expect(m.gap / px).toBeCloseTo(0.375)
      expect(m.icon / px).toBeCloseTo(1)
    }
  })

  // The trigger's right gutter is derived from the horizontal padding, not
  // tuned beside it: a fixed, size-independent share of `padX`, published as a
  // calc over `--sel-pad-x` so retuning the padding (or a caller overriding the
  // var) carries the chevron's inset with it instead of shifting it by a
  // constant offset.
  it('derives the trigger gutter as a fixed share of the padding', () => {
    expect(SELECT_RATIOS).not.toHaveProperty('chevronInset')
    expect(SELECT_GUTTER_SHARE).toBeGreaterThan(0)
    expect(SELECT_GUTTER_SHARE).toBeLessThan(1)
    expect(SELECT_TRIGGER_UTILITIES).toContain('pl-[var(--sel-pad-x)] pr-[var(--sel-pad-right)]')
  })

  // A trigger and a text field share a row, so their text lines and boxes must
  // match: the select box takes the input chrome's font, line, and both
  // paddings, so the trigger (and every option row sharing that box) lands on
  // exactly the `TextInput` box height and text inset at every size. Pinning the
  // equality keeps a padding tweak on either side from silently splitting them.
  it('matches the input chrome box exactly', () => {
    expect(SELECT_RATIOS.font).toBe(INPUT_RATIOS.font)
    expect(SELECT_RATIOS.line).toBe(INPUT_RATIOS.line)
    expect(SELECT_RATIOS.padX).toBe(INPUT_RATIOS.padX)
    expect(SELECT_RATIOS.padY).toBe(INPUT_RATIOS.padY)
    for (const px of [12, 14, 16, 18, 20]) {
      const input = dimensionMetrics(px, INPUT_RATIOS)
      const select = dimensionMetrics(px, SELECT_RATIOS)
      // Both boxes carry the same 1px border, so equal line + padding is equal
      // height.
      expect(select.line + 2 * select.padY).toBeCloseTo(input.line + 2 * input.padY)
    }
  })
})
