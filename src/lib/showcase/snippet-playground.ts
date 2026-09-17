import type { Component } from 'svelte'
import * as svelteClient from 'svelte/internal/client'
import BaseDialog from '$lib/components/BaseDialog.svelte'
import Button from '$lib/components/Button.svelte'
import Buttons from '$lib/components/Buttons.svelte'
import Checkbox from '$lib/components/Checkbox.svelte'
import FormField from '$lib/components/FormField.svelte'
import NumberInput from '$lib/components/NumberInput.svelte'
import Pagination from '$lib/components/Pagination.svelte'
import SearchInput from '$lib/components/SearchInput.svelte'
import SelectDropdown from '$lib/components/SelectDropdown.svelte'
import Spinner from '$lib/components/Spinner.svelte'
import Tabs from '$lib/components/Tabs.svelte'
import Tooltip from '$lib/components/Tooltip.svelte'

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
  'ui/FormField.svelte': { default: FormField },
  'ui/NumberInput.svelte': { default: NumberInput },
  'ui/Pagination.svelte': { default: Pagination },
  'ui/SearchInput.svelte': { default: SearchInput },
  'ui/SelectDropdown.svelte': { default: SelectDropdown },
  'ui/Spinner.svelte': { default: Spinner },
  'ui/Tabs.svelte': { default: Tabs },
  'ui/Tooltip.svelte': { default: Tooltip },
}

const COMPONENT_IMPORTS = [
  '  import BaseDialog from "ui/BaseDialog.svelte"',
  '  import Button from "ui/Button.svelte"',
  '  import Buttons from "ui/Buttons.svelte"',
  '  import Checkbox from "ui/Checkbox.svelte"',
  '  import FormField from "ui/FormField.svelte"',
  '  import NumberInput from "ui/NumberInput.svelte"',
  '  import Pagination from "ui/Pagination.svelte"',
  '  import SearchInput from "ui/SearchInput.svelte"',
  '  import SelectDropdown from "ui/SelectDropdown.svelte"',
  '  import Spinner from "ui/Spinner.svelte"',
  '  import Tabs from "ui/Tabs.svelte"',
  '  import Tooltip from "ui/Tooltip.svelte"',
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
