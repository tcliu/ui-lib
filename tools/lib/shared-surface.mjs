import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../../scripts/lib/root.mjs'

// Gated roots: the published surface and the shared operations bundle. Repo-local
// tooling (`tools/`) and app-private code sit outside them by construction.
export const GATED_ROOTS = ['src/lib', 'scripts']
// A test, the fixture a test drives, and a test directory never reach the port.
const SKIP_FILE_RE = /(\.test\.[a-z]+|\.harness\.svelte)$/
const SKIP_DIRS = new Set(['__tests__'])

// A file may own its per-app value instead of staying byte-identical. It says so
// in its own header — `// parity: app-owned — <reason>` — so the policy lives
// with the file and the gate carries no path list. The marker is read from the
// canonical copy, so a sibling needs no declaration for it.
const APP_OWNED_RE = /^\s*\/\/\s*parity:\s*app-owned\b/m
const HEADER_BYTES = 400

function isAppOwned(abs) {
  try {
    return APP_OWNED_RE.test(readFileSync(abs, 'utf8').slice(0, HEADER_BYTES))
  } catch {
    return false
  }
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...walk(rel))
    } else if (!SKIP_FILE_RE.test(entry.name) && !isAppOwned(join(ROOT, rel))) {
      out.push(rel)
    }
  }
  return out
}

export const SHARED = GATED_ROOTS.flatMap(dir => walk(dir)).sort()
export const SHARED_SET = new Set(SHARED)
