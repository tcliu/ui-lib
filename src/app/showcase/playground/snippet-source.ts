import type { Node, Program } from 'estree'

// Pure source assembly for the showcase playground: no component or compiler
// import, so this module unit-tests without a browser or the Svelte compiler.
// `snippet-playground.ts` supplies the parsed `Program`, the component
// registry, and the preamble import block it derives from that registry; this
// module only splits and assembles text.

const LEADING_SCRIPT = /^\s*<script([^>]*)>([\s\S]*?)<\/script>/
const STRAY_SCRIPT = /<script(\s|>)/i

export interface SplitSnippet {
  declarations: string
  markup: string
}

// Split an optional leading instance `<script>` out of a snippet. The block is
// merged into the preamble's instance script at compile time; the editor still
// holds the combined text. Throws a reader-facing message on unsupported forms:
// attributes (including `module`/`context="module"`) or a second script.
export function splitLeadingScript(snippet: string): SplitSnippet {
  const match = LEADING_SCRIPT.exec(snippet)
  if (!match) {
    if (STRAY_SCRIPT.test(snippet)) {
      throw new Error('The snippet <script> block must be the first thing in the snippet.')
    }
    return { declarations: '', markup: snippet }
  }
  if (match[1].trim().length > 0) {
    throw new Error('The snippet <script> block must not have attributes; a module-context script is not supported.')
  }
  const markup = snippet.slice(match[0].length)
  if (STRAY_SCRIPT.test(markup)) {
    throw new Error('A snippet may declare at most one top-level <script> block.')
  }
  return { declarations: match[2], markup }
}

export interface BuildSourceOptions {
  markup: string
  declarations: string
  scopeKeys: string[]
  declaredNames: Set<string>
  // The component import block injected into the preamble. Derived from the
  // playground's `MODULE_REGISTRY` so the registry and the preamble cannot
  // drift; components resolve through it after `rewriteImports`.
  componentImports: string
}

// Assemble the compilable source: the preamble imports, per-key reactive state
// seeded from scope for every key the snippet does not declare itself (so a
// local declaration wins over a same-named scope value), then the snippet
// declarations, then markup. `$state` — not a plain destructure — so scope-fed
// bindings stay reactive to snippet-side writes even when a snippet-declared
// `<script>` flips the component into runes mode (where a bare `let` copy
// would silently stop updating).
export function buildSource({
  markup,
  declarations,
  scopeKeys,
  declaredNames,
  componentImports,
}: BuildSourceOptions): string {
  const names = scopeKeys.filter(key => !declaredNames.has(key))
  const scopeLine = names.length > 0 ? `${names.map(key => `  let ${key} = $state(__scope.${key})`).join('\n')}\n` : ''
  const body = declarations.replace(/^\s*\n/, '').replace(/\s+$/, '')
  const declarationLines = body.length > 0 ? `${body}\n` : ''
  return `<script>\n${componentImports}\n${scopeLine}${declarationLines}</script>\n${markup}`
}

// Collect the top-level binding names a parsed snippet `<script>` declares, so
// buildSource seeds only undeclared scope keys, so a local wins.
export function collectDeclaredNames(program: Program): Set<string> {
  const names = new Set<string>()
  for (const statement of program.body) {
    collectStatementNames(statement, names)
  }
  return names
}

function collectStatementNames(statement: Node, names: Set<string>): void {
  switch (statement.type) {
    case 'VariableDeclaration':
      for (const declarator of statement.declarations) {
        collectPatternNames(declarator.id, names)
      }
      break
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
      if (statement.id) {
        names.add(statement.id.name)
      }
      break
    case 'ImportDeclaration':
      for (const specifier of statement.specifiers) {
        names.add(specifier.local.name)
      }
      break
    default:
      break
  }
}

function collectPatternNames(node: Node | null, names: Set<string>): void {
  if (!node) {
    return
  }
  switch (node.type) {
    case 'Identifier':
      names.add(node.name)
      break
    case 'ObjectPattern':
      for (const property of node.properties) {
        if (property.type === 'RestElement') {
          collectPatternNames(property.argument, names)
        } else {
          collectPatternNames(property.value, names)
        }
      }
      break
    case 'ArrayPattern':
      for (const element of node.elements) {
        collectPatternNames(element, names)
      }
      break
    case 'AssignmentPattern':
      collectPatternNames(node.left, names)
      break
    case 'RestElement':
      collectPatternNames(node.argument, names)
      break
    default:
      break
  }
}

// Rewrite the compiler's ESM output for `new Function`: drop side-effect imports
// (version disclosure, legacy flags), bind namespace/default/named imports to
// the `__mods` registry, and turn the default export into the factory's return
// value.
export function rewriteImports(code: string): string {
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

// User-facing message for a compile or render failure: the message only, never
// the stack.
export function snippetErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return String(error)
}
