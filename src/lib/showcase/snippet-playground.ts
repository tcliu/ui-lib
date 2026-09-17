import type { Component } from 'svelte'
import * as svelteClient from 'svelte/internal/client'
import BaseDialog from '$lib/components/BaseDialog.svelte'
import Button from '$lib/components/Button.svelte'
import Buttons from '$lib/components/Buttons.svelte'
import Checkbox from '$lib/components/Checkbox.svelte'
import DataTable from '$lib/components/DataTable.svelte'
import FormField from '$lib/components/FormField.svelte'
import NumberInput from '$lib/components/NumberInput.svelte'
import Pagination from '$lib/components/Pagination.svelte'
import PasswordInput from '$lib/components/PasswordInput.svelte'
import SearchInput from '$lib/components/SearchInput.svelte'
import SelectDropdown from '$lib/components/SelectDropdown.svelte'
import Spinner from '$lib/components/Spinner.svelte'
import Tabs from '$lib/components/Tabs.svelte'
import TagInput from '$lib/components/TagInput.svelte'
import Tooltip from '$lib/components/Tooltip.svelte'
import CheckIcon from '$lib/icons/CheckIcon.svelte'
import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte'
import ChevronDownSmallIcon from '$lib/icons/ChevronDownSmallIcon.svelte'
import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte'
import ChevronRightIcon from '$lib/icons/ChevronRightIcon.svelte'
import ChevronUpSmallIcon from '$lib/icons/ChevronUpSmallIcon.svelte'
import CloseIcon from '$lib/icons/CloseIcon.svelte'
import CodeIcon from '$lib/icons/CodeIcon.svelte'
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
  'ui/BaseDialog.svelte': { default: BaseDialog },
  'ui/Button.svelte': { default: Button },
  'ui/Buttons.svelte': { default: Buttons },
  'ui/Checkbox.svelte': { default: Checkbox },
  'ui/DataTable.svelte': { default: DataTable },
  'ui/FormField.svelte': { default: FormField },
  'ui/NumberInput.svelte': { default: NumberInput },
  'ui/Pagination.svelte': { default: Pagination },
  'ui/PasswordInput.svelte': { default: PasswordInput },
  'ui/SearchInput.svelte': { default: SearchInput },
  'ui/SelectDropdown.svelte': { default: SelectDropdown },
  'ui/Spinner.svelte': { default: Spinner },
  'ui/Tabs.svelte': { default: Tabs },
  'ui/TagInput.svelte': { default: TagInput },
  'ui/Tooltip.svelte': { default: Tooltip },
  'ui/CheckIcon.svelte': { default: CheckIcon },
  'ui/ChevronDownIcon.svelte': { default: ChevronDownIcon },
  'ui/ChevronDownSmallIcon.svelte': { default: ChevronDownSmallIcon },
  'ui/ChevronLeftIcon.svelte': { default: ChevronLeftIcon },
  'ui/ChevronRightIcon.svelte': { default: ChevronRightIcon },
  'ui/ChevronUpSmallIcon.svelte': { default: ChevronUpSmallIcon },
  'ui/CloseIcon.svelte': { default: CloseIcon },
  'ui/CodeIcon.svelte': { default: CodeIcon },
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

const COMPONENT_IMPORTS = [
  '  import BaseDialog from "ui/BaseDialog.svelte"',
  '  import Button from "ui/Button.svelte"',
  '  import Buttons from "ui/Buttons.svelte"',
  '  import Checkbox from "ui/Checkbox.svelte"',
  '  import DataTable from "ui/DataTable.svelte"',
  '  import FormField from "ui/FormField.svelte"',
  '  import NumberInput from "ui/NumberInput.svelte"',
  '  import Pagination from "ui/Pagination.svelte"',
  '  import PasswordInput from "ui/PasswordInput.svelte"',
  '  import SearchInput from "ui/SearchInput.svelte"',
  '  import SelectDropdown from "ui/SelectDropdown.svelte"',
  '  import Spinner from "ui/Spinner.svelte"',
  '  import Tabs from "ui/Tabs.svelte"',
  '  import TagInput from "ui/TagInput.svelte"',
  '  import Tooltip from "ui/Tooltip.svelte"',
  '  import CheckIcon from "ui/CheckIcon.svelte"',
  '  import ChevronDownIcon from "ui/ChevronDownIcon.svelte"',
  '  import ChevronDownSmallIcon from "ui/ChevronDownSmallIcon.svelte"',
  '  import ChevronLeftIcon from "ui/ChevronLeftIcon.svelte"',
  '  import ChevronRightIcon from "ui/ChevronRightIcon.svelte"',
  '  import ChevronUpSmallIcon from "ui/ChevronUpSmallIcon.svelte"',
  '  import CloseIcon from "ui/CloseIcon.svelte"',
  '  import CodeIcon from "ui/CodeIcon.svelte"',
  '  import CopyIcon from "ui/CopyIcon.svelte"',
  '  import DeleteIcon from "ui/DeleteIcon.svelte"',
  '  import EyeIcon from "ui/EyeIcon.svelte"',
  '  import EyeSlashIcon from "ui/EyeSlashIcon.svelte"',
  '  import ForestIcon from "ui/ForestIcon.svelte"',
  '  import GlobeIcon from "ui/GlobeIcon.svelte"',
  '  import KebabIcon from "ui/KebabIcon.svelte"',
  '  import MenuIcon from "ui/MenuIcon.svelte"',
  '  import PaletteIcon from "ui/PaletteIcon.svelte"',
  '  import PlusIcon from "ui/PlusIcon.svelte"',
  '  import RefreshIcon from "ui/RefreshIcon.svelte"',
  '  import ResetIcon from "ui/ResetIcon.svelte"',
  '  import SaveIcon from "ui/SaveIcon.svelte"',
  '  import SearchIcon from "ui/SearchIcon.svelte"',
  '  import SettingsIcon from "ui/SettingsIcon.svelte"',
  '  import SortAscIcon from "ui/SortAscIcon.svelte"',
  '  import SortDescIcon from "ui/SortDescIcon.svelte"',
].join('\n')

// Rewrite the compiler's ESM output for `new Function`: drop side-effect imports
// (version disclosure, legacy flags), bind namespace/default/named imports to
// the `__mods` registry, and turn the default export into the factory's return
// value.
function rewriteImports(code: string): string {
  return code
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(
      /^import\s+\*\s+as\s+([\w$]+)\s+from\s+['"]([^'"]+)['"];?/gm,
      (_, name: string, spec: string) => `const ${name} = __mods[${JSON.stringify(spec)}];`,
    )
    .replace(
      /^import\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"];?/gm,
      (_, names: string, spec: string) => `const {${names}} = __mods[${JSON.stringify(spec)}];`,
    )
    .replace(
      /^import\s+([\w$]+)\s+from\s+['"]([^'"]+)['"];?/gm,
      (_, name: string, spec: string) => `const ${name} = __mods[${JSON.stringify(spec)}].default;`,
    )
    .replace(/export\s+default\s+function\s+([\w$]*)/, 'return function $1')
}

function buildSource(snippet: string, scopeKeys: string[]): string {
  const scopeLine = scopeKeys.length > 0 ? `  let { ${scopeKeys.join(', ')} } = __scope\n` : ''
  return `<script>\n${COMPONENT_IMPORTS}\n${scopeLine}</script>\n${snippet}`
}

// Compile the snippet and evaluate the resulting factory. Throws with a concise
// message (no stack) so the caller can show it inline and keep the previous
// render.
export async function createSnippetComponent(
  snippet: string,
  scope: Record<string, unknown>,
): Promise<Component> {
  const { compile } = await import('svelte/compiler')
  let compiled: string
  try {
    compiled = compile(buildSource(snippet, Object.keys(scope)), {
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

// User-facing message for a compile or render failure: the message only, never
// the stack.
export function snippetErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return String(error)
}
