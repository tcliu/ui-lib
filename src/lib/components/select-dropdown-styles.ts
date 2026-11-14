import { FIELD_RATIOS } from './input-chrome'

// Numeric sizes are positions on the shared scale (`$lib/size-scale`): names
// are aliases for its steps and every metric below interpolates from the
// dimension, so nothing below is keyed on a size name.

// Every metric is a fixed ratio of the size dimension (the icon is the
// dimension itself), so each keeps a constant metric:dimension ratio across the
// range. The min-width floors every surface so an empty query cannot collapse
// the trigger. Font and both paddings are the text field's own ratios
// (`FIELD_RATIOS`) rather than tuned beside them, and the line box derives from
// the font at the trigger, so a trigger — and the option rows sharing this box —
// land on the same box height and the same text inset as `TextInput` at every
// size, and the two can never drift apart.
export const SELECT_RATIOS = {
  font: FIELD_RATIOS.font,
  padX: FIELD_RATIOS.padX,
  padY: FIELD_RATIOS.padY,
  // The chevron's own right gutter (chevron → border), deliberately independent
  // of the text padding: the marker sits closer to the border than the label's
  // `padX` inset, and a padding retune leaves it where it is.
  chevronGap: 0.4,
  minW: 7,
  gap: 0.375,
  icon: 1,
}

export type SelectRatios = typeof SELECT_RATIOS
// A caller's override is partial: omitted keys keep the shared defaults.
export type SelectRatioOverrides = Partial<SelectRatios>

// The var-driven box metrics shared by the trigger boxes, the option rows, and
// the empty row; the element's inline style carries the values.
export const SELECT_BOX_UTILITIES =
  'min-w-[var(--sel-min-w)] text-[length:var(--sel-font)] leading-[var(--sel-line)] py-[var(--sel-pad-y)] px-[var(--sel-pad-x)]'

// The trigger box shares the box metrics but carries an asymmetric right
// padding: the chevron sits inside its own gutter, published as
// `--sel-chevron-gap` from `SELECT_RATIOS.chevronGap`, so the marker's inset is
// tuned independently of the label's `padX` inset.
export const SELECT_TRIGGER_UTILITIES =
  'min-w-[var(--sel-min-w)] text-[length:var(--sel-font)] leading-[var(--sel-line)] py-[var(--sel-pad-y)] pl-[var(--sel-pad-x)] pr-[var(--sel-chevron-gap)]'

// Default floating panel chrome; a `panelClass` override replaces it. The
// per-size min-width lives on the trigger and option rows (see
// `SELECT_BOX_UTILITIES`), because the positioner floors the panel root to the
// trigger width via inline style.
export const DEFAULT_PANEL_CLASS =
  'w-max max-w-xs max-h-[min(50vh,20rem)] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/95 p-1 shadow-2xl shadow-slate-950/60 backdrop-blur'

// One box class for both trigger variants: the border, surface, padding, and
// chevron inset are identical whether the box holds a button or the filterable
// input, so the two render the same. The filterable box is a `label` so a click
// anywhere in the padding forwards to the input natively instead of adding a
// click handler to a non-interactive element. Only the focus trigger differs
// (the input is focused indirectly through the box). Hover tints the border
// while keyboard focus draws a ring with the border transparent, so a hovered
// trigger and the focused trigger are never mistaken for each other — a
// pointer can hover one while focus sits on another.
const TRIGGER_LAYOUT =
  'inline-flex cursor-pointer items-center justify-between gap-2 text-left outline-none transition motion-reduce:transition-none'
export const TRIGGER_BASE = `${TRIGGER_LAYOUT} rounded-md border border-slate-700 bg-slate-950 text-slate-100 hover:border-cyan-500`
// The bordered surface without its outline: the surface and text rules stay,
// while the border, its hover tint, and its focus color drop, for a trigger
// that sits inside a caller-owned row without drawing a second box.
export const TRIGGER_NO_OUTLINE = `${TRIGGER_LAYOUT} bg-slate-950 text-slate-100`
// The chrome of a trigger embedded in another surface (a toolbar, a table
// cell): the container owns the border, surface, and focus ring, so the
// trigger drops all three and leaves the text rules to its context, like the
// shared embedded text field.
export const TRIGGER_EMBEDDED = `${TRIGGER_LAYOUT} bg-transparent`
export const OPTION_BASE =
  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md text-left outline-none transition-none max-phone:min-h-11'
export const EMPTY_BASE = 'text-slate-400'
