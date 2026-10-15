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
import CloudIcon from '$lib/icons/CloudIcon.svelte'
import CodeIcon from '$lib/icons/CodeIcon.svelte'
import ColumnsIcon from '$lib/icons/ColumnsIcon.svelte'
import CopyIcon from '$lib/icons/CopyIcon.svelte'
import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
import DocumentIcon from '$lib/icons/DocumentIcon.svelte'
import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
import ExportIcon from '$lib/icons/ExportIcon.svelte'
import EyeIcon from '$lib/icons/EyeIcon.svelte'
import EyeSlashIcon from '$lib/icons/EyeSlashIcon.svelte'
import FireIcon from '$lib/icons/FireIcon.svelte'
import ForestIcon from '$lib/icons/ForestIcon.svelte'
import GlobeIcon from '$lib/icons/GlobeIcon.svelte'
import InfoIcon from '$lib/icons/InfoIcon.svelte'
import KebabIcon from '$lib/icons/KebabIcon.svelte'
import LavenderIcon from '$lib/icons/LavenderIcon.svelte'
import LightBulbIcon from '$lib/icons/LightBulbIcon.svelte'
import MenuIcon from '$lib/icons/MenuIcon.svelte'
import MidnightIcon from '$lib/icons/MidnightIcon.svelte'
import MintIcon from '$lib/icons/MintIcon.svelte'
import MoonIcon from '$lib/icons/MoonIcon.svelte'
import PaletteIcon from '$lib/icons/PaletteIcon.svelte'
import PlusIcon from '$lib/icons/PlusIcon.svelte'
import RefreshIcon from '$lib/icons/RefreshIcon.svelte'
import ResetIcon from '$lib/icons/ResetIcon.svelte'
import SaveIcon from '$lib/icons/SaveIcon.svelte'
import SearchIcon from '$lib/icons/SearchIcon.svelte'
import SettingsIcon from '$lib/icons/SettingsIcon.svelte'
import SignOutIcon from '$lib/icons/SignOutIcon.svelte'
import SortAscIcon from '$lib/icons/SortAscIcon.svelte'
import SortDescIcon from '$lib/icons/SortDescIcon.svelte'
import SparklesIcon from '$lib/icons/SparklesIcon.svelte'
import SunIcon from '$lib/icons/SunIcon.svelte'
import UploadIcon from '$lib/icons/UploadIcon.svelte'

export interface IconsSnippetState {
  size: string
  sizeOn: boolean
  tint: string
  className: string
  classNameOn: boolean
}

export interface IconEntry {
  name: string
}

// One entry per glyph.
export const ICON_ENTRIES: IconEntry[] = [
  { name: 'Check' },
  { name: 'ChevronDown' },
  { name: 'ChevronLeft' },
  { name: 'ChevronRight' },
  { name: 'ChevronUp' },
  { name: 'Close' },
  { name: 'Cloud' },
  { name: 'Code' },
  { name: 'Columns' },
  { name: 'Copy' },
  { name: 'Delete' },
  { name: 'Document' },
  { name: 'Download' },
  { name: 'Export' },
  { name: 'Eye' },
  { name: 'EyeSlash' },
  { name: 'Fire' },
  { name: 'Forest' },
  { name: 'Globe' },
  { name: 'Info' },
  { name: 'Kebab' },
  { name: 'Lavender' },
  { name: 'LightBulb' },
  { name: 'Menu' },
  { name: 'Midnight' },
  { name: 'Mint' },
  { name: 'Moon' },
  { name: 'Palette' },
  { name: 'Plus' },
  { name: 'Refresh' },
  { name: 'Reset' },
  { name: 'Save' },
  { name: 'Search' },
  { name: 'Settings' },
  { name: 'SignOut' },
  { name: 'SortAsc' },
  { name: 'SortDesc' },
  { name: 'Sparkles' },
  { name: 'Sun' },
  { name: 'Upload' },
]

export function iconClassFor(tint: string, className: string): string {
  return [tint, className].filter(Boolean).join(' ')
}

export function iconLabel(entry: IconEntry): string {
  return entry.name
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
  Cloud: CloudIcon,
  Code: CodeIcon,
  Columns: ColumnsIcon,
  Copy: CopyIcon,
  Delete: DeleteIcon,
  Document: DocumentIcon,
  Download: DownloadIcon,
  Export: ExportIcon,
  Eye: EyeIcon,
  EyeSlash: EyeSlashIcon,
  Fire: FireIcon,
  Forest: ForestIcon,
  Globe: GlobeIcon,
  Info: InfoIcon,
  Kebab: KebabIcon,
  Lavender: LavenderIcon,
  LightBulb: LightBulbIcon,
  Menu: MenuIcon,
  Midnight: MidnightIcon,
  Mint: MintIcon,
  Moon: MoonIcon,
  Palette: PaletteIcon,
  Plus: PlusIcon,
  Refresh: RefreshIcon,
  Reset: ResetIcon,
  Save: SaveIcon,
  Search: SearchIcon,
  Settings: SettingsIcon,
  SignOut: SignOutIcon,
  SortAsc: SortAscIcon,
  SortDesc: SortDescIcon,
  Sparkles: SparklesIcon,
  Sun: SunIcon,
  Upload: UploadIcon,
}

export function buildIconsSnippet({ size, sizeOn, tint, className, classNameOn }: IconsSnippetState): string {
  const classes = iconClassFor(tint, classNameOn ? className : '')
  // The size Value prefills the component default; the builder omits it so
  // Show-code stays minimal.
  const sizeFragment = sizeOn && size !== '' && size !== 'md' ? sizeAttributeFragment(size) : ''
  const attrs = [sizeFragment, ...(classes ? [` className="${classes}"`] : [])].join('')
  const lines = [
    '<div class="grid grid-cols-4 gap-3 text-xs text-slate-400 sm:grid-cols-8 [&>span]:flex [&>span]:flex-col [&>span]:items-center [&>span]:gap-1">',
    ...ICON_ENTRIES.map(entry => {
      return `  <span><${entry.name}Icon${attrs} />${iconLabel(entry)}</span>`
    }),
    '</div>',
  ]
  return lines.join('\n')
}
