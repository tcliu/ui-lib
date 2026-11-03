// The date input's presentation contract: the metric ratios that scale its
// field and calendar, and the per-part color overrides that theme them. The
// date/time helpers stay in `date-input-core.ts` (the domain), so the utils
// carry no presentation and the dependency flow stays one-way.
import { INPUT_RATIOS } from './input-chrome'

// Optional per-part color overrides so an app can theme the field without
// forking it: each value replaces the default color classes for that part while
// the structural classes (layout, size, focus ring) stay fixed. Omitted keys
// keep the app's palette, so the default render is unchanged. Shared by every
// field of the input (a range pair themes both ends).
export interface DateInputTheme {
  /** Prev/next month buttons (default `text-slate-400 hover:bg-slate-800 hover:text-cyan-300`). */
  navButton?: string
  /** Weekday column headers (default `text-slate-500`). */
  columnHeader?: string
  /** Today's day button (default `text-cyan-300`). */
  today?: string
  /** Footer summary text (default `text-slate-500`). */
  metaText?: string
  /** The days between the range ends (default `bg-cyan-500/15 text-cyan-100`). */
  rangeSpan?: string
}

// Every metric is a fixed ratio of the size dimension. The panel metrics are
// calibrated so the default `md` reproduces the original 17rem panel with 32px
// day cells, and the in-field calendar affordance reuses the panel's own
// padding, icon box, and gap for its gutter. `radius` is the calendar's corner.
// The field (the shared `TextInput`) carries its own `--input-*` set; the field
// gutter and the panel both read this set from the `DateInput` root, so one
// `--pick-*` set serves them.
export const PICKER_RATIOS = {
  font: INPUT_RATIOS.font,
  radius: 0.375,
  padX: INPUT_RATIOS.padX,
  padY: INPUT_RATIOS.padY,
  gap: 0.5,
  icon: 0.875,
  panelWidth: 17,
  panelRadius: 0.5,
  panelPad: 0.5,
  blockGap: 0.375,
  tightGap: 0.25,
  navSize: 1.75,
  smFont: 0.75,
  headFont: 0.625,
  tightPadY: 0.125,
  cellSize: 2,
}

export type PickerRatios = typeof PICKER_RATIOS
// A caller's override is partial: omitted keys keep the shared defaults.
export type PickerRatioOverrides = Partial<PickerRatios>
