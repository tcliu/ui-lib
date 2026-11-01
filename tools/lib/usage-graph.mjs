import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, posix } from 'node:path'
import { ROOT } from '../../scripts/lib/root.mjs'
import { shipsFromLib } from './package-surface.mjs'
import { SHARED, SHARED_SET } from './shared-surface.mjs'

// Map the shared surface a sibling actually uses, so the gate can tell a file
// the app references from one it merely carries. A shared file is "live" when a
// non-shared file imports it, directly or through other shared files, or names
// it literally where scripts are invoked (package.json). A live file's own
// imports become live too, so an orphaned cluster — a dead component and the
// helpers only it imports — reads as dead, not just its root. `$lib` maps to
// `src/lib` in every app; a bare import of the canonical package is the
// published surface, so it resolves to the source the tarball ships and a path
// this repo no longer ships is reported instead of silently ignored. Other bare
// and `$app`/`$env` specifiers are ignored.

// The package a sibling imports by name is this repo's manifest name, so the
// resolution reads it instead of hardcoding a scope in a script that every
// project carries verbatim. An unreadable manifest would silently disable the
// check, so it is reported once instead of swallowed.
const PACKAGE_NAME = (() => {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).name ?? null
  } catch (error) {
    console.warn(`shared-parity: could not read the package name from package.json: ${error.message}`)
    return null
  }
})()

// The whole app is scanned; these are the directories that never carry source
// references (plus dot-directories, except `.github`).
const SKIP_DIRS = new Set([
  'node_modules', 'build', 'dist', 'coverage', 'test-results', '.tmp', '.data',
  'archive', '.worktrees',
])
const EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs', '.svelte', '.json']
// Only code and the manifest can name a shared file. A data `.json` (an API
// fixture under `static/`, say) is scanned for imports but must not count as a
// literal reference, or its sample payload would look like a port candidate.
const REFERENCE_EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs', '.svelte']
const isReferenceSource = rel => rel === 'package.json' || REFERENCE_EXTENSIONS.some(ext => rel.endsWith(ext))

// On-disk candidates a specifier may resolve to, so an extensionless import
// (`$lib/size-scale`) still matches `src/lib/size-scale.ts`.
export const RESOLVE_SUFFIXES = [
  '', '.ts', '.js', '.mjs', '.cjs', '.svelte', '.json',
  '/index.ts', '/index.js', '/index.mjs', '/index.svelte',
]

// A package subpath resolves to a file the exports map reaches, with no
// directory index fallback: the map carries no `./dir/` pattern.
const PACKAGE_SUFFIXES = ['', '.ts', '.js', '.mjs', '.cjs', '.svelte', '.json']

// `from '...' | import '...' | import('...')`. Comments are stripped before the
// scan; a match inside a string literal is still read as an import, which only
// matters when it names a package path.
const SPECIFIER_RE = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g

// Whole-line comments only: dropping them keeps a specifier documented in prose
// from failing the gate, without cutting a real import that shares a line.
const LINE_COMMENT_RE = /^[ \t]*\/\/.*$/gm
const BLOCK_COMMENT_RE = /^[ \t]*\/\*[\s\S]*?\*\/[ \t]*$/gm

function stripComments(text) {
  return text.replace(BLOCK_COMMENT_RE, '').replace(LINE_COMMENT_RE, '')
}

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
  return RESOLVE_SUFFIXES.map(suffix => base + suffix)
}

/**
 * Resolve a bare import of the canonical package (`<pkg>/components/Button.svelte`)
 * to the source the tarball ships it from. Returns `null` when the specifier
 * names another package, else `{ target, exists }` — `package.json` maps to the
 * root manifest, and a subpath counts as shipped only when it is a file the
 * package prune keeps (a directory has no index fallback, since the exports map
 * carries no `./dir/` pattern).
 */
function resolvePackageSpecifier(specifier) {
  if (!PACKAGE_NAME) return null
  const sub =
    specifier === PACKAGE_NAME
      ? ''
      : specifier.startsWith(`${PACKAGE_NAME}/`)
        ? specifier.slice(PACKAGE_NAME.length + 1)
        : null
  if (sub === null) return null
  if (sub === 'package.json') return { target: 'package.json', exists: existsSync(join(ROOT, 'package.json')) }
  // An escaped subpath names no shipped module; leave it to the ignored branch
  // rather than probing outside `src/lib`.
  if (sub.startsWith('/') || sub.split('/').includes('..')) return null
  const base = sub ? `src/lib/${sub}` : 'src/lib/index'
  const hit = PACKAGE_SUFFIXES.map(suffix => base + suffix).find(candidate => {
    const abs = join(ROOT, candidate)
    return existsSync(abs) && statSync(abs).isFile() && shipsFromLib(candidate.slice('src/lib/'.length))
  })
  return { target: hit ?? base, exists: hit !== undefined }
}

/** Read the app once and return what it references and which shared files are live. */
export function collectUsage(projectPath) {
  const importTargets = new Set()
  const missingPackageImports = new Map()
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
    for (const match of stripComments(text).matchAll(SPECIFIER_RE)) {
      const specifier = match[1].split('?')[0].split('#')[0]
      const fromPackage = resolvePackageSpecifier(specifier)
      if (fromPackage) {
        // The app takes this module from the published package, not from a local
        // copy, so it contributes no port edge — but a path the canonical repo
        // no longer has must fail the gate rather than ship as a dead import.
        if (!fromPackage.exists) {
          const key = `${specifier}\0${fromPackage.target}`
          if (!missingPackageImports.has(key)) {
            missingPackageImports.set(key, { specifier, target: fromPackage.target, importer: rel })
          }
        }
        continue
      }
      for (const candidate of resolveSpecifier(match[1], rel)) {
        importTargets.add(candidate)
        candidates.add(candidate)
      }
    }
    const hits = new Set()
    for (const candidate of candidates) if (SHARED_SET.has(candidate)) hits.add(candidate)
    if (hits.size > 0) sharedEdges.set(rel, hits)
    if (!SHARED_SET.has(rel) && isReferenceSource(rel)) {
      nonShared.add(rel)
      externalCorpus += `\n${text}`
    }
  }
  const visit = (rel = '') => {
    const abs = rel ? join(projectPath, rel) : projectPath
    if (!existsSync(abs)) return
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const child = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        if (entry.name.startsWith('.') && entry.name !== '.github') continue
        visit(child)
      } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        if (seen.has(child)) continue
        seen.add(child)
        read(child)
      }
    }
  }
  visit()
  return {
    importTargets,
    missingPackageImports: [...missingPackageImports.values()],
    externalCorpus,
    live: liveShared({ sharedEdges, nonShared, externalCorpus }),
  }
}

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
