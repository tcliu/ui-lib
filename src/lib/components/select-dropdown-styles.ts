import { resolveSizeStep, type SizeInput } from '$lib/size-scale'

// Numeric sizes are positions on the shared scale (`$lib/size-scale`): names
// are aliases for its steps and any size interpolates between them, so nothing
// below is keyed on a size name.
export type SelectSize = SizeInput

// Nearest named step for wrappers that keep stepped chrome while forwarding the
// raw size to an inner interpolating component (e.g. Pagination's page-size
// dropdown). Canonical implementation lives in `$lib/size-scale`.
export const resolveSelectStep = resolveSizeStep

// Every metric is a fixed ratio of the size dimension (the icon is the
// dimension itself), so each keeps a constant metric:dimension ratio across the
// range. The min-width floors every surface so an empty query cannot collapse
// the trigger.
export const SELECT_RATIOS = {
  font: 0.8125,
  padX: 0.75,
  padY: 0.5,
  minW: 7,
  gap: 0.375,
  icon: 1,
}

// The var-driven box metrics shared by the trigger boxes, the option rows, and
// the empty row; the element's inline style carries the values.
export const SELECT_BOX_UTILITIES =
  'min-w-[var(--sel-min-w)] text-[length:var(--sel-font)] py-[var(--sel-pad-y)] px-[var(--sel-pad-x)]'

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
export const TRIGGER_BASE =
  'inline-flex cursor-pointer items-center justify-between gap-2 rounded-md border border-slate-700 bg-slate-950 text-left text-slate-100 outline-none transition motion-reduce:transition-none hover:border-cyan-500'
export const OPTION_BASE =
  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md text-left outline-none transition-none max-[27.999rem]:min-h-11'
export const EMPTY_BASE = 'text-slate-400'
