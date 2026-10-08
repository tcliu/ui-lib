// Show-code source for the Icons demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import type { Component } from 'svelte'
import { sizeAttributeFragment } from '$lib/showcase/size-input'
import CheckIcon from '$lib/icons/CheckIcon.svelte'
import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte'
import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte'
import ChevronRightIcon from '$lib/icons/ChevronRightIcon.svelte'
import ChevronUpIcon from '$lib/icons/ChevronUpIcon.svelte'
import CloseIcon from '$lib/icons/CloseIcon.svelte'
import CodeIcon from '$lib/icons/CodeIcon.svelte'
import ColumnsIcon from '$lib/icons/ColumnsIcon.svelte'
import CopyIcon from '$lib/icons/CopyIcon.svelte'
import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
import EyeIcon from '$lib/icons/EyeIcon.svelte'
import EyeSlashIcon from '$lib/icons/EyeSlashIcon.svelte'
import ForestIcon from '$lib/icons/ForestIcon.svelte'
import GlobeIcon from '$lib/icons/GlobeIcon.svelte'
import KebabIcon from '$lib/icons/KebabIcon.svelte'
import MenuIcon from '$lib/icons/MenuIcon.svelte'
import PaletteIcon from '$lib/icons/PaletteIcon.svelte'
import PlusIcon from '$lib/icons/PlusIcon.svelte'
import RefreshIcon from '$lib/icons/RefreshIcon.svelte'
import ResetIcon from '$lib/icons/ResetIcon.svelte'
import SaveIcon from '$lib/icons/SaveIcon.svelte'
import SearchIcon from '$lib/icons/SearchIcon.svelte'
import SettingsIcon from '$lib/icons/SettingsIcon.svelte'
import SortAscIcon from '$lib/icons/SortAscIcon.svelte'
import SortDescIcon from '$lib/icons/SortDescIcon.svelte'

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
  { name: 'Download' },
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

// One component per `ICON_ENTRIES.name`; the gallery and its parity test read
// this single map so a new glyph cannot ship without a component behind it.
export const ICON_COMPONENTS: Record<string, Component> = {
  Check: CheckIcon,
  ChevronDown: ChevronDownIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  ChevronUp: ChevronUpIcon,
  Close: CloseIcon,
  Code: CodeIcon,
  Columns: ColumnsIcon,
  Copy: CopyIcon,
  Delete: DeleteIcon,
  Download: DownloadIcon,
  Eye: EyeIcon,
  EyeSlash: EyeSlashIcon,
  Forest: ForestIcon,
  Globe: GlobeIcon,
  Kebab: KebabIcon,
  Menu: MenuIcon,
  Palette: PaletteIcon,
  Plus: PlusIcon,
  Refresh: RefreshIcon,
  Reset: ResetIcon,
  Save: SaveIcon,
  Search: SearchIcon,
  Settings: SettingsIcon,
  SortAsc: SortAscIcon,
  SortDesc: SortDescIcon,
}

export function buildIconsSnippet({ size, tint, className }: IconsSnippetState): string {
  const classes = iconClassFor(tint, className)
  const attrs = [sizeAttributeFragment(size), ...(classes ? [` className="${classes}"`] : [])].join('')
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
