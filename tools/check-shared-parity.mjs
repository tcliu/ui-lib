#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../scripts/lib/root.mjs'
import { fail, projectPaths } from './lib/project-registry.mjs'
import { SHARED } from './lib/shared-surface.mjs'
import { collectUsage } from './lib/usage-graph.mjs'

// Drift gate for the shared surface. This checkout is the canonical source; a
// sibling app must carry byte-identical copies of the files it actually uses,
// apart from the forks the app declares in its own `shared-parity.json`.
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
//   unshipped a sibling imports a package path this repo no longer ships -> exits 1
// The surface itself is derived (`tools/lib/shared-surface.mjs`), and a file
// that owns a per-app value marks its own header `// parity: app-owned — reason`
// instead of the gate carrying a path list.

// Content plus the executable bit: a sibling that loses `chmod +x` on a shared
// script still byte-matches, so the shebang stops being honoured there and the
// gate would report parity it does not have.
const hash = p =>
  createHash('md5')
    .update(readFileSync(p))
    .update(statSync(p).mode & 0o111 ? '\0executable' : '\0plain')
    .digest('hex')

/**
 * The forks a project declares for itself, with the reason it keeps them. A
 * declaration that no longer differs is reported as stale so the list can only
 * shrink.
 */
function declaredForks(app) {
  const file = join(app.path, 'shared-parity.json')
  if (!existsSync(file)) return new Set()
  let parsed
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    fail(`failed to parse ${file}: ${error.message}`)
  }
  const entries = parsed?.forks
  if (!Array.isArray(entries)) fail(`${file} must carry a \`forks\` list`)
  const forks = new Set()
  for (const [index, entry] of entries.entries()) {
    if (typeof entry?.path !== 'string' || !entry.path || typeof entry?.reason !== 'string' || !entry.reason) {
      fail(`${file}:forks[${index}] must carry string \`path\` and \`reason\``)
    }
    forks.add(entry.path)
  }
  return forks
}

// Dead-port detection applies to the import-reachable surface only. A shared
// script is a program entry point invoked by hand or named in docs, not an
// import, so a script with no importer is not evidence that it is unused.
const DEAD_PORT_SCOPE = /^src\/lib\//

const apps = projectPaths()
if (apps.length === 0) {
  const message = 'shared-parity: no registered sibling projects found; nothing to compare'
  // `--strict` is what CI and `npm run check` run: with no registry it can only
  // pass vacuously, so fail instead of reporting parity it never checked.
  if (process.argv.includes('--strict')) {
    console.error(message)
    console.error('shared-parity: --strict cannot verify parity without the project registry')
    process.exit(1)
  }
  console.log(message)
  process.exit(0)
}
if (!existsSync(join(ROOT, 'src', 'lib'))) fail('run this from the canonical project root')

const diverged = []
const missing = []
const deadPorts = []
const notNeeded = []
let compared = 0

const forksFor = new Map(apps.map(app => [app.name, declaredForks(app)]))
const usageCache = new Map()
const usageFor = app => {
  if (!usageCache.has(app.path)) usageCache.set(app.path, collectUsage(app.path))
  return usageCache.get(app.path)
}

for (const rel of SHARED) {
  const canonical = join(ROOT, rel)
  if (!existsSync(canonical)) fail(`canonical file missing: ${rel}`)
  const want = hash(canonical)
  for (const app of apps) {
    if (forksFor.get(app.name).has(rel)) continue
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
  console.log(`  Delete them, or declare the fork if the file is intentionally unused.`)
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
  console.log(`\nPort the canonical version with the unify skill, or declare the fork in the app's shared-parity.json.`)
}
const strict = process.argv.includes('--strict')
if (strict && deadPorts.length > 0) {
  console.log(`\nshared-parity: --strict fails on dead ports; delete them or declare the fork.`)
}

// A sibling that imports the package by name takes those modules from the
// tarball, not from a ported copy, so the comparison above never sees it. A
// canonical rename would ship a path the consumer still asks for, and the
// consumer's build breaks only after the publish; fail here instead.
const unshipped = []
for (const app of apps) {
  for (const miss of usageFor(app).missingPackageImports) {
    unshipped.push(`${app.name}: ${miss.specifier} (${miss.importer}) -> ${miss.target}`)
  }
}
if (unshipped.length > 0) {
  console.log(`shared-parity: ${unshipped.length} package import(s) this repo no longer ships:`)
  for (const entry of unshipped) console.log(`  unshipped ${entry}`)
  console.log(`\nPort the consumer to the current module path, or restore the path it imports.`)
}

// Report every failure class before exiting, so one never hides another.
if (diverged.length > 0 || unshipped.length > 0 || (strict && deadPorts.length > 0)) process.exit(1)

const stale = []
for (const app of apps) {
  for (const rel of forksFor.get(app.name)) {
    const target = join(app.path, rel)
    const canonical = join(ROOT, rel)
    if (existsSync(target) && existsSync(canonical) && hash(target) === hash(canonical)) {
      stale.push(`${app.name}: ${rel}`)
    }
  }
}
if (stale.length > 0) {
  console.log(`shared-parity: ${stale.length} stale declaration(s) (now identical — remove the entry):`)
  for (const entry of stale) console.log(`  stale    ${entry}`)
}

console.log(
  `shared-parity: ${compared} comparison(s) across ${apps.length} project(s), no unexpected divergence`,
)
