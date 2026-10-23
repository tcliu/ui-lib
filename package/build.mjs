#!/usr/bin/env node
// package/build.mjs — build the publishable package from the canonical surface.
//
// The canonical sources stay where they are (`src/lib`), because the shared
// parity gate and every consuming app address them by that path. This script
// copies the package surface into a staging tree, prunes the tests, rewrites
// the specifiers that only resolve inside this app, compiles the result with
// `svelte-package`, and writes `dist/`, which carries the manifest npm
// publishes. The app itself never imports `dist/`; it keeps using `$lib`.
//
// The surface is the whole tree minus the app's private directories, and the
// runtime dependencies are read from what the staged sources import, so a new
// shared module or package reaches the published package without a list edit.
//
// The rewrite is the load-bearing step: `$lib/x` resolves against this app's
// `src/lib` and against the consumer's own `src/lib`, so a published package
// must not keep it. Every relative specifier is normalized to the file name
// the compiler emits, because `svelte-package` does not add extensions.
//
// A specifier that points outside the surface is an error, not a warning: the
// package must be self-contained, and the surface must not reach into the
// app's private modules.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LIB = join(ROOT, 'src', 'lib')
// Build working area: the staging tree, the tarball and the scratch consumer.
// A dot-directory, like SvelteKit's own generated state (`.svelte-kit/`);
// `build/` is the adapter's output name in SvelteKit, so it is not reused here.
const BUILD_DIR = join(ROOT, '.package-build')
const STAGING = join(BUILD_DIR, 'staging')
const OUT = join(ROOT, 'dist')

// Shared with the check script, which imports this module instead of
// repeating the paths.
export { BUILD_DIR, LIB, OUT, ROOT, STAGING }

// The package surface is everything under `src/lib` except the app's own
// modules, so a new shared module ships without a list edit. `server/` is
// SvelteKit's server-only directory and must never ship; `showcase/` is the
// demo shell and `app/` is the app's own chrome (theme state, web settings).
// A top-level module publishes unless it is a test. The consumer migration
// reads the same set, so "never published" has one definition.
const PRIVATE_DIRS = new Set(['app', 'server', 'showcase'])

export { PRIVATE_DIRS }

// Files that never ship: a test, the fixture a test drives, and a test
// directory. The layout gate keeps a test beside the module it exercises.
const PRUNE_FILE_RE = /(\.test\.[a-z]+|\.harness\.svelte)$/
const PRUNE_DIRS = new Set(['__tests__'])

// The runtime dependencies are read from what the staged sources import, so a
// component that starts importing a package cannot leave the published
// manifest behind. The version still comes from the app's manifest, so the
// package never drifts from the versions the app builds against.
//
// Two packages never appear as a surface import:
//   `@babel/runtime` — the CodeMirror theme package imports it at runtime, and
//     the surface never does.
//   `esm-env` — the rewrite maps `$app/environment` onto it, and the app reads
//     the framework module instead.
const IMPLICIT_DEPS = ['@babel/runtime']
const ESM_ENV = 'esm-env'
// The consumer supplies the compiler, so `svelte` is a peer, never a dependency.
const PEER_DEPS = new Set(['svelte'])
// npm's package-name shape, so a specifier read out of a code sample is ignored.
const DEP_NAME_RE = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i

/** The package a bare specifier names, or null for a local or framework one. */
function runtimeDepOf(specifier) {
  // A demo string can carry a code sample whose quotes close a specifier early;
  // a real specifier never contains whitespace, and its name matches npm's
  // package-name shape.
  if (/\s/.test(specifier)) return null
  if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('$')) return null
  if (specifier.startsWith('node:')) return null
  const parts = specifier.split('/')
  const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
  if (!DEP_NAME_RE.test(name)) return null
  return PEER_DEPS.has(name) || name === ESM_ENV ? null : name
}

// The published package version follows the app's.
const PACKAGE_NAME = '@codepg/ui-lib'

// `npm pack` embeds the version in its own file name; the stable name drops it
// so a consumer's file specifier survives a version bump.
const TARBALL_NAME = `${PACKAGE_NAME.replace(/^@/, '').replace('/', '-')}.tgz`

export { PACKAGE_NAME, TARBALL_NAME }

// The license the package publishes under. npm checks the field, not the file:
// publishing is not blocked without a LICENSE file, but the tarball should
// carry the text, so both live here and change together.
const LICENSE = 'MIT'
const LICENSE_HOLDER = 'codepg'
const LICENSE_TEXT = `MIT License

Copyright (c) ${new Date().getFullYear()} ${LICENSE_HOLDER}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

// --- the surface -----------------------------------------------------------

/** True when the path belongs to the published surface. */
function isSurfaceFile(abs) {
  const rel = relative(LIB, abs)
  if (!rel || rel.startsWith('..')) return false
  const segments = rel.split(/[\\/]/)
  if (PRIVATE_DIRS.has(segments[0])) return false
  if (segments.some((segment) => PRUNE_DIRS.has(segment))) return false
  return !PRUNE_FILE_RE.test(segments[segments.length - 1])
}

/** Every file of the surface, as absolute paths. */
async function collectSurface() {
  const files = []
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!PRUNE_DIRS.has(entry.name)) await walk(abs)
        continue
      }
      if (!PRUNE_FILE_RE.test(entry.name)) files.push(abs)
    }
  }
  for (const entry of await readdir(LIB, { withFileTypes: true })) {
    const abs = join(LIB, entry.name)
    if (!entry.isDirectory()) {
      if (!PRUNE_FILE_RE.test(entry.name)) files.push(abs)
      continue
    }
    if (PRIVATE_DIRS.has(entry.name) || PRUNE_DIRS.has(entry.name)) continue
    await walk(abs)
  }
  if (files.length === 0) throw new Error(`package: no surface files under ${LIB}`)
  return files.sort()
}

/** The top-level entries the surface carries, for the build log. */
function surfaceHeads(files) {
  const heads = new Set()
  for (const abs of files) {
    const [head, ...rest] = relative(LIB, abs).split(/[\\/]/)
    heads.add(rest.length > 0 ? `${head}/` : head)
  }
  return [...heads].sort()
}

// --- the rewrite -----------------------------------------------------------

// A specifier that names a file, with or without its extension.
const RESOLVE_SUFFIXES = ['', '.ts', '.svelte.ts', '.svelte', '.js', '.mjs', '/index.ts', '/index.js']

/** The file a specifier names, or null when it names none. */
function resolveModule(abs) {
  for (const suffix of RESOLVE_SUFFIXES) {
    const candidate = abs + suffix
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

/**
 * The file name the compiler emits for a source file: a `.svelte.ts` rune
 * module becomes `.svelte.js`, a `.ts` module becomes `.js`, and a component
 * keeps its name.
 */
function emittedPath(abs) {
  if (abs.endsWith('.svelte.ts')) return `${abs.slice(0, -'.svelte.ts'.length)}.svelte.js`
  if (abs.endsWith('.ts')) return `${abs.slice(0, -'.ts'.length)}.js`
  return abs
}

/** A relative specifier from one file to another, always prefixed. */
function relativeSpecifier(fromFile, target) {
  const rel = relative(dirname(fromFile), target).split(/[\\/]/).join('/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

// `from '...'`, `import '...'` and `import('...')` carry a module specifier.
const SPECIFIER_RE = /(\bfrom\s*|\bimport\s*|\bimport\(\s*)(['"])([^'"]+)\2/g

// `$app/environment` is the framework's module and does not ship with the
// package; `esm-env` carries the same flags under upper-case names.
const APP_ENV_NAMES = { browser: 'BROWSER', dev: 'DEV' }
const APP_ENV_IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*(['"])\$app\/environment\2/g

/** The named bindings of a `$app/environment` import, as `esm-env` names them. */
function rewriteAppEnvironment(text, fromFile) {
  return text.replace(APP_ENV_IMPORT_RE, (match, names, quote) => {
    const bindings = names
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => {
        const mapped = APP_ENV_NAMES[name]
        if (!mapped) {
          throw new Error(
            `package: ${relative(ROOT, fromFile)} imports ${name} from $app/environment, which the package cannot provide`,
          )
        }
        return `${mapped} as ${name}`
      })
    return `import { ${bindings.join(', ')} } from 'esm-env'`
  })
}

/**
 * The specifier a file should carry in the published package, or null when the
 * specifier stays as it is.
 */
function rewriteSpecifier(fromFile, specifier) {
  // The browser flag comes from the package's own environment module: the
  // consumer's `$app/environment` is not the package's to reach.
  if (specifier === '$app/environment') return 'esm-env'

  let target = null
  if (specifier.startsWith('$lib/')) {
    target = resolveModule(join(LIB, specifier.slice('$lib/'.length)))
    if (!target) throw new Error(`package: unresolved specifier ${specifier} in ${relative(ROOT, fromFile)}`)
  } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    target = resolveModule(resolve(dirname(fromFile), specifier))
    // A specifier that names no file stays: a stylesheet or a package the
    // consumer resolves itself.
    if (!target) return null
  } else {
    return null
  }

  if (!isSurfaceFile(target)) {
    throw new Error(
      `package: ${relative(ROOT, fromFile)} imports ${specifier}, which is outside the package surface`,
    )
  }
  return relativeSpecifier(fromFile, emittedPath(target))
}

/** The source of a file with every specifier rewritten. */
function rewriteSource(fromFile, text) {
  const withEnv = rewriteAppEnvironment(text, fromFile)
  return withEnv.replace(SPECIFIER_RE, (match, lead, quote, specifier) => {
    const rewritten = rewriteSpecifier(fromFile, specifier)
    return rewritten === null ? match : `${lead}${quote}${rewritten}${quote}`
  })
}

// --- the build -------------------------------------------------------------

async function copySurface() {
  const files = await collectSurface()
  const imported = new Set()
  for (const abs of files) {
    const rel = relative(LIB, abs)
    const target = join(STAGING, 'src', 'lib', rel)
    const text = await readFile(abs, 'utf8')
    for (const match of text.matchAll(SPECIFIER_RE)) {
      const dep = runtimeDepOf(match[3])
      if (dep) imported.add(dep)
    }
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, rewriteSource(abs, text))
  }
  return { files, imported }
}

/** The staging manifest: `svelte-package` reads it to find the package shape. */
const STAGING_MANIFEST = {
  name: PACKAGE_NAME,
  version: '0.0.0',
  type: 'module',
  private: true,
  exports: {
    '.': { types: './dist/index.d.ts', svelte: './dist/index.js', default: './dist/index.js' },
    './*': { types: './dist/*.d.ts', svelte: './dist/*.js', default: './dist/*.js' },
  },
}

/**
 * The exports map, one entry per shipped file.
 *
 * A wildcard cannot serve the surface: a rune module compiles to
 * `x.svelte.js`, so `"./*.svelte"` and `"./*"` both claim the same specifier
 * and the wrong one wins. An explicit entry lets a consumer keep the source
 * path it already knows (`components/Button.svelte`, `size-scale`) while the
 * target names the file the compiler emitted.
 */
function exportsMap() {
  const entries = {}
  for (const abs of walk(OUT)) {
    const rel = relative(OUT, abs).split(/[\\/]/).join('/')
    if (rel === 'package.json' || rel === 'styles.css' || rel.endsWith('.d.ts')) continue
    if (rel === 'index.js') continue
    const natural = rel.endsWith('.svelte.js')
      ? rel.slice(0, -'.svelte.js'.length) + '.svelte'
      : rel.endsWith('.js')
        ? rel.slice(0, -'.js'.length)
        : rel
    // The declaration file sits next to the module: `x.svelte.js` is declared
    // by `x.svelte.d.ts`, and a component by `x.svelte.d.ts` as well.
    const types = `./${rel.replace(/\.js$/, '')}.d.ts`
    entries[`./${natural}`] = { types, svelte: `./${rel}`, default: `./${rel}` }
  }
  entries['.'] = { types: './index.d.ts', svelte: './index.js', default: './index.js' }
  entries['./styles.css'] = './styles.css'
  entries['./package.json'] = './package.json'
  return Object.fromEntries(Object.entries(entries).sort(([a], [b]) => (a < b ? -1 : 1)))
}

/** Every file under a directory, as absolute paths. */
function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(abs))
    else files.push(abs)
  }
  return files
}
/** The manifest npm publishes: the package root is `dist/`. */
function publishManifest(imported) {
  const app = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const dependencies = {}
  for (const dep of [...new Set([...imported, ...IMPLICIT_DEPS])]) {
    const version = app.dependencies?.[dep]
    if (!version) {
      throw new Error(`package: the app manifest does not carry ${dep}, which the surface imports`)
    }
    dependencies[dep] = version
  }
  const esmEnv = JSON.parse(
    readFileSync(join(ROOT, 'node_modules', ESM_ENV, 'package.json'), 'utf8'),
  ).version
  dependencies[ESM_ENV] = `^${esmEnv}`

  return {
    name: PACKAGE_NAME,
    version: app.version,
    description: 'The shared UI surface: components, icons, actions and the i18n store.',
    license: LICENSE,
    type: 'module',
    svelte: './index.js',
    sideEffects: false,
    // The package root is `dist/`, so every target is relative to it.
    exports: exportsMap(),
    // The scope is public and lives on the public registry; the account that
    // publishes it is the one this machine is logged in as.
    publishConfig: {
      access: 'public',
      registry: 'https://registry.npmjs.org/',
    },
    peerDependencies: { svelte: app.devDependencies.svelte },
    dependencies: Object.fromEntries(
      Object.entries(dependencies).sort(([a], [b]) => (a < b ? -1 : 1)),
    ),
  }
}

async function writeManifest(imported) {
  const manifest = publishManifest(imported)
  await writeFile(join(OUT, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}

/** The package's stylesheet: the app's Tailwind entry plus the source globs. */
async function writeStyles() {
  const css = await readFile(join(ROOT, 'src', 'styles.css'), 'utf8')
  // The consumer's Tailwind does not scan `node_modules`, so the package
  // points its own stylesheet at the files it ships.
  await writeFile(join(OUT, 'styles.css'), `${css}\n@source "./";\n`)
}

/** The license text and the scope's registry. npm never packs an `.npmrc`. */
async function writePublishingFiles() {
  await writeFile(join(OUT, 'LICENSE'), LICENSE_TEXT)
  await writeFile(join(OUT, '.npmrc'), `@${PACKAGE_NAME.split('/')[0]}:registry=https://registry.npmjs.org/\n`)
}

function runPackager() {
  const cli = join(ROOT, 'node_modules', '@sveltejs', 'package', 'svelte-package.js')
  const result = spawnSync(process.execPath, [cli, '--input', 'src/lib', '--output', OUT], {
    cwd: STAGING,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`package: svelte-package failed\n${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  }
  return result.stdout ?? ''
}

/**
 * Remove a directory tree.
 *
 * Some filesystems report ENOTEMPTY for a directory that is already empty, so
 * the entries are cleared one by one and the leftover is checked: a directory
 * that still holds files would make the build mix two outputs.
 */
async function removeDir(dir) {
  await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(async () => {
    for (const entry of await readdir(dir).catch(() => [])) {
      await rm(join(dir, entry), { recursive: true, force: true, maxRetries: 5 }).catch(() => {})
    }
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  })
  const left = await readdir(dir).catch(() => [])
  if (left.length > 0) throw new Error(`package: ${dir} still holds ${left.length} entries`)
}

async function main() {
  await removeDir(STAGING)
  await removeDir(OUT)
  await mkdir(join(STAGING, 'src'), { recursive: true })

  const { files, imported } = await copySurface()
  await writeFile(join(STAGING, 'package.json'), `${JSON.stringify(STAGING_MANIFEST, null, 2)}\n`)
  await writeFile(
    join(STAGING, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          strict: true,
          skipLibCheck: true,
          verbatimModuleSyntax: true,
          isolatedModules: true,
          allowJs: true,
          declaration: true,
          emitDeclarationOnly: true,
          types: ['svelte'],
        },
        include: ['src/**/*.ts', 'src/**/*.svelte'],
      },
      null,
      2,
    )}\n`,
  )

  const output = runPackager()
  const manifest = await writeManifest(imported)
  await writeStyles()
  await writePublishingFiles()

  // The tarball a consumer installs from. It lands outside the build tree, so
  // the package root stays the compiled output and the tarball is a copy of it.
  const packed = await runPack()
  const shipped = (await readdir(OUT, { recursive: true })).length
  console.log(`package: ${files.length} source files from ${surfaceHeads(files).join(', ')} -> ${shipped} files in dist/`)
  console.log(`package: ${manifest.name}@${manifest.version} (${output.trim().split('\n')[0] ?? 'built'})`)
  console.log(`package: tarball ${packed}`)
}

/**
 * Pack the built package into the build directory, where a consumer installs
 * it from.
 */
async function runPack() {
  const result = spawnSync('npm', ['pack', '--pack-destination', BUILD_DIR], {
    cwd: OUT,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`package: npm pack failed\n${result.stderr ?? ''}`)
  }
  const filename = (result.stdout ?? '').trim().split('\n').pop()
  await copyFile(join(BUILD_DIR, filename), join(BUILD_DIR, TARBALL_NAME))
  return TARBALL_NAME
}

// The check script imports this module for the shared paths; running it
// directly builds the package.
const RUN_AS_SCRIPT = process.argv[1] === fileURLToPath(import.meta.url)
if (RUN_AS_SCRIPT) await main()
