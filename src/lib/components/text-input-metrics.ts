import type { SizeInput } from '#lib/size-scale.js'
import { FIELD_RATIOS, INPUT_LEADING } from './input-chrome'
import { dimensionMetrics } from './size-metrics'

// The clear affordance's own metrics, shared by every control that renders the
// shared clear cross (the text field, and a composite such as a tag row that
// overlays the same cross on its own container edge): the trimmed button, the
// slot it occupies, and the gutter reserved for it. A field's inset derives
// from its own `padX`, so it is not part of the set.
export const CLEAR_RATIOS = {
  clearButton: 0.625,
  clearGutter: 1.6875,
  clearBox: 1,
}

export type ClearRatios = typeof CLEAR_RATIOS

// One ratio set for the whole field: the tunable text metrics every field
// shares (`FIELD_RATIOS`), the clear affordance's own metrics, and the outside
// row's gap. Every metric is a fixed ratio of the size dimension, so the whole
// field scales from one object; `TextInput`'s `ratios` prop merges a caller's
// partial override over it. Two metrics derive from their base rather than
// sitting in the set: the line box follows `font` through `INPUT_LEADING` (so a
// font change carries the field height with it), and the clear cross's inset
// follows `padX` (so a padding change carries the cross instead of shifting it
// by a constant).
export const TEXT_INPUT_RATIOS = {
  ...FIELD_RATIOS,
  ...CLEAR_RATIOS,
  trailerGap: 0.375,
}

export type TextInputRatios = typeof TEXT_INPUT_RATIOS

// A caller's override is partial: omitted keys keep the shared defaults.
export type TextInputRatioOverrides = Partial<TextInputRatios>

// A resolved set with its line box merged in, derived from its own font. Every
// field, trigger, tag row, and picker calls this instead of re-deriving the
// leading, so one font retune moves every row's height together and no set
// carries the line box as a key.
export function withLine<R extends { font: number }>(ratios: R): R & { line: number } {
  return { ...ratios, line: ratios.font * INPUT_LEADING }
}

// The resolved clear affordance for one field: the trimmed button, the slot it
// occupies, the gutter reserved for it, and the inset derived from the field's
// own horizontal padding. A control that overlays the shared cross on its own
// edge reads this instead of re-keying the set.
export function resolveClearMetrics(size: SizeInput, padX: number, ratios: ClearRatios) {
  return dimensionMetrics(size, {
    button: ratios.clearButton,
    inset: padX,
    gutter: ratios.clearGutter,
    box: ratios.clearBox,
  })
}

// The subset a composing field forwards to its inner `TextInput`: every key of
// the shared field set the composite's own set carries, so one object tunes the
// field and its adornment together. Keys the composite does not render stay
// absent (a set with no trailer row forwards no trailer gap), and reading the
// key list from `TEXT_INPUT_RATIOS` keeps a new field metric from being
// silently dropped by a hand-copied list.
export function fieldOverrides(ratios: Partial<TextInputRatios>): TextInputRatioOverrides {
  const overrides: TextInputRatioOverrides = {}
  for (const key of Object.keys(TEXT_INPUT_RATIOS) as (keyof TextInputRatios)[]) {
    const value = ratios[key]
    if (value !== undefined) {
      overrides[key] = value
    }
  }
  return overrides
}
