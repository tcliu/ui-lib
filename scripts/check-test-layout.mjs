#!/usr/bin/env node
// Test layout gate. A unit test lives beside the module it exercises, so the
// subject and its spec stay one directory apart instead of a test-only folder:
//
//   src/lib/components/Button.svelte
//   src/lib/components/button-size.test.ts        <- beside the subject
//   src/lib/components/button-size.harness.svelte <- the fixture it drives
//
// Browser flows are a different kind of test: they drive a served app rather
// than a module, so they keep their own root directory (`tests/`, `*.spec.ts`).
//
// Run from the project root:
//   node scripts/check-test-layout.mjs
// Exits non-zero and names every violation, so `npm run check` fails on a
// test parked in the wrong place. The rule is what keeps the shared surface
// honest: a sibling app ports `src/lib/components/` wholesale, so a test
// file that sits in the ported directory travels with it.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Directories the gate never walks: build output, dependencies, and the
// worktree checkouts that live inside the project.
const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.svelte-kit', '.worktrees', 'coverage', 'build',
  'dist', '.tmp', '.data', 'archive', 'test-results', '.vercel', '.wrangler',
  '.netlify', '.output', '.pnpm-store',
])

// A directory that holds only tests. Inside `src/` or `scripts/` it splits a
// module from its spec; at the project root it splits the suite from the
// code it covers.
const TEST_DIR_NAMES = new Set(['__tests__', '__test__', 'test', 'tests'])

// Where each kind of test is allowed to live.
const UNIT_TEST_ROOTS = ['src', 'scripts']
const BROWSER_TEST_ROOT = 'tests'

const SOURCE_EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs', '.svelte']
const UNIT_TEST_RE = /\.test\.[a-z]+$/
const BROWSER_SPEC_RE = /\.spec\.[a-z]+$/

// On-disk candidates a specifier may resolve to, so an extensionless import
// (`./size-metrics`) still matches `size-metrics.ts`.
const PROBE_SUFFIXES = ['', '.ts', '.js', '.mjs', '.cjs', '.svelte', '/index.ts', '/index.js', '/index.mjs']
// `from '...' | import '...' | import('...')`.
const SPECIFIER_RE = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g

// A module a test can sit beside. A test file and the fixture it drives are
// not modules: a directory holding only those holds nothing to test.
function isSourceFile(name) {
  if (!SOURCE_EXTENSIONS.some(ext => name.endsWith(ext))) return false
  if (UNIT_TEST_RE.test(name)) return false
  if (name.endsWith('.spec.ts') || name.endsWith('.d.ts')) return false
  if (name.endsWith('.harness.svelte')) return false
  return true
}

function listFiles(dir, root, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      listFiles(abs, root, out)
    } else {
      out.push({ abs, rel: relative(root, abs).split('\\').join('/') })
    }
  }
  return out
}

function listDirs(dir, root, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    if (IGNORED_DIRS.has(entry.name)) continue
    const abs = join(dir, entry.name)
    out.push({ abs, rel: relative(root, abs).split('\\').join('/'), name: entry.name })
    listDirs(abs, root, out)
  }
  return out
}

// Resolve an import specifier to the file it points at, or null when it is a
// package, a virtual module, or a path this project does not carry.
function resolveImport(specifier, importerDir, root) {
  let base
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    base = resolve(importerDir, specifier)
  } else if (specifier === '$lib' || specifier.startsWith('$lib/')) {
    base = resolve(root, 'src/lib', specifier === '$lib' ? '' : specifier.slice('$lib/'.length))
  } else {
    return null
  }
  for (const suffix of PROBE_SUFFIXES) {
    const candidate = base + suffix
    if (existsSync(candidate)) return candidate
  }
  return null
}

function importSpecifiers(file) {
  const text = readFileSync(file, 'utf8')
  return [...text.matchAll(SPECIFIER_RE)].map(match => match[1])
}

// The violations the layout rule forbids, as human-readable lines.
export function collectViolations(root) {
  const violations = []
  const files = listFiles(root, root)
  const dirs = listDirs(root, root)

  for (const dir of dirs) {
    if (!TEST_DIR_NAMES.has(dir.name)) continue
    if (dir.rel === BROWSER_TEST_ROOT) continue
    violations.push(
      `test dir  ${dir.rel} — a test-only directory; put each test beside the module it exercises`,
    )
  }

  for (const file of files) {
    const inBrowserRoot = file.rel === BROWSER_TEST_ROOT || file.rel.startsWith(`${BROWSER_TEST_ROOT}/`)

    if (UNIT_TEST_RE.test(file.rel)) {
      if (inBrowserRoot) {
        violations.push(`wrong kind ${file.rel} — a unit test belongs beside its module, not in ${BROWSER_TEST_ROOT}/`)
        continue
      }
      const top = file.rel.split('/')[0]
      if (!UNIT_TEST_ROOTS.includes(top)) {
        violations.push(`misplaced  ${file.rel} — a unit test belongs under ${UNIT_TEST_ROOTS.join('/')}/`)
        continue
      }
      const dir = dirname(file.abs)
      const siblings = readdirSync(dir).filter(name => isSourceFile(name))
      if (siblings.length === 0) {
        violations.push(`misplaced  ${file.rel} — no module in ${relative(root, dir)} to sit beside`)
        continue
      }
      const imports = importSpecifiers(file.abs)
      const ownDir = imports.some(specifier => {
        const target = resolveImport(specifier, dir, root)
        return target !== null && dirname(target) === dir
      })
      if (!ownDir) {
        violations.push(`misplaced  ${file.rel} — imports no module from ${relative(root, dir)}`)
      }
    }

    if (BROWSER_SPEC_RE.test(file.rel) && !inBrowserRoot) {
      violations.push(`wrong kind ${file.rel} — a browser spec belongs in ${BROWSER_TEST_ROOT}/`)
    }
  }

  return violations
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const violations = collectViolations(root)
  if (violations.length === 0) {
    console.log('test-layout: every test sits beside the module it exercises')
    return
  }
  console.log(`test-layout: ${violations.length} violation(s):`)
  for (const violation of violations) console.log(`  ${violation}`)
  console.log(`\nMove the test beside its module (or into ${BROWSER_TEST_ROOT}/ for a browser flow).`)
  process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
