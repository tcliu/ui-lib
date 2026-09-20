// Show-code source for the Icons demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface IconsSnippetState {
  size: string
  tint: string
  className: string
}

export const ICON_SIZES: Record<string, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}



export const ICON_NAMES = [
  'Check',
  'ChevronDown',
  'ChevronDownSmall',
  'ChevronLeft',
  'ChevronRight',
  'ChevronUpSmall',
  'Close',
  'Code',
  'Copy',
  'Delete',
  'Eye',
  'EyeSlash',
  'Forest',
  'Globe',
  'Kebab',
  'Menu',
  'Palette',
  'Plus',
  'Refresh',
  'Reset',
  'Save',
  'Search',
  'Settings',
  'SortAsc',
  'SortDesc',
]

export function iconClassFor(tint: string, className: string): string {
  return [tint, className].filter(Boolean).join(' ')
}

export function buildIconsSnippet({ size, tint, className }: IconsSnippetState): string {
  const classes = iconClassFor(tint, className)
  const attrs = [...(size ? [` size="${size}"`] : []), ...(classes ? [` className="${classes}"`] : [])].join('')
  const lines = [
    '<div class="grid grid-cols-4 gap-3 sm:grid-cols-8">',
    ...ICON_NAMES.map(
      name =>
        `  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><${name}Icon${attrs} />${name}</span>`
    ),
    '</div>',
  ]
  return lines.join('\n')
}
