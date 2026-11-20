#!/usr/bin/env node
// Size-literal gate. A component that exposes a `size` prop must take its own
// chrome from the `--*` metric vars it emits; a literal length utility left in
// the markup or in a class map stays at the `md` step while the rest of the
// control scales. The ratio invariants only see the vars a component emits —
// this gate covers the other half, the classes that consume them.
//
// The scan covers the sized `.svelte` files plus the class-map modules they
// import (a shared style module is as much rendered chrome as inline markup).
//
// Run from the project root:
//   node tools/check-size-literals.mjs
// Exits non-zero and names every unaccounted token, so `npm run check` fails on
// a new `rounded-md` or `gap-2` inside a sized surface.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const COMPONENTS = 'src/lib/components'

// A component is sized when it declares the prop or forwards it from one that
// does (its props derived from a sized component's `ComponentProps`).
const SIZED = /size\??:\s*SizeInput|size\s*=\s*['"]md['"]/

// Class-map modules a sized surface renders through. The gate asserts each one
// is imported by a sized component, so the list cannot quietly point at a
// module that stopped mattering.
export const COMPANIONS = {
  'src/lib/components/select-dropdown-styles.ts': [
    { tokens: ['max-h-[min(50vh,20rem)]'], reason: 'panel viewport clamp' },
    { tokens: ['min-h-11'], reason: 'phone touch target' },
  ],
  'src/lib/components/grid-styles.ts': [],
  'src/lib/components/input-chrome.ts': [],
  'src/lib/components/text-input-metrics.ts': [],
  'src/lib/chip-variants.ts': [],
  'src/lib/dropdown-chrome.ts': [
    { tokens: ['max-h-[min(50vh,20rem)]'], reason: 'panel viewport clamp' },
    { tokens: ['rounded-xl'], reason: 'shared floating-panel radius, overlay chrome' },
    { tokens: ['w-64'], reason: 'fixed suggestion-panel width' },
  ],
}

// Tokens that are intentionally size-independent, keyed by file. Each entry is
// a layout guard (a viewport clamp or a fixed chrome floor) or a touch-target
// floor owned by another concern — never a control metric left unscaled. An
// entry that no longer appears also fails, so the list cannot rot.
export const ALLOWED = {
  ...COMPANIONS,
  'Button.svelte': [
    { tokens: ['min-h-11', 'min-w-11'], reason: 'phone touch target, constant by design' },
  ],
  'ColumnChooser.svelte': [
    { tokens: ['max-h-[50dvh]'], reason: 'viewport clamp on the floating panel' },
  ],
  'DataTable.svelte': [
    {
      tokens: ['max-h-[min(70vh,44rem)]', 'rounded-xl'],
      reason: 'bounded viewer card chrome, outside the table metrics',
    },
    { tokens: ['pr-0'], reason: 'docs chrome drops the trailing pad on the last column' },
    { tokens: ['inset-0'], reason: 'busy overlay covers the shell; it carries no control metric' },
  ],
  'DateField.svelte': [
    { tokens: ['max-w-[calc(100vw-1rem)]'], reason: 'viewport clamp on the calendar panel' },
  ],
  'FieldTable.svelte': [
    {
      tokens: ['gap-3', 'gap-4', 'rounded-md', 'px-3', 'py-2', 'text-xs'],
      reason: 'props-table editor dialog chrome, not the table rows',
    },
    { tokens: ['min-w-[36rem]'], reason: 'props-table column floor; narrower would overflow' },
    { tokens: ['h-96'], reason: 'code editor dialog height' },
  ],
  'LazyCodeEditor.svelte': [
    { tokens: ['min-h-[12rem]'], reason: 'loading placeholder floor' },
  ],
  'Menu.svelte': [
    {
      tokens: ['p-1', 'rounded-lg'],
      reason: 'the panel keeps its own documented metrics; only the trigger is sized',
    },
    { tokens: ['min-h-11'], reason: 'phone touch target on the sheet row' },
  ],
  'NumberInput.svelte': [{ tokens: ['min-h-6'], reason: 'coarse-pointer stepper floor' }],
  'StructureNode.svelte': [
    {
      tokens: ['gap-3', 'rounded-md', 'px-3', 'py-2', 'text-xs'],
      reason: 'inline editor dialog chrome',
    },
    { tokens: ['h-96'], reason: 'inline editor height' },
    { tokens: ['min-w-[2ch]'], reason: 'font-relative floor, so it scales with the text' },
    { tokens: ['w-12'], reason: 'phone gutter override' },
  ],
  'Tabs.svelte': [
    {
      tokens: ['gap-2', 'pb-3'],
      reason: 'nav-to-toolbar row spacing, layout rather than tab chrome',
    },
  ],
  'TagInput.svelte': [{ tokens: ['h-11', 'min-h-11', 'w-11'], reason: 'phone touch target' }],
  'TextArea.svelte': [{ tokens: ['h-11', 'w-11'], reason: 'phone touch target' }],
  'TextInput.svelte': [{ tokens: ['h-11', 'w-11'], reason: 'phone touch target' }],
  'Toast.svelte': [
    {
      tokens: ['top-4', 'right-4', 'bottom-4', 'inset-x-4', 'w-96'],
      reason: 'viewport-edge docking geometry',
    },
  ],
}

// Structural layout that carries no metric of the control.
const STRUCTURAL = new Set([
  'min-w-0',
  'min-h-0',
  'max-w-full',
  'min-w-full',
  'w-full',
  'h-full',
  'w-fit',
  'h-fit',
  'w-max',
  'w-auto',
  'h-auto',
  'p-0',
  'm-0',
  'top-0',
  'left-0',
  'right-0',
  'bottom-0',
  'top-1/2',
  'left-1/2',
  'inset-x-0',
  'inset-y-0',
  'basis-0',
  'rounded-full',
])

// Length utilities that name a metric rather than a position.
const TOKEN =
  /(?<![\w-])((?:text|leading|tracking)-(?:xs|sm|base|lg|xl|2xl|\[[^\]]+\])|(?:p|px|py|pt|pb|pl|pr|gap|gap-x|gap-y|space-x|space-y)-(?:\d+(?:\.\d+)?|px|\[[^\]]+\])|(?:w|h|min-w|max-w|min-h|max-h|basis|size)-(?:\d+(?:\.\d+)?|px|\[[^\]]+\])|(?:top|left|right|bottom|inset|inset-x|inset-y)-(?:\d+(?:\.\d+)?|px|\[[^\]]+\])|rounded(?:-[a-z]+)?(?:-\[[^\]]+\])?)(?![\w/-])/g

// Drop comments and `var(--…)` references while keeping the line structure, so
// the scan reads the classes that actually render and the reported line is real.
function renderedText(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, m => '\n'.repeat(m.split('\n').length - 1))
    .replace(/\/\*[\s\S]*?\*\//g, m => '\n'.repeat(m.split('\n').length - 1))
    .replace(/^[ \t]*\/\/.*$/gm, '')
}

function literalTokens(source) {
  const found = []
  for (const match of renderedText(source).matchAll(TOKEN)) {
    const token = match[1]
    if (STRUCTURAL.has(token) || token.includes('var(--')) continue
    found.push(token)
  }
  return found
}

function readSizedComponents(root) {
  const dir = join(root, COMPONENTS)
  return readdirSync(dir)
    .filter(name => name.endsWith('.svelte') && !name.includes('harness'))
    .map(name => ({ name, source: readFileSync(join(dir, name), 'utf8') }))
    .filter(({ source }) => SIZED.test(source))
}

// Every file the gate reads, keyed by its allowlist name: the sized components
// (basename) plus the class-map modules (project-relative path).
export function collectSources(root, companions = Object.keys(COMPANIONS)) {
  const sources = new Map()
  for (const { name, source } of readSizedComponents(root)) sources.set(name, source)
  for (const path of companions) {
    if (existsSync(join(root, path))) sources.set(path, readFileSync(join(root, path), 'utf8'))
  }
  return sources
}

export function collectViolations(root, allowed = ALLOWED, companions = Object.keys(COMPANIONS)) {
  const sources = collectSources(root, companions)
  const violations = []
  const sized = [...sources.entries()].filter(([name]) => name.endsWith('.svelte'))

  for (const [name, source] of sized) {
    const permitted = new Set((allowed[name] ?? []).flatMap(entry => entry.tokens))
    const unaccounted = [...new Set(literalTokens(source))].filter(token => !permitted.has(token))
    if (unaccounted.length > 0) {
      violations.push(`${name}: ${unaccounted.join(', ')} — scale it with a --* var or allowlist it with a reason`)
    }
  }

  for (const path of companions) {
    const source = sources.get(path)
    if (source === undefined) {
      violations.push(`${path}: companion module is missing`)
      continue
    }
    const imported = sized.some(([, text]) => text.includes(path.split('/').pop().replace(/\.ts$/, '')))
    if (!imported) {
      violations.push(`${path}: no sized component imports this companion module; remove it from COMPANIONS`)
    }
    const permitted = new Set((allowed[path] ?? []).flatMap(entry => entry.tokens))
    const unaccounted = [...new Set(literalTokens(source))].filter(token => !permitted.has(token))
    if (unaccounted.length > 0) {
      violations.push(`${path}: ${unaccounted.join(', ')} — scale it with a --* var or allowlist it with a reason`)
    }
  }

  for (const name of Object.keys(allowed)) {
    const literals = sources.get(name)
    if (literals === undefined) {
      violations.push(`${name}: allowlisted but not a sized surface or companion module; remove the entry`)
      continue
    }
    const seen = new Set(literalTokens(literals))
    const stale = allowed[name].flatMap(entry => entry.tokens).filter(token => !seen.has(token))
    if (stale.length > 0) {
      violations.push(`${name}: stale allowlist entries (${stale.join(', ')}); remove them`)
    }
  }

  return violations
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const violations = collectViolations(root)
  if (violations.length === 0) {
    const sources = collectSources(root)
    console.log(`size-literals: ${sources.size} sized surface(s), every chrome literal accounted for`)
    return
  }
  console.error('size-literals: sized surfaces must not leave chrome at the md step')
  for (const violation of violations) console.error(`  ${violation}`)
  process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
