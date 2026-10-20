// Chart tone palette. Each tone maps to complete literal utility classes, so
// Tailwind's scanner generates them and `[data-theme]` palette remaps apply —
// no literal hex and no per-component theme conditionals. A segment wears its
// muted `fill` at rest (and on the legend swatch); the vivid `hover` class
// brightens it while its column is hovered.

export type ChartTone = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate'

// Order a segment's default tone cycles through when it names none, so a
// stacked column reads as distinct series.
export const CHART_TONES: readonly ChartTone[] = ['cyan', 'violet', 'emerald', 'amber', 'rose', 'sky', 'slate']

export interface ToneClasses {
  // Muted fill at rest and on the legend swatch.
  fill: string
  // Vivid fill the segment brightens to while its column is hovered.
  hover: string
}

export const TONE_CLASS: Record<ChartTone, ToneClasses> = {
  cyan: { fill: 'bg-cyan-500/60', hover: 'group-hover:bg-cyan-500' },
  violet: { fill: 'bg-violet-500/60', hover: 'group-hover:bg-violet-500' },
  emerald: { fill: 'bg-emerald-500/60', hover: 'group-hover:bg-emerald-500' },
  amber: { fill: 'bg-amber-500/60', hover: 'group-hover:bg-amber-500' },
  rose: { fill: 'bg-rose-500/60', hover: 'group-hover:bg-rose-500' },
  sky: { fill: 'bg-sky-500/60', hover: 'group-hover:bg-sky-500' },
  slate: { fill: 'bg-slate-500/60', hover: 'group-hover:bg-slate-500' },
}
