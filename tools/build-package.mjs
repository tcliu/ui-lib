#!/usr/bin/env node
// Build the published package: compile, prune what never ships, then lint.
//
// `npm run package` is this script. It replaces a shell pipeline because the
// compile step reports a warning that only the prune can disprove:
// `svelte-package` treats every `.server.` file and every file under a `server/`
// directory as server-only, and asks for an `$app/server` guard import so a
// client import throws. Everything it lists here is pruned from `dist/` below,
// so the guard would be dead code in shared source that plain-`node` scripts
// could no longer import.
//
// So this script:
//   1. compiles with `PACKAGE=1 svelte-package`,
//   2. prunes the compiled server directory and every test/harness artifact,
//   3. reports the compile warnings, dropping the guard warning only when every
//      path it lists is gone from `dist/`; any other warning, or a listed path
//      that survived the prune, is printed and fails the run,
//   4. runs `publint` over the pruned package.
//
// Run from the project root: `npm run package`.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, rmSync, unlinkSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRUNED_DIR, PRUNED_NAME_RE } from './lib/package-surface.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'dist')

const WARNINGS_HEADER = '@sveltejs/package found the following issues while packaging your library:'
const GUARD_HEADER = 'The following server-only files do not import `$app/server` or `$app/env/private`:'
const GUARD_PATH_RE = /^- (.+)$/gm

/** The paths a guard warning lists, or `null` when it is a different warning. */
function guardPaths(warning) {
  if (!warning.startsWith(GUARD_HEADER)) return null
  const paths = [...warning.matchAll(GUARD_PATH_RE)].map(match => match[1].trim())
  return paths.length > 0 ? paths : null
}

/** Compiled artifacts a pruned source path would have produced. */
function artifactsOf(sourcePath, shipped) {
  // `server/card.ts` compiles to `server/card.js` and `server/card.d.ts`;
  // `i18n.server.test.ts` to `i18n.server.test.js`. Match on the stem.
  const stem = sourcePath.replace(/\.[^./]+$/, '')
  return shipped.filter(file => file.startsWith(`${stem}.`))
}

/**
 * Split `svelte-package` output into the text to print and the guard warning
 * paths it proved moot. A guard warning whose files still have an artifact in
 * `shipped` stays in the text and is reported as leaked, so a server-only file
 * that stops being pruned fails the build instead of disappearing silently.
 * @param {string} output `svelte-package` output (stdout and stderr)
 * @param {string[]} shipped POSIX paths present in `dist/` after the prune
 */
export function filterWarnings(output, shipped) {
  const at = output.indexOf(WARNINGS_HEADER)
  if (at === -1) return { text: output, pruned: [], leaked: [], kept: [] }

  const head = output.slice(0, at)
  const body = output.slice(at + WARNINGS_HEADER.length)
  const kept = []
  const pruned = []
  const leaked = []
  for (const warning of body
    .split(/\n{2,}/)
    .map(chunk => chunk.trim())
    .filter(Boolean)) {
    const paths = guardPaths(warning)
    if (paths === null) {
      kept.push(warning)
      continue
    }
    const survivors = paths.flatMap(path => artifactsOf(path, shipped))
    if (survivors.length === 0) pruned.push(...paths)
    else {
      kept.push(warning)
      leaked.push(...survivors)
    }
  }

  const text = kept.length === 0 ? head : `${head}${WARNINGS_HEADER}\n${kept.map(warning => `${warning}\n`).join('\n')}`
  return { text, pruned, leaked, kept }
}

function walk(dir) {
  const files = []
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(abs))
    else files.push(abs)
  }
  return files
}

/** Remove the compiled artifacts that never ship from `outDir`. */
export function prune(outDir) {
  rmSync(join(outDir, PRUNED_DIR), { recursive: true, force: true })
  for (const abs of walk(outDir)) {
    if (PRUNED_NAME_RE.test(basename(abs))) unlinkSync(abs)
  }
}

/** A dependency's bin script, so no shell or `npx` sits between npm and node. */
function binOf(packageName, binName) {
  const manifestPath = join(ROOT, 'node_modules', packageName, 'package.json')
  if (!existsSync(manifestPath)) throw new Error(`${packageName} is not installed — run npm install`)
  const { bin } = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const script = typeof bin === 'string' ? bin : bin?.[binName]
  if (!script) throw new Error(`${packageName} exposes no ${binName} binary`)
  return join(ROOT, 'node_modules', packageName, script)
}

function run(script, env) {
  return spawnSync(process.execPath, [script], { cwd: ROOT, env, encoding: 'utf8' })
}

/** Wait without a timer thread, so a retry stays synchronous like the build. */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/**
 * Remove `dist/` before the compile. `svelte-package` deletes it itself, but on a
 * mounted workspace (WSL's DrvFs) that delete reports ENOTEMPTY when a watcher —
 * a dev server on the same project — touches the tree mid-traversal, even though
 * it emptied the directory. Cleaning here retries, so the compile step finds no
 * directory left to race on.
 */
function cleanOutDir(outDir) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      rmSync(outDir, { recursive: true, force: true })
      return
    } catch (error) {
      if (error.code !== 'ENOTEMPTY' || attempt >= 5) throw error
      sleepSync(100 * attempt)
    }
  }
}

function main() {
  cleanOutDir(OUT)
  const compile = run(binOf('@sveltejs/package', 'svelte-package'), { ...process.env, PACKAGE: '1' })
  if (compile.error) {
    console.error(`package: ${compile.error.message}`)
    process.exit(1)
  }
  if (compile.status !== 0) {
    process.stdout.write(compile.stdout ?? '')
    process.stderr.write(compile.stderr ?? '')
    process.exit(compile.status ?? 1)
  }

  prune(OUT)
  if (!existsSync(OUT)) {
    console.error('package: svelte-package produced no dist/')
    process.exit(1)
  }

  const shipped = walk(OUT).map(abs => relative(OUT, abs).split(sep).join('/'))
  // Read stderr too, so a diagnostic routed there is never dropped on success.
  const output = (compile.stdout ?? '') + (compile.stderr ?? '')
  const { text, pruned, leaked, kept } = filterWarnings(output, shipped)
  process.stdout.write(text)
  if (pruned.length > 0) {
    console.log(`package: pruned ${pruned.length} server-only source file(s) before lint: ${pruned.join(', ')}`)
  }
  if (leaked.length > 0) {
    console.error(`package: ${leaked.length} server-only artifact(s) survived the prune: ${leaked.join(', ')}`)
    process.exit(1)
  }
  if (kept.length > 0) {
    console.error(`package: ${kept.length} packaging warning(s) the prune cannot prove moot`)
    process.exit(1)
  }

  const lint = run(binOf('publint', 'publint'), process.env)
  process.stdout.write(lint.stdout ?? '')
  process.stderr.write(lint.stderr ?? '')
  if (lint.status !== 0) {
    console.error('package: publint reported the problems above')
    process.exit(lint.status ?? 1)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
