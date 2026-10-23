#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { join, posix } from 'node:path'
import { ROOT } from '../scripts/lib/root.mjs'

// Drift gate for the shared UI surface. `ui-lib` is the canonical source; a
// sibling app must carry byte-identical copies of the shared directories and
// files it actually uses, apart from the documented per-project exceptions.
// Run from the `ui-lib` root:
//   node tools/check-shared-parity.mjs
// The gate resolves each sibling's own module references (imports plus literal
// path references such as `node scripts/foo.mjs` in package.json), so it reasons
// about usage, not mere presence:
//   diverged  present, referenced, differs from the canonical copy -> exits 1
//   dead-port present, unreferenced -> deletion candidate (advisory; pass
//             `--strict` to fail on these too). Detected for `src/lib/**` only:
//             shared scripts are program entry points, not imports.
//   missing   referenced but absent from the sibling -> real port candidate
//   (an absent, unreferenced file is omitted: the app does not need it)
// Exits non-zero so a port that was not synced back is caught in `check` rather
// than discovered later.

const SELF = 'ui-lib'
// Config root: the `~/.agents` checkout that carries the project registry and
// the parser dependency.
const CONFIG_ROOT = process.env.AI_CONFIG_DIR ?? join(process.env.HOME ?? '', '.agents')
const REGISTRY = join(CONFIG_ROOT, '.metadata', 'projects.yml')

// Shared surface, by convention: every file under these directories is
// canonical. App-private code stays out of them (ui-lib's own chrome lives
// under src/routes/_chrome/), so no per-file list is maintained here.
const SHARED_DIRS = [
  'src/lib/components',
  'src/lib/icons',
  'src/lib/actions',
  'src/lib/data-table',
  'scripts',
]

// Top-level shared modules. src/lib/ also holds app-private modules,
// subdirectories, locales, and tests, so only these files are gated.
const SHARED_FILES = [
  'src/lib/app-shell.ts',
  'src/lib/dropdown-chrome.ts',
  'src/lib/position-panel.svelte.ts',
  'src/lib/size-scale.ts',
  'src/lib/text-size.ts',
]

// Shared server utilities carried byte-identically by the consuming apps. A
// directory named `server` marks its content server-only in SvelteKit, so the
// app cannot pull these into a client bundle.
const SHARED_SERVER_FILES = [
  'src/lib/server/card.ts',
  'src/lib/server/cron-expression.ts',
  'src/lib/server/d1-binding.mjs',
  'src/lib/server/log-format.mjs',
  'src/lib/server/sql-rewrite.mjs',
]

// Never gated: a test file, the fixture a test drives, and a test directory.
// The layout gate (`tools/check-test-layout.mjs`) keeps a test beside the
// module it exercises, so these never reach the ported surface.
const SKIP_FILE_RE = /(\.test\.[a-z]+|\.harness\.svelte)$/
const SKIP_DIRS = new Set(['__tests__'])

function walk(dir) {
  const out = []
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...walk(rel))
    } else if (!SKIP_FILE_RE.test(entry.name)) {
      out.push(rel)
    }
  }
  return out
}

const SHARED = [...SHARED_DIRS.flatMap(walk), ...SHARED_FILES, ...SHARED_SERVER_FILES].sort()

// Per-project exceptions with the reason each may legitimately differ. A
// two-element entry exempts the file for every app; a three-element entry
// `[app, path, reason]` exempts it for that app alone, so the canonical copy is
// still byte-compared against the other apps. A file that carries no
// project-specific content left (the schema apply script) is compared
// byte-for-byte and excepted per app only for the apps still carrying their
// own fork.
const EXCEPTIONS = [
  ['src/lib/column-width-storage.ts', 'per-app storage-key prefix'],
  ['src/lib/i18n.svelte.ts', 'per-app locale dictionaries'],
  ['scripts/db-config.mjs', 'per-project database configuration fork'],
  ['scripts/deploy.config.mjs', 'project-owned plugin/target-availability/required-env selection'],
  ['scripts/lib/cron-job.mjs', 'per-app scan job title'],
  ['project-catalog', 'scripts/apply-schema.mjs', 'per-project schema fork'],
  ['session-catalog', 'src/lib/server/cron-expression.ts', 'session-catalog has no scheduler; the cron parser is unused'],
  ['oms', 'src/lib/components/BaseDialog.svelte', 'oms adoption pending its in-flight full implementation'],
  ['oms', 'src/lib/components/SelectDropdown.svelte', 'oms adoption pending its in-flight full implementation'],
  [
    'oms',
    'src/lib/components/select-dropdown-styles.ts',
    'oms adoption pending its in-flight full implementation',
  ],
  [
    'project-catalog',
    'src/lib/components/EditableText.svelte',
    'project-catalog has an in-flight EditableText rewrite; the file is unreferenced until that work lands',
  ],
  [
    'project-catalog',
    'src/lib/text-size.ts',
    'project-catalog has an in-flight EditableText rewrite; the module it imports is unreferenced until that work lands',
  ],
]
const globalExceptions = new Set(EXCEPTIONS.filter(entry => entry.length === 2).map(([p]) => p))
const appExceptions = EXCEPTIONS.filter(entry => entry.length === 3)
const isAppExcepted = (app, rel) => appExceptions.some(([name, p]) => name === app && p === rel)

// The registry is YAML: parse it with the `yaml` package resolved from the
// config root, and fail fast (with the file and location) on malformed content.
// Only an absent registry means "no data" and yields no siblings.
function readRegistry() {
  if (!existsSync(REGISTRY)) return null
  let parseYaml
  let resolveError
  // Prefer the config root; fall back to the project's own install so the gate
  // keeps working when the config root carries the registry but not the parser.
  for (const base of [CONFIG_ROOT, ROOT]) {
    try {
      parseYaml = createRequire(join(base, 'package.json'))('yaml').parse
      break
    } catch (error) {
      // Record the failure so the hard error below can name the cause, then try
      // the next resolution base.
      resolveError = error
    }
  }
  if (!parseYaml) {
    console.error(`shared-parity: the \`yaml\` package is required to read ${REGISTRY}`)
    console.error(`shared-parity: install it beside the config root: (cd ${CONFIG_ROOT} && npm install yaml)`)
    if (resolveError) console.error(`shared-parity: last resolution error: ${resolveError.message}`)
    process.exit(2)
  }
  let document
  try {
    document = parseYaml(readFileSync(REGISTRY, 'utf8'))
  } catch (error) {
    console.error(`shared-parity: failed to parse ${REGISTRY}: ${error.message}`)
    process.exit(2)
  }
  const entries = document?.projects
  if (!Array.isArray(entries)) {
    console.error(`shared-parity: ${REGISTRY} must carry a top-level \`projects\` list`)
    process.exit(2)
  }
  return entries.map((entry, index) => {
    const name = entry?.name
    const path = entry?.path
    if (typeof name !== 'string' || !name || typeof path !== 'string' || !path) {
      console.error(`shared-parity: ${REGISTRY}:projects[${index}] must carry string \`name\` and \`path\``)
      process.exit(2)
    }
    return { name, path }
  })
}

function projectPaths() {
  const entries = readRegistry()
  if (entries === null) return []
  return entries.filter(e => e.name !== SELF && !isExceptedName(e.name))
}

// Non-SvelteKit siblings carry no shared UI surface.
const isExceptedName = name => name === 'ai'

// Content plus the executable bit: a sibling that loses `chmod +x` on a shared
// script still byte-matches, so the shebang stops being honoured there and the
// gate would report parity it does not have.
const hash = p =>
  createHash('md5')
    .update(readFileSync(p))
    .update(statSync(p).mode & 0o111 ? '\0executable' : '\0plain')
    .digest('hex')

// --- Usage analysis ---------------------------------------------------------
// Map the shared surface a sibling actually uses, so the gate can tell a file
// the app references from one it merely carries. A shared file is "live" when a
// non-shared file (a route, app module, test, or script) imports it, directly
// or through other shared files, or names it literally where scripts are
// invoked (package.json). A live file's own imports become live too, so a whole
// orphaned cluster — a dead component and the helpers only it imports — reads
// as dead, not just its root. Bare package and `$app`/`$env` specifiers are
// ignored; `$lib` maps to `src/lib` in every sibling.

// Sources plus the places a standalone script can be invoked from.
const USAGE_DIRS = ['src', 'scripts', 'test', 'e2e', 'tests', '.github']
const USAGE_EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs', '.svelte', '.json']
const USAGE_SKIP_DIRS = new Set([
  'node_modules', '.git', '.svelte-kit', '.vercel', '.wrangler', '.netlify',
  'build', 'dist', 'coverage', 'test-results', '.tmp', '.data', 'archive',
  '.worktrees',
])
// On-disk candidates a specifier may resolve to, so an extensionless import
// (`$lib/size-scale`) still matches `src/lib/size-scale.ts`.
const MODULE_SUFFIXES = ['', '.ts', '.js', '.mjs', '.cjs', '.svelte', '.json']
const MODULE_INDEX_SUFFIXES = ['/index.ts', '/index.js', '/index.mjs', '/index.svelte']
// `from '...' | import '...' | import('...')`. A match inside a string or
// comment is harmless: it only matters if it resolves to a shared path.
const SPECIFIER_RE = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g

const SHARED_SET = new Set(SHARED)

// Dead-port detection applies to the import-reachable surface only. A shared
// script is a program entry point invoked by hand or named in docs, not an
// import, so a script with no importer is not evidence that it is unused.
const DEAD_PORT_SCOPE = /^src\/lib\//

function resolveSpecifier(specifier, importerRel) {
  const clean = specifier.split('?')[0].split('#')[0]
  if (!clean) return []
  let base
  if (clean === '$lib') base = 'src/lib'
  else if (clean.startsWith('$lib/')) base = `src/lib/${clean.slice(5)}`
  else if (clean.startsWith('./') || clean.startsWith('../')) {
    base = posix.normalize(posix.join(posix.dirname(importerRel), clean))
    if (base.startsWith('..')) return []
  } else return []
  const out = []
  for (const suffix of MODULE_SUFFIXES) out.push(base + suffix)
  for (const suffix of MODULE_INDEX_SUFFIXES) out.push(base + suffix)
  return out
}

// Read every source file once: collect each specifier's candidate paths, the
// edges into shared files, and the concatenated text of the app's own modules
// for literal path references.
function collectUsage(projectPath) {
  const importTargets = new Set()
  const sharedEdges = new Map()
  const nonShared = new Set()
  const seen = new Set()
  let externalCorpus = ''
  const read = rel => {
    let text
    try {
      text = readFileSync(join(projectPath, rel), 'utf8')
    } catch (error) {
      // An unreadable source file cannot contribute edges; surface it so a
      // permissions or encoding problem is not silently treated as "unused".
      console.warn(`shared-parity: could not read ${rel}: ${error.message}`)
      return
    }
    const candidates = new Set()
    for (const match of text.matchAll(SPECIFIER_RE)) {
      for (const candidate of resolveSpecifier(match[1], rel)) {
        importTargets.add(candidate)
        candidates.add(candidate)
      }
    }
    const hits = new Set()
    for (const candidate of candidates) if (SHARED_SET.has(candidate)) hits.add(candidate)
    if (hits.size > 0) sharedEdges.set(rel, hits)
    if (!SHARED_SET.has(rel)) {
      nonShared.add(rel)
      externalCorpus += `\n${text}`
    }
  }
  const visit = rel => {
    const abs = join(projectPath, rel)
    if (!existsSync(abs)) return
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const child = `${rel}/${entry.name}`
      if (entry.isDirectory()) {
        if (USAGE_SKIP_DIRS.has(entry.name)) continue
        if (entry.name.startsWith('.') && entry.name !== '.github') continue
        visit(child)
      } else if (USAGE_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        if (seen.has(child)) continue
        seen.add(child)
        read(child)
      }
    }
  }
  for (const dir of USAGE_DIRS) visit(dir)
  read('package.json')
  return { importTargets, externalCorpus, live: liveShared({ sharedEdges, nonShared, externalCorpus }) }
}

// Breadth-first reachability from the app's own files into the shared surface.
function liveShared({ sharedEdges, nonShared, externalCorpus }) {
  const live = new Set()
  const queue = [...nonShared]
  for (const rel of SHARED) {
    if (externalCorpus.includes(rel)) live.add(rel)
  }
  queue.push(...live)
  const expanded = new Set(queue)
  while (queue.length > 0) {
    const targets = sharedEdges.get(queue.shift())
    if (!targets) continue
    for (const target of targets) {
      if (live.has(target)) continue
      live.add(target)
      if (!expanded.has(target)) {
        expanded.add(target)
        queue.push(target)
      }
    }
  }
  return live
}

const apps = projectPaths()
if (apps.length === 0) {
  const message = 'shared-parity: no registered sibling projects found; nothing to compare'
  // `--strict` is the gate CI and `npm run check` run: with no registry it can
  // only pass vacuously, so fail instead of reporting parity it never checked.
  if (process.argv.includes('--strict')) {
    console.error(message)
    console.error('shared-parity: --strict cannot verify parity without the project registry (~/.agents/.metadata/projects.yml)')
    process.exit(1)
  }
  console.log(message)
  process.exit(0)
}
if (!existsSync(join(ROOT, 'src', 'lib'))) {
  console.error('shared-parity: run this from the ui-lib project root')
  process.exit(2)
}

const diverged = []
const missing = []
const deadPorts = []
const notNeeded = []
let compared = 0

const usageCache = new Map()
const usageFor = app => {
  if (!usageCache.has(app.path)) usageCache.set(app.path, collectUsage(app.path))
  return usageCache.get(app.path)
}

for (const rel of SHARED) {
  if (globalExceptions.has(rel)) continue
  const canonical = join(ROOT, rel)
  if (!existsSync(canonical)) {
    console.error(`shared-parity: canonical file missing: ${rel}`)
    process.exit(2)
  }
  const want = hash(canonical)
  for (const app of apps) {
    if (isAppExcepted(app.name, rel)) continue
    const usage = usageFor(app)
    const target = join(app.path, rel)
    if (existsSync(target)) {
      if (DEAD_PORT_SCOPE.test(rel) && !usage.live.has(rel)) {
        deadPorts.push(`${app.name}: ${rel}`)
        continue
      }
      compared += 1
      if (hash(target) !== want) diverged.push(`${app.name}: ${rel}`)
    } else if (usage.importTargets.has(rel) || usage.externalCorpus.includes(rel)) {
      missing.push(`${app.name}: ${rel}`)
    } else {
      notNeeded.push(`${app.name}: ${rel}`)
    }
  }
}

if (deadPorts.length > 0) {
  console.log(`shared-parity: ${deadPorts.length} present file(s) nothing in the app references (dead ports):`)
  for (const d of deadPorts) console.log(`  dead     ${d}`)
  console.log(`  Delete them, or add a documented per-app exception if the file is intentionally unused.`)
}
if (missing.length > 0) {
  console.log(`shared-parity: ${missing.length} file(s) referenced but absent from a sibling (port candidates):`)
  for (const m of missing) console.log(`  absent   ${m}`)
}
if (notNeeded.length > 0) {
  console.log(`shared-parity: ${notNeeded.length} shared file(s) absent and unreferenced (not needed by the app)`)
}
if (diverged.length > 0) {
  console.log(`shared-parity: ${diverged.length} file(s) diverged from the canonical copy:`)
  for (const d of diverged) console.log(`  diverged ${d}`)
  console.log(`\nPort the canonical version with the unify skill, or add a documented exception.`)
  process.exit(1)
}
if (process.argv.includes('--strict') && deadPorts.length > 0) {
  console.log(`\nshared-parity: --strict fails on dead ports; delete them or add a documented exception.`)
  process.exit(1)
}

console.log(
  `shared-parity: ${compared} comparison(s) across ${apps.length} project(s), no unexpected divergence`,
)
