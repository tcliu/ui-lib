import { describe, expect, it } from 'vitest'
import { EDITOR_RATIOS, editorMetrics } from './code-editor-styles'
import { SIZE_ORDER, SIZE_PX } from '#lib/size-scale.js'

describe('editorMetrics', () => {
  it('keeps every metric a constant ratio of the size', () => {
    for (const step of SIZE_ORDER) {
      const px = SIZE_PX[step]
      const metrics = editorMetrics(step)
      for (const key of Object.keys(EDITOR_RATIOS) as (keyof typeof EDITOR_RATIOS)[]) {
        expect(metrics[key] / px).toBeCloseTo(EDITOR_RATIOS[key])
      }
    }
  })

  it('reproduces the shipped md chrome', () => {
    // 14px font (`0.875rem`), the content's 12/16/8px padding, the 2px mark
    // radius, and the 8px frame radius.
    expect(editorMetrics('md')).toEqual({ font: 14, padY: 12, padX: 16, padLeft: 8, radius: 2, frameRadius: 8 })
  })

  it('accepts a numeric size', () => {
    expect(editorMetrics(22).font).toBeCloseTo(19.25)
  })
})
