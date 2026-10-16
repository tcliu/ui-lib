// Show-code source for the Icons demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import type { Component } from 'svelte'
import { sizeAttributeFragment } from '$lib/showcase/size-input'
import BrowseIcon from '$lib/icons/BrowseIcon.svelte'
import CalendarIcon from '$lib/icons/CalendarIcon.svelte'
import CaretDownIcon from '$lib/icons/CaretDownIcon.svelte'
import CaretLeftIcon from '$lib/icons/CaretLeftIcon.svelte'
import CaretRightIcon from '$lib/icons/CaretRightIcon.svelte'
import CaretUpIcon from '$lib/icons/CaretUpIcon.svelte'
import CheckIcon from '$lib/icons/CheckIcon.svelte'
import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte'
import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte'
import ChevronRightIcon from '$lib/icons/ChevronRightIcon.svelte'
import ChevronUpIcon from '$lib/icons/ChevronUpIcon.svelte'
import CloseIcon from '$lib/icons/CloseIcon.svelte'
import CloudIcon from '$lib/icons/CloudIcon.svelte'
import CodeIcon from '$lib/icons/CodeIcon.svelte'
import ColumnInsertAfterIcon from '$lib/icons/ColumnInsertAfterIcon.svelte'
import ColumnInsertBeforeIcon from '$lib/icons/ColumnInsertBeforeIcon.svelte'
import ColumnsIcon from '$lib/icons/ColumnsIcon.svelte'
import CopyIcon from '$lib/icons/CopyIcon.svelte'
import DashboardIcon from '$lib/icons/DashboardIcon.svelte'
import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
import DeleteColumnsIcon from '$lib/icons/DeleteColumnsIcon.svelte'
import DeleteRowsIcon from '$lib/icons/DeleteRowsIcon.svelte'
import DocumentIcon from '$lib/icons/DocumentIcon.svelte'
import DoubleChevronDownIcon from '$lib/icons/DoubleChevronDownIcon.svelte'
import DoubleChevronLeftIcon from '$lib/icons/DoubleChevronLeftIcon.svelte'
import DoubleChevronRightIcon from '$lib/icons/DoubleChevronRightIcon.svelte'
import DoubleChevronUpIcon from '$lib/icons/DoubleChevronUpIcon.svelte'
import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
import EditIcon from '$lib/icons/EditIcon.svelte'
import ExportIcon from '$lib/icons/ExportIcon.svelte'
import EyeIcon from '$lib/icons/EyeIcon.svelte'
import EyeSlashIcon from '$lib/icons/EyeSlashIcon.svelte'
import FireIcon from '$lib/icons/FireIcon.svelte'
import ForestIcon from '$lib/icons/ForestIcon.svelte'
import GlobeIcon from '$lib/icons/GlobeIcon.svelte'
import GridIcon from '$lib/icons/GridIcon.svelte'
import InfoIcon from '$lib/icons/InfoIcon.svelte'
import KebabIcon from '$lib/icons/KebabIcon.svelte'
import LavenderIcon from '$lib/icons/LavenderIcon.svelte'
import LightBulbIcon from '$lib/icons/LightBulbIcon.svelte'
import ListIcon from '$lib/icons/ListIcon.svelte'
import MenuIcon from '$lib/icons/MenuIcon.svelte'
import MidnightIcon from '$lib/icons/MidnightIcon.svelte'
import MintIcon from '$lib/icons/MintIcon.svelte'
import MoonIcon from '$lib/icons/MoonIcon.svelte'
import PaletteIcon from '$lib/icons/PaletteIcon.svelte'
import PlusIcon from '$lib/icons/PlusIcon.svelte'
import RedoIcon from '$lib/icons/RedoIcon.svelte'
import RefreshIcon from '$lib/icons/RefreshIcon.svelte'
import ResetIcon from '$lib/icons/ResetIcon.svelte'
import RowInsertAboveIcon from '$lib/icons/RowInsertAboveIcon.svelte'
import RowInsertBelowIcon from '$lib/icons/RowInsertBelowIcon.svelte'
import SaveIcon from '$lib/icons/SaveIcon.svelte'
import SearchIcon from '$lib/icons/SearchIcon.svelte'
import SettingsIcon from '$lib/icons/SettingsIcon.svelte'
import SignOutIcon from '$lib/icons/SignOutIcon.svelte'
import SparklesIcon from '$lib/icons/SparklesIcon.svelte'
import SunIcon from '$lib/icons/SunIcon.svelte'
import TableIcon from '$lib/icons/TableIcon.svelte'
import TrimIcon from '$lib/icons/TrimIcon.svelte'
import UndoIcon from '$lib/icons/UndoIcon.svelte'
import UploadIcon from '$lib/icons/UploadIcon.svelte'

export interface IconsSnippetState {
  size: string
  sizeOn: boolean
  tint: string
  className: string
  classNameOn: boolean
  variant: string
  variantOn: boolean
}

export interface IconEntry {
  name: string
}

// One entry per glyph; the list covers every `src/lib/icons` component, and the
// directory-parity spec in `demo-snippet.test.ts` fails when one is missing.
export const ICON_ENTRIES: IconEntry[] = [
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
  { name: 'ColumnInsertAfter' },
  { name: 'ColumnInsertBefore' },
  { name: 'Columns' },
  { name: 'Copy' },
  { name: 'Dashboard' },
  { name: 'Delete' },
  { name: 'DeleteColumns' },
  { name: 'DeleteRows' },
  { name: 'Document' },
  { name: 'DoubleChevronDown' },
  { name: 'DoubleChevronLeft' },
  { name: 'DoubleChevronRight' },
  { name: 'DoubleChevronUp' },
  { name: 'Download' },
  { name: 'Edit' },
  { name: 'Export' },
  { name: 'Eye' },
  { name: 'EyeSlash' },
  { name: 'Fire' },
  { name: 'Forest' },
  { name: 'Globe' },
  { name: 'Grid' },
  { name: 'Info' },
  { name: 'Kebab' },
  { name: 'Lavender' },
  { name: 'LightBulb' },
  { name: 'List' },
  { name: 'Menu' },
  { name: 'Midnight' },
  { name: 'Mint' },
  { name: 'Moon' },
  { name: 'Palette' },
  { name: 'Plus' },
  { name: 'Redo' },
  { name: 'Refresh' },
  { name: 'Reset' },
  { name: 'RowInsertAbove' },
  { name: 'RowInsertBelow' },
  { name: 'Save' },
  { name: 'Search' },
  { name: 'Settings' },
  { name: 'SignOut' },
  { name: 'Sparkles' },
  { name: 'Sun' },
  { name: 'Table' },
  { name: 'Trim' },
  { name: 'Undo' },
  { name: 'Upload' },
]

export function iconClassFor(tint: string, className: string): string {
  return [tint, className].filter(Boolean).join(' ')
}

// The glyphs that take the `variant` prop: the chevron family (single and
// double). The variant rides these tags alone, so no other glyph sees an
// unknown prop.
export function iconTakesVariant(name: string): boolean {
  return name.includes('Chevron')
}

export function iconLabel(entry: IconEntry): string {
  return entry.name
}

// One component per `ICON_ENTRIES.name`; the gallery and its parity test read
// this single map so a new glyph cannot ship without a component behind it.
export const ICON_COMPONENTS: Record<string, Component> = {
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
  ColumnInsertAfter: ColumnInsertAfterIcon,
  ColumnInsertBefore: ColumnInsertBeforeIcon,
  Columns: ColumnsIcon,
  Copy: CopyIcon,
  Dashboard: DashboardIcon,
  Delete: DeleteIcon,
  DeleteColumns: DeleteColumnsIcon,
  DeleteRows: DeleteRowsIcon,
  Document: DocumentIcon,
  DoubleChevronDown: DoubleChevronDownIcon,
  DoubleChevronLeft: DoubleChevronLeftIcon,
  DoubleChevronRight: DoubleChevronRightIcon,
  DoubleChevronUp: DoubleChevronUpIcon,
  Download: DownloadIcon,
  Edit: EditIcon,
  Export: ExportIcon,
  Eye: EyeIcon,
  EyeSlash: EyeSlashIcon,
  Fire: FireIcon,
  Forest: ForestIcon,
  Globe: GlobeIcon,
  Grid: GridIcon,
  Info: InfoIcon,
  Kebab: KebabIcon,
  Lavender: LavenderIcon,
  LightBulb: LightBulbIcon,
  List: ListIcon,
  Menu: MenuIcon,
  Midnight: MidnightIcon,
  Mint: MintIcon,
  Moon: MoonIcon,
  Palette: PaletteIcon,
  Plus: PlusIcon,
  Redo: RedoIcon,
  Refresh: RefreshIcon,
  Reset: ResetIcon,
  RowInsertAbove: RowInsertAboveIcon,
  RowInsertBelow: RowInsertBelowIcon,
  Save: SaveIcon,
  Search: SearchIcon,
  Settings: SettingsIcon,
  SignOut: SignOutIcon,
  Sparkles: SparklesIcon,
  Sun: SunIcon,
  Table: TableIcon,
  Trim: TrimIcon,
  Undo: UndoIcon,
  Upload: UploadIcon,
}

export function buildIconsSnippet({ size, sizeOn, tint, className, classNameOn, variant, variantOn }: IconsSnippetState): string {
  const classes = iconClassFor(tint, classNameOn ? className : '')
  // The size Value prefills the component default; the builder omits it so
  // Show-code stays minimal.
  const sizeFragment = sizeOn && size !== '' && size !== 'md' ? sizeAttributeFragment(size) : ''
  const classFragment = classes ? ` className="${classes}"` : ''
  // `variant` belongs to the chevron family, so it rides those tags alone;
  // `regular` is the component default and is omitted like `md`.
  const variantFragment = variantOn && variant !== '' && variant !== 'regular' ? ` variant="${variant}"` : ''
  const lines = [
    '<div class="grid grid-cols-4 gap-3 text-xs text-slate-400 sm:grid-cols-8 [&>span]:flex [&>span]:flex-col [&>span]:items-center [&>span]:gap-1">',
    ...ICON_ENTRIES.map(entry => {
      const entryVariant = iconTakesVariant(entry.name) ? variantFragment : ''
      return `  <span><${entry.name}Icon${sizeFragment}${classFragment}${entryVariant} />${iconLabel(entry)}</span>`
    }),
    '</div>',
  ]
  return lines.join('\n')
}
