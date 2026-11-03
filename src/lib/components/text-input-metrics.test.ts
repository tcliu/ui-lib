import { describe, expect, it } from 'vitest'
import { INPUT_LEADING } from './input-chrome'
import { TEXT_INPUT_RATIOS, fieldOverrides, withLine } from './text-input-metrics'

describe('withLine', () => {
  it('merges the font-derived line box without disturbing the other keys', () => {
    const resolved = withLine({ font: 0.5, padX: 0.75, icon: 2 })
    expect(resolved).toEqual({ font: 0.5, padX: 0.75, icon: 2, line: 0.5 * INPUT_LEADING })
  })

  it('carries a caller font override into the line', () => {
    expect(withLine({ font: 0.25 }).line).toBeCloseTo(0.25 * INPUT_LEADING)
  })
})

describe('fieldOverrides', () => {
  it('keeps every shared field key the composite carries', () => {
    const passwordSet = { ...TEXT_INPUT_RATIOS, stepperIcon: 1, minW: 9 }
    expect(fieldOverrides(passwordSet)).toEqual(TEXT_INPUT_RATIOS)
  })

  it('drops non-field keys and keys the composite does not render', () => {
    // A picker-style set: no clear affordance and no trailer row.
    const pickerSet = { font: 0.5, padX: 0.75, navSize: 2, panelWidth: 10 }
    expect(fieldOverrides(pickerSet)).toEqual({ font: 0.5, padX: 0.75 })
  })

  it('skips an explicitly undefined value instead of forwarding it', () => {
    const overrides = fieldOverrides({ font: 0.5, padY: undefined })
    expect(overrides).toEqual({ font: 0.5 })
  })
})
