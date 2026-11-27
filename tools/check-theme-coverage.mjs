#!/usr/bin/env node
// Theme-coverage gate. The light-family block in `src/lib/styles.css` remaps
// the accent grades used as ink (light themes mirror the slate ramp, so an
// unmapped low grade renders near-white text on a near-white canvas). The
// block has to cover the palette vocabulary the components actually use, not
// just the theme's own accent family.
//
// The scan reads every shipped `.svelte`/`.ts`/`.js` source and collects the
// low-grade ink utilities (`text|stroke|fill|decoration-<family>-<100..400>`),
// then asserts each one is remapped for the light surface family. Vivid fills
// (grade 500+) are intentionally untouched.
//
// Run from the project root:
//   node tools/check-theme-coverage.mjs
// Exits non-zero and names every uncovered family/grade, so `npm run check`
// fails when a component starts using an ink the light themes do not remap.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_DIR = 'src'
const STYLES = 'src/lib/styles.css'
const INK_UTILITY = /\b(?:text|stroke|fill|decoration)-([a-z]+)-(\d{2,3})\b/g
const SKIP_DIRS = new Set(['node_modules', '.svelte-kit', '.worktrees', '.tmp', 'dist', 'coverage'])

function collectSources(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) collectSources(join(dir, entry.name), out)
      continue
    }
    if (!/\.(svelte|ts|js)$/.test(entry.name)) continue
    if (/\.test\.[a-z]+$/.test(entry.name)) continue
    out.push(join(dir, entry.name))
  }
  return out
}

// The shared light-family block owns the accent remaps; the `[data-theme='light']`
// block owns that theme's mirrored slate ramp. Together they are the light
// surface's full ink palette.
function lightFamilyOverrides(css) {
  const names = new Set()
  for (const selector of ["[data-theme='light'],", "[data-theme='light'] {"]) {
    const start = css.indexOf(selector)
    const end = css.indexOf('}', start)
    for (const match of css.slice(start, end).matchAll(/--color-([a-z]+-\d{2,3}):/g)) {
      names.add(match[1])
    }
  }
  return names
}

export function collectViolations(root) {
  const overrides = lightFamilyOverrides(readFileSync(join(root, STYLES), 'utf8'))
  const missing = new Set()
  for (const file of collectSources(join(root, SOURCE_DIR))) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(INK_UTILITY)) {
      const [, family, grade] = match
      if (Number(grade) > 400) continue
      const token = `${family}-${grade}`
      if (!overrides.has(token)) missing.add(token)
    }
  }
  return [...missing].sort()
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const violations = collectViolations(root)
  if (violations.length === 0) {
    console.log('theme-coverage: every low-grade ink utility is remapped for light surfaces')
    return
  }
  console.error('theme-coverage: the light-family block does not remap:')
  for (const token of violations) console.error(`  --color-${token}`)
  process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
