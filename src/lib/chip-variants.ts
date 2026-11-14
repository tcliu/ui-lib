// Named chip colors and appearances, shared by `Chip` and `TagInput` so a
// caller picks a token instead of hand-writing palette utilities. Every class
// is a literal palette utility, so the `[data-theme]` remaps in `styles.css`
// apply; the pill frame (rounding and 1px border) belongs to the variant here.

export type ChipColor =
  | 'cyan'
  | 'sky'
  | 'violet'
  | 'amber'
  | 'fuchsia'
  | 'emerald'
  | 'rose'
  | 'neutral'

export type ChipAppearance = 'soft' | 'solid' | 'outline'

export const CHIP_COLORS: readonly ChipColor[] = [
  'cyan',
  'sky',
  'violet',
  'amber',
  'fuchsia',
  'emerald',
  'rose',
  'neutral',
]

export const CHIP_APPEARANCES: readonly ChipAppearance[] = ['soft', 'solid', 'outline']

const SOFT: Record<ChipColor, string> = {
  cyan: 'border-cyan-700/60 bg-cyan-500/15 text-cyan-200',
  sky: 'border-sky-700/60 bg-sky-500/15 text-sky-200',
  violet: 'border-violet-700/60 bg-violet-500/15 text-violet-200',
  amber: 'border-amber-700/60 bg-amber-500/15 text-amber-200',
  fuchsia: 'border-fuchsia-700/60 bg-fuchsia-500/15 text-fuchsia-200',
  emerald: 'border-emerald-700/60 bg-emerald-500/15 text-emerald-200',
  rose: 'border-rose-700/60 bg-rose-500/15 text-rose-200',
  neutral: 'border-slate-600 bg-slate-500/15 text-slate-200',
}

// A vivid fill takes the fixed `text-onaccent` ink, never a remapped grade.
const SOLID: Record<ChipColor, string> = {
  cyan: 'border-cyan-500 bg-cyan-500 text-onaccent',
  sky: 'border-sky-500 bg-sky-500 text-onaccent',
  violet: 'border-violet-500 bg-violet-500 text-onaccent',
  amber: 'border-amber-500 bg-amber-500 text-onaccent',
  fuchsia: 'border-fuchsia-500 bg-fuchsia-500 text-onaccent',
  emerald: 'border-emerald-500 bg-emerald-500 text-onaccent',
  rose: 'border-rose-500 bg-rose-500 text-onaccent',
  neutral: 'border-slate-500 bg-slate-600 text-onaccent',
}

const OUTLINE: Record<ChipColor, string> = {
  cyan: 'border-cyan-500/70 bg-transparent text-cyan-200',
  sky: 'border-sky-500/70 bg-transparent text-sky-200',
  violet: 'border-violet-500/70 bg-transparent text-violet-200',
  amber: 'border-amber-500/70 bg-transparent text-amber-200',
  fuchsia: 'border-fuchsia-500/70 bg-transparent text-fuchsia-200',
  emerald: 'border-emerald-500/70 bg-transparent text-emerald-200',
  rose: 'border-rose-500/70 bg-transparent text-rose-200',
  neutral: 'border-slate-500/70 bg-transparent text-slate-200',
}

const APPEARANCES: Record<ChipAppearance, Record<ChipColor, string>> = {
  soft: SOFT,
  solid: SOLID,
  outline: OUTLINE,
}

// The color-only class set, for callers that already own the pill frame.
export function chipColorClass(color: ChipColor, appearance: ChipAppearance = 'soft'): string {
  return APPEARANCES[appearance][color]
}

// The complete pill class: frame plus color, the shape the named variant owns.
export function chipVariantClass(color: ChipColor = 'cyan', appearance: ChipAppearance = 'soft'): string {
  return `rounded-full border ${chipColorClass(color, appearance)}`
}
