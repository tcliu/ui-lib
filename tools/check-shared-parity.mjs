#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { join, posix, resolve } from 'node:path'
import { ROOT } from '../scripts/lib/root.mjs'

// Drift gate for the shared surface. This checkout is the canonical source; a
// sibling app must carry byte-identical copies of the shared directories and
// files it actually uses, apart from the forks the app declares in its own
// `shared-parity.json`.
// Run from the canonical project root:
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

// The gate surface is derived, not listed: everything the canonical project
// carries that every app must keep byte-identical. `src/lib` publishes, so it is
// gated wholesale apart from the app's own modules; `scripts/` is the shared
// operations bundle (repo-local tooling lives in `tools/`, which is not gated).
const GATED_SOURCES = ['src/lib', 'scripts']
// App-only directories under `src/lib` (never published, never ported).
const PRIVATE_DIRS = new Set(['app', 'showcase'])
// Files each app owns and may legitimately differ: the package entry, its
// dictionaries and store, its storage-key prefix, its logger wiring, and the
// project-owned deploy/database config.
const APP_OWNED = new Set([
  'src/lib/index.ts',
  'src/lib/i18n.svelte.ts',
  'src/lib/column-width-storage.ts',
  'src/lib/locales',
  'src/lib/server/logging.ts',
  'scripts/db-config.mjs',
  'scripts/deploy.config.mjs',
  'scripts/lib/cron-job.mjs',
])

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
    if (APP_OWNED.has(rel)) continue
    if (dir === 'src/lib' && PRIVATE_DIRS.has(entry.name)) continue
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...walk(rel))
    } else if (!SKIP_FILE_RE.test(entry.name)) {
      out.push(rel)
    }
  }
  return out
}

const SHARED = GATED_SOURCES.flatMap(dir => walk(dir)).sort()

// Config root: the `~/.agents` checkout that carries the project registry and
// the parser dependency.
const CONFIG_ROOT = process.env.AI_CONFIG_DIR ?? join(process.env.HOME ?? '', '.agents')
const REGISTRY = join(CONFIG_ROOT, '.metadata', 'projects.yml')

/**
 * The forks a project declares for itself, with the reason it keeps them. The
 * canonical gate carries no project names: an app that must diverge says so in
 * its own `shared-parity.json`, and a declaration that no longer differs is
 * reported as stale so the list can only shrink.
 */
function declaredForks(app) {
  const file = join(app.path, 'shared-parity.json')
  if (!existsSync(file)) return { forks: new Set(), stale: [] }
  let parsed
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    console.error(`shared-parity: failed to parse ${file}: ${error.message}`)
    process.exit(2)
  }
  const entries = parsed?.forks
  if (!Array.isArray(entries)) {
    console.error(`shared-parity: ${file} must carry a \`forks\` list`)
    process.exit(2)
  }
  const forks = new Set()
  const stale = []
  for (const [index, entry] of entries.entries()) {
    if (typeof entry?.path !== 'string' || !entry.path || typeof entry?.reason !== 'string' || !entry.reason) {
      console.error(`shared-parity: ${file}:forks[${index}] must carry string \`path\` and \`reason\``)
      process.exit(2)
    }
    forks.add(entry.path)
  }
  return { forks, stale }
}

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
  // The canonical checkout is the source, not a consumer; an entry without a
  // `src/lib` tree carries no shared surface.
  return entries.filter(
    entry => resolve(entry.path) !== resolve(ROOT) && existsSync(join(entry.path, 'src', 'lib')),
  )
}

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
  console.error('shared-parity: run this from the canonical project root')
  process.exit(2)
}

const diverged = []
const missing = []
const deadPorts = []
const notNeeded = []
let compared = 0

const declarations = new Map(apps.map(app => [app.name, declaredForks(app)]))
const usageCache = new Map()
const usageFor = app => {
  if (!usageCache.has(app.path)) usageCache.set(app.path, collectUsage(app.path))
  return usageCache.get(app.path)
}

for (const rel of SHARED) {
  const canonical = join(ROOT, rel)
  if (!existsSync(canonical)) {
    console.error(`shared-parity: canonical file missing: ${rel}`)
    process.exit(2)
  }
  const want = hash(canonical)
  for (const app of apps) {
    if (declarations.get(app.name).forks.has(rel)) continue
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

const staleDeclarations = []
for (const app of apps) {
  for (const rel of declarations.get(app.name).forks) {
    const target = join(app.path, rel)
    const canonical = join(ROOT, rel)
    if (existsSync(target) && existsSync(canonical) && hash(target) === hash(canonical)) {
      staleDeclarations.push(`${app.name}: ${rel}`)
    }
  }
}
if (staleDeclarations.length > 0) {
  console.log(`shared-parity: ${staleDeclarations.length} stale declaration(s) (now identical — remove the entry):`)
  for (const entry of staleDeclarations) console.log(`  stale    ${entry}`)
}

console.log(
  `shared-parity: ${compared} comparison(s) across ${apps.length} project(s), no unexpected divergence`,
)
