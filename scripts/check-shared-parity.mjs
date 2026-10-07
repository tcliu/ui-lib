#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Drift gate for the shared UI surface. `ui-lib` is the canonical source; every
// sibling app must carry byte-identical copies of the shared directories and
// files below, apart from the documented per-project exceptions. Run from the
// `ui-lib` root:
//   node scripts/check-shared-parity.mjs
// Exits non-zero and names each diverged file so a port that was not synced
// back is caught in `check` rather than discovered later.

const ROOT = fileURLToPath(new URL('..', import.meta.url))
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
  'src/lib/cn.ts',
  'src/lib/d1-binding.mjs',
  'src/lib/dropdown-chrome.ts',
  'src/lib/position-panel.svelte.ts',
  'src/lib/size-scale.ts',
  'src/lib/sql-rewrite.mjs',
  'src/lib/text-size.ts',
]

// Shared server utilities carried byte-identically by the consuming apps.
const SHARED_SERVER_FILES = [
  'src/lib/server/cron-expression.ts',
]

// Never gated: colocated tests, test directories, and this gate itself
// (siblings do not carry it).
const SKIP_BASENAMES = new Set(['check-shared-parity.mjs'])
const SKIP_SUFFIXES = ['.test.ts', '.test.mjs']
const SKIP_DIRS = new Set(['__tests__'])

function walk(dir) {
  const out = []
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...walk(rel))
    } else if (!SKIP_BASENAMES.has(entry.name) && !SKIP_SUFFIXES.some(suffix => entry.name.endsWith(suffix))) {
      out.push(rel)
    }
  }
  return out
}

const SHARED = [...SHARED_DIRS.flatMap(walk), ...SHARED_FILES, ...SHARED_SERVER_FILES].sort()

// Per-project exceptions with the reason each may legitimately differ. A
// two-element entry exempts the file for every app; a three-element entry
// `[app, path, reason]` exempts it for that app alone, so the canonical copy is
// still byte-compared against the other apps.
const EXCEPTIONS = [
  ['src/lib/column-width-storage.ts', 'per-app storage-key prefix'],
  ['src/lib/i18n.svelte.ts', 'per-app locale dictionaries'],
  ['scripts/apply-schema.mjs', 'per-project schema fork'],
  ['scripts/db-config.mjs', 'per-project database configuration fork'],
  ['scripts/deploy.config.mjs', 'project-owned plugin/target-availability/required-env selection'],
  ['scripts/lib/cron-job.mjs', 'per-app scan job title'],
  ['session-catalog', 'src/lib/components/DateRangePicker.svelte', 'themed fork: prop-injected i18n and CSS-var palette'],
  ['session-catalog', 'src/lib/server/cron-expression.ts', 'session-catalog has no scheduler; the cron parser is unused'],
  ['oms', 'src/lib/components/BaseDialog.svelte', 'oms adoption pending its in-flight full implementation'],
  ['oms', 'src/lib/components/SelectDropdown.svelte', 'oms adoption pending its in-flight full implementation'],
  [
    'oms',
    'src/lib/components/select-dropdown-styles.ts',
    'oms adoption pending its in-flight full implementation',
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

const hash = p => createHash('md5').update(readFileSync(p)).digest('hex')

const apps = projectPaths()
if (apps.length === 0) {
  console.log('shared-parity: no registered sibling projects found; nothing to compare')
  process.exit(0)
}
if (!existsSync(join(ROOT, 'src', 'lib'))) {
  console.error('shared-parity: run this from the ui-lib project root')
  process.exit(2)
}

const diverged = []
const missing = []
let compared = 0

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
    const target = join(app.path, rel)
    if (!existsSync(target)) {
      missing.push(`${app.name}: ${rel}`)
      continue
    }
    compared += 1
    if (hash(target) !== want) diverged.push(`${app.name}: ${rel}`)
  }
}

if (missing.length > 0) {
  console.log(`shared-parity: ${missing.length} file(s) not present in a sibling (port candidates):`)
  for (const m of missing) console.log(`  absent   ${m}`)
}
if (diverged.length > 0) {
  console.log(`shared-parity: ${diverged.length} file(s) diverged from the canonical copy:`)
  for (const d of diverged) console.log(`  diverged ${d}`)
  console.log(`\nPort the canonical version with the unify skill, or add a documented exception.`)
  process.exit(1)
}

console.log(
  `shared-parity: ${compared} comparison(s) across ${apps.length} project(s), no unexpected divergence`,
)
