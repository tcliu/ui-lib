import { describe, expect, it } from 'vitest'
import { dimensionMetrics } from './size-metrics'
import { SELECT_RATIOS, SELECT_TRIGGER_UTILITIES } from './select-dropdown-styles'
import { INPUT_LEADING, INPUT_RATIOS } from './input-chrome'
import { withLine } from './text-input-metrics'

describe('SelectDropdown size metrics', () => {
  it('scales every metric by one constant ratio of the size', () => {
    expect(dimensionMetrics('sm', SELECT_RATIOS)).toEqual({
      font: 14 * INPUT_RATIOS.font,
      padX: 14 * INPUT_RATIOS.padX,
      padY: 14 * INPUT_RATIOS.padY,
      chevronGap: 14 * SELECT_RATIOS.chevronGap,
      chevronTextGap: 14 * SELECT_RATIOS.chevronTextGap,
      minW: 98,
      gap: 5.25,
      icon: 14,
      radius: 14 * INPUT_RATIOS.radius,
      optionGap: 7,
      optionRadius: 5.25,
      panelPad: 3.5,
      panelRadius: 7,
    })
    for (const px of [12, 14, 16, 18, 20]) {
      const m = dimensionMetrics(px, SELECT_RATIOS)
      expect(m.font / px).toBeCloseTo(INPUT_RATIOS.font)
      expect(m.padX / px).toBeCloseTo(INPUT_RATIOS.padX)
      expect(m.padY / px).toBeCloseTo(INPUT_RATIOS.padY)
      expect(m.chevronGap / px).toBeCloseTo(SELECT_RATIOS.chevronGap)
      expect(m.chevronTextGap / px).toBeCloseTo(SELECT_RATIOS.chevronTextGap)
      expect(m.minW / px).toBeCloseTo(7)
      expect(m.gap / px).toBeCloseTo(0.375)
      expect(m.icon / px).toBeCloseTo(1)
      expect(m.radius / px).toBeCloseTo(INPUT_RATIOS.radius)
      expect(m.optionGap / px).toBeCloseTo(0.5)
      expect(m.optionRadius / px).toBeCloseTo(0.375)
      expect(m.panelPad / px).toBeCloseTo(0.25)
      expect(m.panelRadius / px).toBeCloseTo(0.5)
    }
  })

  // The chevron's right gutter is its own size ratio, independent of the text
  // padding, so the marker's inset can be tuned without moving the label.
  it('keeps the chevron gutters their own size ratios', () => {
    expect(SELECT_RATIOS).not.toHaveProperty('chevronInset')
    expect(SELECT_RATIOS.chevronGap).toBeGreaterThan(0)
    expect(SELECT_RATIOS.chevronTextGap).toBeGreaterThan(0)
    expect(SELECT_TRIGGER_UTILITIES).toContain('pl-[var(--input-pad-x)] pr-[var(--sel-chevron-gap)]')
  })

  // A trigger and a text field share a row, so their text lines and boxes must
  // match: the select box takes the input chrome's font and both paddings and
  // derives its line from that font, so the trigger (and every option row
  // sharing that box) lands on exactly the `TextInput` box height and text inset
  // at every size. Pinning the equality keeps a padding tweak on either side
  // from silently splitting them.
  it('matches the input chrome box exactly', () => {
    expect(SELECT_RATIOS.font).toBe(INPUT_RATIOS.font)
    expect(SELECT_RATIOS.font * INPUT_LEADING).toBe(INPUT_RATIOS.line)
    expect(SELECT_RATIOS.padX).toBe(INPUT_RATIOS.padX)
    expect(SELECT_RATIOS.padY).toBe(INPUT_RATIOS.padY)
    for (const px of [12, 14, 16, 18, 20]) {
      const input = dimensionMetrics(px, INPUT_RATIOS)
      const select = dimensionMetrics(px, withLine(SELECT_RATIOS))
      // Both boxes carry the same 1px border, so equal line + padding is equal
      // height.
      expect(select.line + 2 * select.padY).toBeCloseTo(input.line + 2 * input.padY)
    }
  })
})
