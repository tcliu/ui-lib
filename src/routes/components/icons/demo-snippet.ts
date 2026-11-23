// Show-code source for the Icons demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import type { Component } from 'svelte'
import { escapeAttr } from '#showcase/playground/snippet-build.js'
import { sizeAttributeFragment } from '#showcase/playground/size-input.js'
import type { Staged } from '#showcase/playground/staged.js'
import { VARIANT_LADDERS } from '#lib/icons/icon-variants.js'
import AutoRefreshIcon from '#lib/icons/AutoRefreshIcon.svelte'
import BrowseIcon from '#lib/icons/BrowseIcon.svelte'
import CalendarIcon from '#lib/icons/CalendarIcon.svelte'
import CaretDownIcon from '#lib/icons/CaretDownIcon.svelte'
import CaretLeftIcon from '#lib/icons/CaretLeftIcon.svelte'
import CaretRightIcon from '#lib/icons/CaretRightIcon.svelte'
import CaretUpIcon from '#lib/icons/CaretUpIcon.svelte'
import CheckIcon from '#lib/icons/CheckIcon.svelte'
import ChevronDownIcon from '#lib/icons/ChevronDownIcon.svelte'
import ChevronLeftIcon from '#lib/icons/ChevronLeftIcon.svelte'
import ChevronRightIcon from '#lib/icons/ChevronRightIcon.svelte'
import ChevronUpIcon from '#lib/icons/ChevronUpIcon.svelte'
import CloseIcon from '#lib/icons/CloseIcon.svelte'
import CloudIcon from '#lib/icons/CloudIcon.svelte'
import CodeIcon from '#lib/icons/CodeIcon.svelte'
import CollapseIcon from '#lib/icons/CollapseIcon.svelte'
import ColumnsIcon from '#lib/icons/ColumnsIcon.svelte'
import CompareIcon from '#lib/icons/CompareIcon.svelte'
import CopyIcon from '#lib/icons/CopyIcon.svelte'
import DashboardIcon from '#lib/icons/DashboardIcon.svelte'
import DeleteIcon from '#lib/icons/DeleteIcon.svelte'
import DocumentIcon from '#lib/icons/DocumentIcon.svelte'
import DoubleChevronDownIcon from '#lib/icons/DoubleChevronDownIcon.svelte'
import DoubleChevronLeftIcon from '#lib/icons/DoubleChevronLeftIcon.svelte'
import DoubleChevronRightIcon from '#lib/icons/DoubleChevronRightIcon.svelte'
import DoubleChevronUpIcon from '#lib/icons/DoubleChevronUpIcon.svelte'
import DownloadIcon from '#lib/icons/DownloadIcon.svelte'
import EditIcon from '#lib/icons/EditIcon.svelte'
import ExpandIcon from '#lib/icons/ExpandIcon.svelte'
import ExportIcon from '#lib/icons/ExportIcon.svelte'
import ExternalLinkIcon from '#lib/icons/ExternalLinkIcon.svelte'
import EyeIcon from '#lib/icons/EyeIcon.svelte'
import EyeSlashIcon from '#lib/icons/EyeSlashIcon.svelte'
import FilterIcon from '#lib/icons/FilterIcon.svelte'
import FireIcon from '#lib/icons/FireIcon.svelte'
import FollowIcon from '#lib/icons/FollowIcon.svelte'
import ForestIcon from '#lib/icons/ForestIcon.svelte'
import FormatIcon from '#lib/icons/FormatIcon.svelte'
import GlobeIcon from '#lib/icons/GlobeIcon.svelte'
import GridIcon from '#lib/icons/GridIcon.svelte'
import HelpIcon from '#lib/icons/HelpIcon.svelte'
import HistoryIcon from '#lib/icons/HistoryIcon.svelte'
import InfoIcon from '#lib/icons/InfoIcon.svelte'
import KebabIcon from '#lib/icons/KebabIcon.svelte'
import LavenderIcon from '#lib/icons/LavenderIcon.svelte'
import LightBulbIcon from '#lib/icons/LightBulbIcon.svelte'
import LinkIcon from '#lib/icons/LinkIcon.svelte'
import ListIcon from '#lib/icons/ListIcon.svelte'
import LockIcon from '#lib/icons/LockIcon.svelte'
import MaximizeIcon from '#lib/icons/MaximizeIcon.svelte'
import MenuIcon from '#lib/icons/MenuIcon.svelte'
import MidnightIcon from '#lib/icons/MidnightIcon.svelte'
import MinimizeIcon from '#lib/icons/MinimizeIcon.svelte'
import MintIcon from '#lib/icons/MintIcon.svelte'
import MoonIcon from '#lib/icons/MoonIcon.svelte'
import PaletteIcon from '#lib/icons/PaletteIcon.svelte'
import PlusIcon from '#lib/icons/PlusIcon.svelte'
import ProfileIcon from '#lib/icons/ProfileIcon.svelte'
import RedoIcon from '#lib/icons/RedoIcon.svelte'
import RefreshIcon from '#lib/icons/RefreshIcon.svelte'
import ResetIcon from '#lib/icons/ResetIcon.svelte'
import RestoreIcon from '#lib/icons/RestoreIcon.svelte'
import SaveIcon from '#lib/icons/SaveIcon.svelte'
import SearchIcon from '#lib/icons/SearchIcon.svelte'
import SettingsIcon from '#lib/icons/SettingsIcon.svelte'
import ShareIcon from '#lib/icons/ShareIcon.svelte'
import SignOutIcon from '#lib/icons/SignOutIcon.svelte'
import SparklesIcon from '#lib/icons/SparklesIcon.svelte'
import SpeakerIcon from '#lib/icons/SpeakerIcon.svelte'
import StopIcon from '#lib/icons/StopIcon.svelte'
import SunIcon from '#lib/icons/SunIcon.svelte'
import TableIcon from '#lib/icons/TableIcon.svelte'
import TagsIcon from '#lib/icons/TagsIcon.svelte'
import TrimIcon from '#lib/icons/TrimIcon.svelte'
import UndoIcon from '#lib/icons/UndoIcon.svelte'
import UploadIcon from '#lib/icons/UploadIcon.svelte'

export interface IconsSnippetState {
  size: Staged<string>
  tint: string
  className: Staged<string>
  variant: Staged<string>
}

export interface IconEntry {
  name: string
}

// One entry per glyph; the list covers every `src/lib/icons` component, and the
// directory-parity spec in `demo-snippet.test.ts` fails when one is missing.
export const ICON_ENTRIES: IconEntry[] = [
  { name: 'AutoRefresh' },
  { name: 'Browse' },
  { name: 'Calendar' },
  { name: 'CaretDown' },
  { name: 'CaretLeft' },
  { name: 'CaretRight' },
  { name: 'CaretUp' },
  { name: 'Check' },
  { name: 'ChevronDown' },
  { name: 'ChevronLeft' },
  { name: 'ChevronRight' },
  { name: 'ChevronUp' },
  { name: 'Close' },
  { name: 'Cloud' },
  { name: 'Code' },
  { name: 'Collapse' },
  { name: 'Columns' },
  { name: 'Compare' },
  { name: 'Copy' },
  { name: 'Dashboard' },
  { name: 'Delete' },
  { name: 'Document' },
  { name: 'DoubleChevronDown' },
  { name: 'DoubleChevronLeft' },
  { name: 'DoubleChevronRight' },
  { name: 'DoubleChevronUp' },
  { name: 'Download' },
  { name: 'Edit' },
  { name: 'Expand' },
  { name: 'Export' },
  { name: 'ExternalLink' },
  { name: 'Eye' },
  { name: 'EyeSlash' },
  { name: 'Filter' },
  { name: 'Fire' },
  { name: 'Follow' },
  { name: 'Forest' },
  { name: 'Format' },
  { name: 'Globe' },
  { name: 'Grid' },
  { name: 'Help' },
  { name: 'History' },
  { name: 'Info' },
  { name: 'Kebab' },
  { name: 'Lavender' },
  { name: 'LightBulb' },
  { name: 'Link' },
  { name: 'List' },
  { name: 'Lock' },
  { name: 'Maximize' },
  { name: 'Menu' },
  { name: 'Midnight' },
  { name: 'Minimize' },
  { name: 'Mint' },
  { name: 'Moon' },
  { name: 'Palette' },
  { name: 'Plus' },
  { name: 'Profile' },
  { name: 'Redo' },
  { name: 'Refresh' },
  { name: 'Reset' },
  { name: 'Restore' },
  { name: 'Save' },
  { name: 'Search' },
  { name: 'Settings' },
  { name: 'Share' },
  { name: 'SignOut' },
  { name: 'Sparkles' },
  { name: 'Speaker' },
  { name: 'Stop' },
  { name: 'Sun' },
  { name: 'Table' },
  { name: 'Tags' },
  { name: 'Trim' },
  { name: 'Undo' },
  { name: 'Upload' },
]

export function iconClassFor(tint: string, className: string): string {
  return [tint, className].filter(Boolean).join(' ')
}

// The renderings a glyph carries, from the set's variant registry. A glyph
// with no entry has exactly one: its default.
export function variantsFor(name: string): readonly string[] {
  return VARIANT_LADDERS[`${name}Icon.svelte`]?.variants ?? []
}

// The glyphs that take a `variant` prop: the ones the registry lists, so no
// other glyph sees an unknown prop.
export function iconTakesVariant(name: string): boolean {
  return variantsFor(name).length > 0
}

// Every variant the registry declares, in the order it declares them, so the
// playground offers the whole set.
export const ALL_VARIANTS: string[] = [
  ...new Set(Object.values(VARIANT_LADDERS).flatMap(ladder => [...ladder.variants])),
]

// The variant a glyph renders under the chosen one: the glyphs that carry it
// take it, the rest keep their default.
export function variantFor(name: string, variant: string | undefined): { variant?: string } {
  if (!variant) return {}
  return variantsFor(name).includes(variant) ? { variant } : {}
}

export function iconLabel(entry: IconEntry): string {
  return entry.name
}

// One component per `ICON_ENTRIES.name`; the gallery and its parity test read
// this single map so a new glyph cannot ship without a component behind it.
export const ICON_COMPONENTS: Record<string, Component> = {
  AutoRefresh: AutoRefreshIcon,
  Browse: BrowseIcon,
  Calendar: CalendarIcon,
  CaretDown: CaretDownIcon,
  CaretLeft: CaretLeftIcon,
  CaretRight: CaretRightIcon,
  CaretUp: CaretUpIcon,
  Check: CheckIcon,
  ChevronDown: ChevronDownIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  ChevronUp: ChevronUpIcon,
  Close: CloseIcon,
  Cloud: CloudIcon,
  Code: CodeIcon,
  Collapse: CollapseIcon,
  Columns: ColumnsIcon,
  Compare: CompareIcon,
  Copy: CopyIcon,
  Dashboard: DashboardIcon,
  Delete: DeleteIcon,
  Document: DocumentIcon,
  DoubleChevronDown: DoubleChevronDownIcon,
  DoubleChevronLeft: DoubleChevronLeftIcon,
  DoubleChevronRight: DoubleChevronRightIcon,
  DoubleChevronUp: DoubleChevronUpIcon,
  Download: DownloadIcon,
  Edit: EditIcon,
  Expand: ExpandIcon,
  Export: ExportIcon,
  ExternalLink: ExternalLinkIcon,
  Eye: EyeIcon,
  EyeSlash: EyeSlashIcon,
  Filter: FilterIcon,
  Fire: FireIcon,
  Follow: FollowIcon,
  Forest: ForestIcon,
  Format: FormatIcon,
  Globe: GlobeIcon,
  Grid: GridIcon,
  Help: HelpIcon,
  History: HistoryIcon,
  Info: InfoIcon,
  Kebab: KebabIcon,
  Lavender: LavenderIcon,
  LightBulb: LightBulbIcon,
  Link: LinkIcon,
  List: ListIcon,
  Lock: LockIcon,
  Maximize: MaximizeIcon,
  Menu: MenuIcon,
  Midnight: MidnightIcon,
  Minimize: MinimizeIcon,
  Mint: MintIcon,
  Moon: MoonIcon,
  Palette: PaletteIcon,
  Plus: PlusIcon,
  Profile: ProfileIcon,
  Redo: RedoIcon,
  Refresh: RefreshIcon,
  Reset: ResetIcon,
  Restore: RestoreIcon,
  Save: SaveIcon,
  Search: SearchIcon,
  Settings: SettingsIcon,
  Share: ShareIcon,
  SignOut: SignOutIcon,
  Sparkles: SparklesIcon,
  Speaker: SpeakerIcon,
  Stop: StopIcon,
  Sun: SunIcon,
  Table: TableIcon,
  Tags: TagsIcon,
  Trim: TrimIcon,
  Undo: UndoIcon,
  Upload: UploadIcon,
}

export function buildIconsSnippet({ size, tint, className, variant }: IconsSnippetState): string {
  const classes = iconClassFor(tint, className.on ? className.value : '')
  // The size Value prefills the component default; the builder omits it so
  // Show-code stays minimal.
  const sizeFragment = size.on && size.value !== '' && size.value !== 'md' ? sizeAttributeFragment(size.value) : ''
  const classFragment = classes ? ` className="${classes}"` : ''
  // The variant rides the glyphs that carry it; the rest keep their default.
  const variantFragment = variant.on && variant.value !== '' ? ` variant="${escapeAttr(variant.value)}"` : ''
  const lines = [
    '<div class="grid grid-cols-4 gap-3 text-xs text-slate-400 sm:grid-cols-8 [&>span]:flex [&>span]:flex-col [&>span]:items-center [&>span]:gap-1">',
    ...ICON_ENTRIES.map(entry => {
      const entryVariant = variantFragment && variantsFor(entry.name).includes(variant.value) ? variantFragment : ''
      return `  <span><${entry.name}Icon${sizeFragment}${classFragment}${entryVariant} />${iconLabel(entry)}</span>`
    }),
    '</div>',
  ]
  return lines.join('\n')
}
