#!/usr/bin/env node
// package/migrate-consumer.mjs — move an app from vendored copies to the package.
//
// An app that vendored the shared surface keeps a copy of every component and
// icon; the package delivers one compiled copy to every consumer. This script
// performs the mechanical half of that move:
//
//   1. it deletes the app's copies of the canonical files,
//   2. it repoints every specifier that named them at the package.
//
// The hand work it cannot do: the app's i18n adapter (its dictionary merges
// over the shared one), the stylesheet (it imports the package's), and the
// dependency itself.
//
// Usage:
//   node package/migrate-consumer.mjs <app-root> [--package <name>] [--dry-run]
//
// The canonical surface is this repository's `src/lib`, so the script is
// always run from the canonical checkout.
//
// The vendored set is derived, not listed: every file under `src/lib` except
// the package's private directories and the modules the app keeps its own (its
// dictionaries, its i18n store, its index barrel). A new shared module is
// therefore migrated without editing this script.

import { existsSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { LIB as CANONICAL_LIB, PACKAGE_NAME as DEFAULT_PACKAGE, PRIVATE_DIRS, ROOT } from './build.mjs'

const args = process.argv.slice(2)
// The app root is the first positional argument; `--package` renames the
// package this migration points the app at.
let parsed
try {
  parsed = parseArgs({
    args,
    options: {
      package: { type: 'string', default: DEFAULT_PACKAGE },
      'dry-run': { type: 'boolean', default: false },
    },
    allowPositionals: true,
  })
} catch (error) {
  console.error(`migrate: ${error.message}`)
  process.exit(2)
}
const packageName = parsed.values.package
const dryRun = parsed.values['dry-run']
const appRoot = resolve(parsed.positionals[0] ?? process.cwd())
const appLib = join(appRoot, 'src', 'lib')

// The modules the app keeps as its own: its dictionaries carry its labels, its
// i18n store becomes the adapter over the package's (with its test), and it may
// own an index barrel. Everything else under `src/lib` is a vendored copy of
// the surface.
const APP_OWNED = new Set(['locales', 'i18n.svelte.ts', 'i18n.test.ts', 'index.ts'])

if (!existsSync(appLib)) {
  console.error(`migrate: ${appRoot} has no src/lib`)
  process.exit(1)
}

// The canonical repository holds the sources, not a copy of them; migrating it
// would delete the package's own surface.
if (appRoot === ROOT) {
  console.error('migrate: the canonical repository is not a consumer')
  process.exit(1)
}

/** Every file an app vendors, relative to the canonical `src/lib`. */
function canonicalFiles() {
  const files = []
  function collect(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name)
      // The exceptions are root-level: a nested `locales/` is shared code.
      if (dir === CANONICAL_LIB && (PRIVATE_DIRS.has(entry.name) || APP_OWNED.has(entry.name))) continue
      if (entry.isDirectory()) collect(abs)
      else files.push(relative(CANONICAL_LIB, abs))
    }
  }
  collect(CANONICAL_LIB)
  return files.sort()
}

const CANONICAL_FILES = canonicalFiles()

/** The app's copies of the canonical files: the ones to delete. */
function vendoredFiles() {
  const files = new Set()
  for (const rel of CANONICAL_FILES) {
    const abs = join(appLib, rel)
    if (existsSync(abs)) files.add(abs)
  }
  return files
}

/**
 * The specifier a consumer writes: the source path without the extension the
 * compiler adds.
 */
function packageSpecifier(abs) {
  const rel = relative(appLib, abs).split(/[\\/]/).join('/')
  const natural = rel.endsWith('.svelte.ts')
    ? rel.slice(0, -'.svelte.ts'.length) + '.svelte'
    : rel.endsWith('.ts')
      ? rel.slice(0, -'.ts'.length)
      : rel
  return `${packageName}/${natural}`
}

const vendored = vendoredFiles()
console.log(`migrate: ${vendored.size} vendored copies in ${relative(ROOT, appRoot) || appRoot}`)

// The specifiers that name a deleted file, in every source file of the app.
const SPECIFIER_RE = /(\bfrom\s*|\bimport\s*|\bimport\(\s*)(['"])([^'"]+)\2/g
const SUFFIXES = ['', '.ts', '.svelte.ts', '.svelte', '.js', '.mjs']

// Every source file of the app, not only those under `src/`: a test or a
// script can import the shared surface too.
const SKIP_DIRS = new Set(['node_modules', '.svelte-kit', '.worktrees', '.tmp', 'build', 'dist', 'coverage'])
const sources = []
function collectSources(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) collectSources(abs)
    else if (/\.(ts|svelte|js|mjs)$/.test(entry.name)) sources.push(abs)
  }
}
collectSources(appRoot)
let rewrittenFiles = 0
let rewrittenSpecifiers = 0

for (const file of sources) {
  const text = readFileSync(file, 'utf8')
  const next = text.replace(SPECIFIER_RE, (match, lead, quote, specifier) => {
    if (!specifier.startsWith('.') && !specifier.startsWith('$lib/')) return match
    const base = specifier.startsWith('$lib/')
      ? join(appLib, specifier.slice('$lib/'.length))
      : resolve(dirname(file), specifier)
    for (const suffix of SUFFIXES) {
      const candidate = base + suffix
      if (!vendored.has(candidate)) continue
      rewrittenSpecifiers++
      return `${lead}${quote}${packageSpecifier(candidate)}${quote}`
    }
    return match
  })
  if (next !== text) {
    if (!dryRun) writeFileSync(file, next)
    rewrittenFiles++
  }
}

let removed = 0
for (const file of vendored) {
  if (!dryRun) unlinkSync(file)
  removed++
}
if (!dryRun) {
  // A directory that held only vendored files goes with them, deepest first so
  // a nested chain empties before its parent.
  const ancestors = new Set()
  for (const file of vendored) {
    for (let dir = dirname(file); dir.length > appLib.length; dir = dirname(dir)) ancestors.add(dir)
  }
  for (const dir of [...ancestors].sort((a, b) => b.length - a.length)) {
    if (existsSync(dir) && readdirSync(dir).length === 0) rmdirSync(dir)
  }
}

console.log(`migrate: ${dryRun ? 'would rewrite' : 'rewrote'} ${rewrittenSpecifiers} specifiers across ${rewrittenFiles} files`)
console.log(`migrate: ${dryRun ? 'would remove' : 'removed'} ${removed} vendored files`)

// The app's i18n store becomes an adapter over the package's: its own
// dictionary merges over the shared one, and the store, the context and the
// lookup come from the package. The app's locale list and storage key are
// kept as they are.
const adapter = writeAdapter(appLib, dryRun)
console.log(
  adapter
    ? `migrate: ${dryRun ? 'would write' : 'wrote'} the i18n adapter`
    : 'migrate: no i18n store to adapt',
)
console.log('migrate: hand work left — the stylesheet, the dependency')

/**
 * Write the app's i18n adapter, keeping the app's own locale list, storage
 * key and dictionary imports.
 */
function writeAdapter(lib, dryRun) {
  const source = join(lib, 'i18n.svelte.ts')
  if (!existsSync(source)) return false
  const text = readFileSync(source, 'utf8')

  const localeType = /export type Locale = .*/.exec(text)?.[0]
  const locales = /export const LOCALES[\s\S]*?\n\]/.exec(text)?.[0]
  const storageKey = /const STORAGE_KEY[^\n]*/.exec(text)?.[0]
  if (!localeType || !locales || !storageKey) return false

  const dictionaries = [...text.matchAll(/import \{ (\w+) \} from '\.\/locales\/([\w-]+)'/g)].map(
    (match) => ({ local: match[1], file: match[2] }),
  )
  if (dictionaries.length === 0) return false

  // The shared import keeps the local name, so the merge reads as the app's
  // dictionary over the shared one.
  const sharedName = (local) => `shared${local.charAt(0).toUpperCase()}${local.slice(1)}`
  const shared = dictionaries.map((entry) => `import { ${entry.local} as ${sharedName(entry.local)} } from '${packageName}/locales/${entry.file}'`)
  const own = dictionaries.map((entry) => `import { ${entry.local} } from './locales/${entry.file}'`)

  const adapterText = `// i18n.svelte.ts — the app's translations, over the package's store.
//
// The shared components read their labels through the package's store, so the
// app sets that store: its own dictionary carries the app's keys, the
// package's dictionary carries the shared ones, and the app's key wins where
// both define a name. The store itself, the context and the lookup come from
// the package, so there is exactly one store in the app.

import {
  createI18nStore,
  getI18nContext as getPackageI18nContext,
  setDefaultI18nStore,
  setI18nContext as setPackageI18nContext,
} from '${packageName}/i18n.svelte'
import type { I18nStore as PackageI18nStore } from '${packageName}/i18n.svelte'
${shared.join('\n')}
${own.join('\n')}

${localeType}

// Switcher entries; every locale is labelled in its own language.
${locales}

${storageKey}

// The app's store: the shared dictionary under the app's own, so a shared
// label the app does not define still resolves. The merge is deep: a shallow
// spread would replace a whole group, so the shared keys inside a group the
// app also defines would be lost. The key union comes from the merged
// dictionary, so a shared component's key and the app's own key are both part
// of it.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// The type-level twin of the runtime merge below: a group both dictionaries
// define carries both key sets, and the app's value wins on a conflict. An
// intersection type cannot express this — a key only one side defines would
// read as \`never\` and vanish from the key union.
type MergedDictionaries<TShared, TOwn> = {
  [K in keyof TShared | keyof TOwn]: K extends keyof TOwn
    ? TOwn[K] extends Record<string, unknown>
      ? K extends keyof TShared
        ? TShared[K] extends Record<string, unknown>
          ? MergedDictionaries<TShared[K], TOwn[K]>
          : TOwn[K]
        : TOwn[K]
      : TOwn[K]
    : K extends keyof TShared
      ? TShared[K]
      : never
}

function mergeDictionary<TShared extends Record<string, unknown>, TOwn extends Record<string, unknown>>(
  shared: TShared,
  own: TOwn,
): MergedDictionaries<TShared, TOwn> {
  const merged: Record<string, unknown> = { ...shared }
  for (const [key, value] of Object.entries(own)) {
    const base = merged[key]
    merged[key] = isPlainObject(base) && isPlainObject(value) ? mergeDictionary(base, value) : value
  }
  return merged as MergedDictionaries<TShared, TOwn>
}

// Dotted-path key union over the merged dictionary. Call sites keep using the
// same strings; only the dictionary shape changed.
type DottedKey<T> = {
  [K in keyof T & string]: T[K] extends string ? K : \`\${K}.\${DottedKey<T[K]>}\`
}[keyof T & string]

const dictionaries = {
${dictionaries.map((entry) => `  '${entry.file}': mergeDictionary(${sharedName(entry.local)}, ${entry.local}),`).join('\n')}
}

export type MessageKey = DottedKey<typeof dictionaries.en>

// The store factory is the package's; the app re-exports it so its own tests
// and helpers build a store the same way.
export { createI18nStore }

// The store type is the package's, keyed by the app's dictionary: a shared
// component reads the store it is handed, and the app's own keys have to be
// part of it.
export type I18nStore<TKey extends string = MessageKey, TLocale extends string = Locale> = PackageI18nStore<
  TKey,
  TLocale
>

export function createAppI18n() {
  return createI18nStore<MessageKey, Locale>(dictionaries, 'en', STORAGE_KEY)
}

// The app's store is the fallback for a component rendered without a provider
// (a test, an island), so the app's own labels resolve there too.
setDefaultI18nStore(() => createAppI18n())

export function setI18nContext(store: ReturnType<typeof createAppI18n>) {
  return setPackageI18nContext(store)
}

export function getI18nContext() {
  return getPackageI18nContext<MessageKey>()
}
`
  if (!dryRun) writeFileSync(source, adapterText)
  return true
}
