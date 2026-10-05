import type { Component } from 'svelte'
import * as svelteClient from 'svelte/internal/client'
import {
  buildSource,
  collectDeclaredNames,
  rewriteImports,
  snippetErrorMessage,
  splitLeadingScript,
} from './snippet-source'
import AppShell from '$lib/components/AppShell.svelte'
import BaseDialog from '$lib/components/BaseDialog.svelte'
import Button from '$lib/components/Button.svelte'
import Buttons from '$lib/components/Buttons.svelte'
import Checkbox from '$lib/components/Checkbox.svelte'
import Chip from '$lib/components/Chip.svelte'
import ChipDropdown from '$lib/components/ChipDropdown.svelte'
import CodeEditor from '$lib/components/CodeEditor.svelte'
import ColumnChooser from '$lib/components/ColumnChooser.svelte'
import Combobox from '$lib/components/Combobox.svelte'
import ConfirmDialog from '$lib/components/ConfirmDialog.svelte'
import Copyable from '$lib/components/Copyable.svelte'
import CopyButton from '$lib/components/CopyButton.svelte'
import DataGrid from '$lib/components/DataGrid.svelte'
import DataTable from '$lib/components/DataTable.svelte'
import DateRangePicker from '$lib/components/DateRangePicker.svelte'
import EditableText from '$lib/components/EditableText.svelte'
import EditDialog from '$lib/components/EditDialog.svelte'
import FormField from '$lib/components/FormField.svelte'
import LazyCodeEditor from '$lib/components/LazyCodeEditor.svelte'
import Menu from '$lib/components/Menu.svelte'
import NumberInput from '$lib/components/NumberInput.svelte'
import Pagination from '$lib/components/Pagination.svelte'
import PasswordInput from '$lib/components/PasswordInput.svelte'
import Resizable from '$lib/components/Resizable.svelte'
import SearchInput from '$lib/components/SearchInput.svelte'
import SelectDropdown from '$lib/components/SelectDropdown.svelte'
import Spinner from '$lib/components/Spinner.svelte'
import Splitter from '$lib/components/Splitter.svelte'
import Tabs from '$lib/components/Tabs.svelte'
import TagInput from '$lib/components/TagInput.svelte'
import Toast from '$lib/components/Toast.svelte'
import Tooltip from '$lib/components/Tooltip.svelte'
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

// The showcase's live playground compiles an edited snippet in the browser and
// renders it. `svelte/compiler` is imported dynamically so it lands in its own
// lazy chunk and never enters the initial bundle.
//
// Mechanism: the snippet text is combined with a fixed `<script>` preamble that
// imports the shared primitives (from synthetic `ui/*` specifiers) and
// destructures the page-supplied scope out of a `__scope` parameter. The
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
  'ui/BaseDialog.svelte': { default: BaseDialog },
  'ui/Button.svelte': { default: Button },
  'ui/Buttons.svelte': { default: Buttons },
  'ui/Checkbox.svelte': { default: Checkbox },
  'ui/Chip.svelte': { default: Chip },
  'ui/ChipDropdown.svelte': { default: ChipDropdown },
  'ui/CodeEditor.svelte': { default: CodeEditor },
  'ui/ColumnChooser.svelte': { default: ColumnChooser },
  'ui/Combobox.svelte': { default: Combobox },
  'ui/ConfirmDialog.svelte': { default: ConfirmDialog },
  'ui/Copyable.svelte': { default: Copyable },
  'ui/CopyButton.svelte': { default: CopyButton },
  'ui/DataGrid.svelte': { default: DataGrid },
  'ui/DataTable.svelte': { default: DataTable },
  'ui/DateRangePicker.svelte': { default: DateRangePicker },
  'ui/EditableText.svelte': { default: EditableText },
  'ui/EditDialog.svelte': { default: EditDialog },
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
  'ui/Tabs.svelte': { default: Tabs },
  'ui/TagInput.svelte': { default: TagInput },
  'ui/Toast.svelte': { default: Toast },
  'ui/Tooltip.svelte': { default: Tooltip },
  'ui/CheckIcon.svelte': { default: CheckIcon },
  'ui/ChevronDownIcon.svelte': { default: ChevronDownIcon },
  'ui/ChevronLeftIcon.svelte': { default: ChevronLeftIcon },
  'ui/ChevronRightIcon.svelte': { default: ChevronRightIcon },
  'ui/ChevronUpIcon.svelte': { default: ChevronUpIcon },
  'ui/CloseIcon.svelte': { default: CloseIcon },
  'ui/CodeIcon.svelte': { default: CodeIcon },
  'ui/ColumnsIcon.svelte': { default: ColumnsIcon },
  'ui/CopyIcon.svelte': { default: CopyIcon },
  'ui/DeleteIcon.svelte': { default: DeleteIcon },
  'ui/EyeIcon.svelte': { default: EyeIcon },
  'ui/EyeSlashIcon.svelte': { default: EyeSlashIcon },
  'ui/ForestIcon.svelte': { default: ForestIcon },
  'ui/GlobeIcon.svelte': { default: GlobeIcon },
  'ui/KebabIcon.svelte': { default: KebabIcon },
  'ui/MenuIcon.svelte': { default: MenuIcon },
  'ui/PaletteIcon.svelte': { default: PaletteIcon },
  'ui/PlusIcon.svelte': { default: PlusIcon },
  'ui/RefreshIcon.svelte': { default: RefreshIcon },
  'ui/ResetIcon.svelte': { default: ResetIcon },
  'ui/SaveIcon.svelte': { default: SaveIcon },
  'ui/SearchIcon.svelte': { default: SearchIcon },
  'ui/SettingsIcon.svelte': { default: SettingsIcon },
  'ui/SortAscIcon.svelte': { default: SortAscIcon },
  'ui/SortDescIcon.svelte': { default: SortDescIcon },
}

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
    compiled = compile(buildSource({ markup, declarations, scopeKeys: Object.keys(scope), declaredNames }), {
      generate: 'client',
      dev: false,
      filename: 'ShowcaseSnippet.svelte',
    }).js.code
  } catch (error) {
    throw new Error(snippetErrorMessage(error))
  }
  const factory = new Function('__mods', '__scope', rewriteImports(compiled)) as (
    mods: Record<string, unknown>,
    scopeValues: Record<string, unknown>,
  ) => Component
  return factory(MODULE_REGISTRY, scope)
}
