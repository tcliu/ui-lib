import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, posix } from 'node:path'
import { SHARED, SHARED_SET } from './shared-surface.mjs'

// Map the shared surface a sibling actually uses, so the gate can tell a file
// the app references from one it merely carries. A shared file is "live" when a
// non-shared file imports it, directly or through other shared files, or names
// it literally where scripts are invoked (package.json). A live file's own
// imports become live too, so an orphaned cluster — a dead component and the
// helpers only it imports — reads as dead, not just its root. Bare package and
// `$app`/`$env` specifiers are ignored; `$lib` maps to `src/lib` in every app.

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
// `from '...' | import '...' | import('...')`. A match inside a string or
// comment is harmless: it only matters if it resolves to a shared path.
const SPECIFIER_RE = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g

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

/** Read the app once and return what it references and which shared files are live. */
export function collectUsage(projectPath) {
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
  return { importTargets, externalCorpus, live: liveShared({ sharedEdges, nonShared, externalCorpus }) }
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
