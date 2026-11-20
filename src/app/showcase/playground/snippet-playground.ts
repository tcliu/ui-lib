import type { Component } from 'svelte'
import * as svelteClient from 'svelte/internal/client'
import {
  buildSource,
  collectDeclaredNames,
  rewriteImports,
  snippetErrorMessage,
  splitLeadingScript,
} from './snippet-source'
import AppShell from '#lib/components/AppShell.svelte'
import AutoComplete from '#lib/components/AutoComplete.svelte'
import BarChart from '#lib/components/BarChart.svelte'
import BaseDialog from '#lib/components/BaseDialog.svelte'
import Button from '#lib/components/Button.svelte'
import Buttons from '#lib/components/Buttons.svelte'
import Checkbox from '#lib/components/Checkbox.svelte'
import Chip from '#lib/components/Chip.svelte'
import ChipDropdown from '#lib/components/ChipDropdown.svelte'
import ClearButton from '#lib/components/ClearButton.svelte'
import CodeEditor from '#lib/components/CodeEditor.svelte'
import ColumnChooser from '#lib/components/ColumnChooser.svelte'
import ConfirmDialog from '#lib/components/ConfirmDialog.svelte'
import Copyable from '#lib/components/Copyable.svelte'
import DataGrid from '#lib/components/DataGrid.svelte'
import DataTable from '#lib/components/DataTable.svelte'
import DateInput from '#lib/components/DateInput.svelte'
import EditableText from '#lib/components/EditableText.svelte'
import FormDialog from '#lib/components/FormDialog.svelte'
import FieldTable from '#lib/components/FieldTable.svelte'
import FormField from '#lib/components/FormField.svelte'
import LazyCodeEditor from '#lib/components/LazyCodeEditor.svelte'
import Menu from '#lib/components/Menu.svelte'
import NumberInput from '#lib/components/NumberInput.svelte'
import Pagination from '#lib/components/Pagination.svelte'
import PasswordInput from '#lib/components/PasswordInput.svelte'
import Resizable from '#lib/components/Resizable.svelte'
import SearchInput from '#lib/components/SearchInput.svelte'
import SelectDropdown from '#lib/components/SelectDropdown.svelte'
import Spinner from '#lib/components/Spinner.svelte'
import Splitter from '#lib/components/Splitter.svelte'
import StructureTree from '#lib/components/StructureTree.svelte'
import Tabs from '#lib/components/Tabs.svelte'
import TagInput from '#lib/components/TagInput.svelte'
import TextArea from '#lib/components/TextArea.svelte'
import TextInput from '#lib/components/TextInput.svelte'
import Toast from '#lib/components/Toast.svelte'
import Tooltip from '#lib/components/Tooltip.svelte'
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
import * as structureValue from '#lib/components/structure-value.js'

// The showcase's live playground compiles an edited snippet in the browser and
// renders it. `svelte/compiler` is imported dynamically so it lands in its own
// lazy chunk and never enters the initial bundle.
//
// Mechanism: the snippet text is combined with a fixed `<script>` preamble that
// imports the shared primitives (from synthetic `ui/*` specifiers) and seeds
// per-key `$state` from a `__scope` parameter holding the page-supplied scope
// values. The
// compiler's client output is then evaluated with `new Function`, not as a real
// ES module. Because of that, its `import` statements cannot resolve — so every
// import is rewritten by `rewriteImports` into a lookup in `MODULE_REGISTRY`,
// which is passed in as `__mods`. The rewritten factory receives `__mods` and
// `__scope` and returns the component function, which the caller mounts and
// unmounts.
//
// Security: this executes arbitrary JavaScript in the page from user-edited
// source. Only the shared primitives and the Svelte runtime are placed in
// `MODULE_REGISTRY` — no app stores, factories, or fetch wrappers. The compiled
// code still runs with full page privileges (globals, `fetch`, storage), so
// this is NOT a sandbox; it is only acceptable because the showcase is local
// and the editor is authored by the same person. See ui-lib AGENTS.md.

const MODULE_REGISTRY: Record<string, unknown> = {
  'svelte/internal/client': svelteClient,
  'ui/AppShell.svelte': { default: AppShell },
  'ui/AutoComplete.svelte': { default: AutoComplete },
  'ui/BarChart.svelte': { default: BarChart },
  'ui/BaseDialog.svelte': { default: BaseDialog },
  'ui/Button.svelte': { default: Button },
  'ui/Buttons.svelte': { default: Buttons },
  'ui/Checkbox.svelte': { default: Checkbox },
  'ui/Chip.svelte': { default: Chip },
  'ui/ChipDropdown.svelte': { default: ChipDropdown },
  'ui/ClearButton.svelte': { default: ClearButton },
  'ui/CodeEditor.svelte': { default: CodeEditor },
  'ui/ColumnChooser.svelte': { default: ColumnChooser },
  'ui/ConfirmDialog.svelte': { default: ConfirmDialog },
  'ui/Copyable.svelte': { default: Copyable },
  'ui/DataGrid.svelte': { default: DataGrid },
  'ui/DataTable.svelte': { default: DataTable },
  'ui/DateInput.svelte': { default: DateInput },
  'ui/EditableText.svelte': { default: EditableText },
  'ui/FormDialog.svelte': { default: FormDialog },
  'ui/FieldTable.svelte': { default: FieldTable },
  'ui/FormField.svelte': { default: FormField },
  'ui/LazyCodeEditor.svelte': { default: LazyCodeEditor },
  'ui/Menu.svelte': { default: Menu },
  'ui/NumberInput.svelte': { default: NumberInput },
  'ui/Pagination.svelte': { default: Pagination },
  'ui/PasswordInput.svelte': { default: PasswordInput },
  'ui/Resizable.svelte': { default: Resizable },
  'ui/SearchInput.svelte': { default: SearchInput },
  'ui/SelectDropdown.svelte': { default: SelectDropdown },
  'ui/Spinner.svelte': { default: Spinner },
  'ui/Splitter.svelte': { default: Splitter },
  'ui/StructureTree.svelte': { default: StructureTree },
  'ui/Tabs.svelte': { default: Tabs },
  'ui/TagInput.svelte': { default: TagInput },
  'ui/TextArea.svelte': { default: TextArea },
  'ui/TextInput.svelte': { default: TextInput },
  'ui/Toast.svelte': { default: Toast },
  'ui/Tooltip.svelte': { default: Tooltip },
  'ui/AutoRefreshIcon.svelte': { default: AutoRefreshIcon },
  'ui/BrowseIcon.svelte': { default: BrowseIcon },
  'ui/CalendarIcon.svelte': { default: CalendarIcon },
  'ui/CaretDownIcon.svelte': { default: CaretDownIcon },
  'ui/CaretLeftIcon.svelte': { default: CaretLeftIcon },
  'ui/CaretRightIcon.svelte': { default: CaretRightIcon },
  'ui/CaretUpIcon.svelte': { default: CaretUpIcon },
  'ui/CheckIcon.svelte': { default: CheckIcon },
  'ui/ChevronDownIcon.svelte': { default: ChevronDownIcon },
  'ui/ChevronLeftIcon.svelte': { default: ChevronLeftIcon },
  'ui/ChevronRightIcon.svelte': { default: ChevronRightIcon },
  'ui/ChevronUpIcon.svelte': { default: ChevronUpIcon },
  'ui/CloseIcon.svelte': { default: CloseIcon },
  'ui/CloudIcon.svelte': { default: CloudIcon },
  'ui/CodeIcon.svelte': { default: CodeIcon },
  'ui/ColumnsIcon.svelte': { default: ColumnsIcon },
  'ui/CompareIcon.svelte': { default: CompareIcon },
  'ui/CopyIcon.svelte': { default: CopyIcon },
  'ui/DashboardIcon.svelte': { default: DashboardIcon },
  'ui/DeleteIcon.svelte': { default: DeleteIcon },
  'ui/DocumentIcon.svelte': { default: DocumentIcon },
  'ui/DoubleChevronDownIcon.svelte': { default: DoubleChevronDownIcon },
  'ui/DoubleChevronLeftIcon.svelte': { default: DoubleChevronLeftIcon },
  'ui/DoubleChevronRightIcon.svelte': { default: DoubleChevronRightIcon },
  'ui/DoubleChevronUpIcon.svelte': { default: DoubleChevronUpIcon },
  'ui/DownloadIcon.svelte': { default: DownloadIcon },
  'ui/EditIcon.svelte': { default: EditIcon },
  'ui/ExportIcon.svelte': { default: ExportIcon },
  'ui/ExternalLinkIcon.svelte': { default: ExternalLinkIcon },
  'ui/EyeIcon.svelte': { default: EyeIcon },
  'ui/EyeSlashIcon.svelte': { default: EyeSlashIcon },
  'ui/FilterIcon.svelte': { default: FilterIcon },
  'ui/FireIcon.svelte': { default: FireIcon },
  'ui/FollowIcon.svelte': { default: FollowIcon },
  'ui/ForestIcon.svelte': { default: ForestIcon },
  'ui/FormatIcon.svelte': { default: FormatIcon },
  'ui/GlobeIcon.svelte': { default: GlobeIcon },
  'ui/GridIcon.svelte': { default: GridIcon },
  'ui/HelpIcon.svelte': { default: HelpIcon },
  'ui/HistoryIcon.svelte': { default: HistoryIcon },
  'ui/InfoIcon.svelte': { default: InfoIcon },
  'ui/KebabIcon.svelte': { default: KebabIcon },
  'ui/LavenderIcon.svelte': { default: LavenderIcon },
  'ui/LightBulbIcon.svelte': { default: LightBulbIcon },
  'ui/LinkIcon.svelte': { default: LinkIcon },
  'ui/ListIcon.svelte': { default: ListIcon },
  'ui/LockIcon.svelte': { default: LockIcon },
  'ui/MaximizeIcon.svelte': { default: MaximizeIcon },
  'ui/MenuIcon.svelte': { default: MenuIcon },
  'ui/MidnightIcon.svelte': { default: MidnightIcon },
  'ui/MinimizeIcon.svelte': { default: MinimizeIcon },
  'ui/MintIcon.svelte': { default: MintIcon },
  'ui/MoonIcon.svelte': { default: MoonIcon },
  'ui/PaletteIcon.svelte': { default: PaletteIcon },
  'ui/PlusIcon.svelte': { default: PlusIcon },
  'ui/ProfileIcon.svelte': { default: ProfileIcon },
  'ui/RedoIcon.svelte': { default: RedoIcon },
  'ui/RefreshIcon.svelte': { default: RefreshIcon },
  'ui/ResetIcon.svelte': { default: ResetIcon },
  'ui/RestoreIcon.svelte': { default: RestoreIcon },
  'ui/SaveIcon.svelte': { default: SaveIcon },
  'ui/SearchIcon.svelte': { default: SearchIcon },
  'ui/SettingsIcon.svelte': { default: SettingsIcon },
  'ui/ShareIcon.svelte': { default: ShareIcon },
  'ui/SignOutIcon.svelte': { default: SignOutIcon },
  'ui/SparklesIcon.svelte': { default: SparklesIcon },
  'ui/SpeakerIcon.svelte': { default: SpeakerIcon },
  'ui/StopIcon.svelte': { default: StopIcon },
  'ui/SunIcon.svelte': { default: SunIcon },
  'ui/TableIcon.svelte': { default: TableIcon },
  'ui/TagsIcon.svelte': { default: TagsIcon },
  'ui/TrimIcon.svelte': { default: TrimIcon },
  'ui/UndoIcon.svelte': { default: UndoIcon },
  'ui/UploadIcon.svelte': { default: UploadIcon },
  // Shared tree helpers for StructureTree snippets (pure functions only:
  // no stores, no fetch, no DOM access).
  'ui/structure-value.ts': structureValue,
}

// Preamble imports derived from the registry, so the two can never drift: every
// `ui/*.svelte` entry becomes `import <Base> from "ui/<Base>.svelte"` and
// `rewriteImports` re-binds it to the `__mods` lookup. The non-component
// `ui/structure-value.ts` entry is excluded (it is imported by name, not
// default).
export const SNIPPET_PREAMBLE_IMPORTS = Object.keys(MODULE_REGISTRY)
  .filter(specifier => /^ui\/.+\.svelte$/.test(specifier))
  .map(specifier => `  import ${specifier.slice(3, -'.svelte'.length)} from "${specifier}"`)
  .join('\n')

// Compile the snippet and evaluate the resulting factory. Throws with a concise
// message (no stack) so the caller can show it inline and keep the previous
// render.
export async function createSnippetComponent(snippet: string, scope: Record<string, unknown>): Promise<Component> {
  const { compile, parse } = await import('svelte/compiler')
  let compiled: string
  try {
    const { declarations, markup } = splitLeadingScript(snippet)
    const ast = parse(`<script>${declarations}</script>`, { modern: true })
    const declaredNames = ast.instance ? collectDeclaredNames(ast.instance.content) : new Set<string>()
    compiled = compile(
      buildSource({
        markup,
        declarations,
        scopeKeys: Object.keys(scope),
        declaredNames,
        componentImports: SNIPPET_PREAMBLE_IMPORTS,
      }),
      {
        generate: 'client',
        dev: false,
        filename: 'ShowcaseSnippet.svelte',
      },
    ).js.code
  } catch (error) {
    throw new Error(snippetErrorMessage(error))
  }
  const factory = new Function('__mods', '__scope', rewriteImports(compiled)) as (
    mods: Record<string, unknown>,
    scopeValues: Record<string, unknown>,
  ) => Component
  return factory(MODULE_REGISTRY, scope)
}
