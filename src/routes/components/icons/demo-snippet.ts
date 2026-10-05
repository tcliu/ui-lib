// Show-code source for the Icons demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface IconsSnippetState {
  size: string
  tint: string
  className: string
}

export interface IconEntry {
  name: string
  variant?: 'outline' | 'solid'
}

export const ICON_SIZES: Record<string, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

// One entry per glyph. The up/down chevrons appear twice so the gallery shows
// the default outline stroke alongside the solid fill variant.
export const ICON_ENTRIES: IconEntry[] = [
  { name: 'Check' },
  { name: 'ChevronDown' },
  { name: 'ChevronDown', variant: 'solid' },
  { name: 'ChevronLeft' },
  { name: 'ChevronRight' },
  { name: 'ChevronUp' },
  { name: 'ChevronUp', variant: 'solid' },
  { name: 'Close' },
  { name: 'Code' },
  { name: 'Columns' },
  { name: 'Copy' },
  { name: 'Delete' },
  { name: 'Eye' },
  { name: 'EyeSlash' },
  { name: 'Forest' },
  { name: 'Globe' },
  { name: 'Kebab' },
  { name: 'Menu' },
  { name: 'Palette' },
  { name: 'Plus' },
  { name: 'Refresh' },
  { name: 'Reset' },
  { name: 'Save' },
  { name: 'Search' },
  { name: 'Settings' },
  { name: 'SortAsc' },
  { name: 'SortDesc' },
]

export function iconClassFor(tint: string, className: string): string {
  return [tint, className].filter(Boolean).join(' ')
}

export function iconLabel(entry: IconEntry): string {
  return entry.variant === 'solid' ? `${entry.name}Solid` : entry.name
}

export function buildIconsSnippet({ size, tint, className }: IconsSnippetState): string {
  const classes = iconClassFor(tint, className)
  const attrs = [...(size ? [` size="${size}"`] : []), ...(classes ? [` className="${classes}"`] : [])].join('')
  const lines = [
    '<div class="grid grid-cols-4 gap-3 sm:grid-cols-8">',
    ...ICON_ENTRIES.map(entry => {
      const variant = entry.variant ? ` variant="${entry.variant}"` : ''
      return `  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><${entry.name}Icon${variant}${attrs} />${iconLabel(entry)}</span>`
    }),
    '</div>',
  ]
  return lines.join('\n')
}
