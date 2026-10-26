#!/usr/bin/env node
// package/build.mjs — build the publishable package from the canonical surface.
//
// The canonical sources stay where they are (`src/lib`), because the shared
// parity gate and every consuming app address them by that path. This script
// copies the package surface into a staging tree, prunes the app's private
// modules and tests, compiles the result with `svelte-package`, and writes
// `dist/`, which carries the manifest npm publishes. The app itself never
// imports `dist/`; it keeps using `$lib`.
//
// `svelte-package` resolves the `$lib` alias from the staging `svelte.config.js`,
// so the published package carries relative specifiers without a custom
// rewrite. The one app-only binding left is the framework's `$app/environment`
// in a shared file that must stay byte-identical across projects; the staging
// copy maps it onto `esm-env`.
//
// The surface is the whole tree minus the app's private directories, and the
// runtime dependencies are read from what the staged sources import, so a new
// shared module or package reaches the published package without a list edit.

import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LIB = join(ROOT, 'src', 'lib')
// Build working area: the staging tree, the scratch consumer and the resolve probe.
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
// One package never appears as a surface import: `@babel/runtime` is imported
// at runtime by the CodeMirror theme package, not by the surface.
const IMPLICIT_DEPS = ['@babel/runtime']
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
  return PEER_DEPS.has(name) ? null : name
}

// The published package version follows the app's. The name is the package's
// only identity literal: the scope, license holder and registry derive from it,
// and every package script imports it instead of repeating it.
const PACKAGE_NAME = '@codepg/ui-lib'
const SCOPE = PACKAGE_NAME.split('/')[0]
const DEFAULT_REGISTRY = 'https://registry.npmjs.org/'

export { PACKAGE_NAME }

// The license the package publishes under. npm checks the field, not the file:
// publishing is not blocked without a LICENSE file, but the tarball should
// carry the text, so both live here and change together.
const LICENSE = 'MIT'
const LICENSE_HOLDER = SCOPE.replace(/^@/, '')
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

// --- the build -------------------------------------------------------------

// `from '...'`, `import '...'` and `import('...')` carry a module specifier.
const SPECIFIER_RE = /(\bfrom\s*|\bimport\s*|\bimport\(\s*)(['"])([^'"]+)\2/g

// `$app/environment` is the framework's module and does not ship with the
// package; `esm-env` carries the same flags under upper-case names.
const APP_ENV_NAMES = { browser: 'BROWSER', dev: 'DEV' }
const APP_ENV_IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*(['"])\$app\/environment\2/g

/** The named bindings of a `$app/environment` import, as `esm-env` names them. */
function rewriteAppEnvironment(text, fromFile) {
  return text.replace(APP_ENV_IMPORT_RE, (match, names) => {
    const bindings = names
      .split(',')
      .map(name => name.trim())
      .filter(Boolean)
      .map(name => {
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

async function copySurface() {
  const files = await collectSurface()
  const imported = new Set()
  for (const abs of files) {
    const rel = relative(LIB, abs)
    const target = join(STAGING, 'src', 'lib', rel)
    const source = rewriteAppEnvironment(await readFile(abs, 'utf8'), abs)
    for (const match of source.matchAll(SPECIFIER_RE)) {
      const dep = runtimeDepOf(match[3])
      if (dep) imported.add(dep)
    }
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, source)
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
 * The exports map.
 *
 * Three patterns cover the surface — one per directory that ships components,
 * plus a catch-all for the plain modules — because a per-file map is a 36 KB
 * manifest for a 1.6 MB package. The one shape a pattern cannot express is a
 * rune module under a component directory: its specifier ends `.svelte` while
 * the compiled file keeps `.js` (`use-grid-model.svelte` → `use-grid-model.svelte.js`),
 * so the directory's `*.svelte` pattern would claim it and point at a missing
 * file. Those modules keep an explicit entry, which wins over a pattern by
 * exact match. A consumer still keeps the source path it knows
 * (`components/Button.svelte`, `i18n.svelte`, `size-scale`).
 */
function exportsMap() {
  const files = walk(OUT)
    .map(abs => relative(OUT, abs).split(/[\\/]/).join('/'))
    .filter(rel => rel !== 'package.json' && !rel.endsWith('.d.ts'))

  const natural = rel =>
    rel.endsWith('.svelte.js')
      ? rel.slice(0, -'.svelte.js'.length) + '.svelte'
      : rel.endsWith('.js')
        ? rel.slice(0, -'.js'.length)
        : rel
  // The declaration file sits next to the module: `x.svelte.js` is declared by
  // `x.svelte.d.ts`, and a component by `x.svelte.d.ts` as well.
  const entry = rel => ({
    types: `./${rel.replace(/\.js$/, '')}.d.ts`,
    svelte: `./${rel}`,
    default: `./${rel}`,
  })

  const entries = {}
  const componentDirs = new Set()
  for (const rel of files) {
    if (!rel.endsWith('.svelte')) continue
    const dir = rel.slice(0, rel.lastIndexOf('/'))
    // A component at the root has no directory pattern to ride.
    if (dir === '') entries[`./${natural(rel)}`] = entry(rel)
    else componentDirs.add(dir)
  }
  for (const rel of files) {
    if (!rel.endsWith('.svelte.js')) continue
    entries[`./${natural(rel)}`] = entry(rel)
  }
  for (const dir of componentDirs) {
    entries[`./${dir}/*.svelte`] = {
      types: `./${dir}/*.svelte.d.ts`,
      svelte: `./${dir}/*.svelte`,
      default: `./${dir}/*.svelte`,
    }
  }
  entries['./*'] = { types: './*.d.ts', svelte: './*.js', default: './*.js' }
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

  return {
    name: PACKAGE_NAME,
    version: app.version,
    description: 'The shared UI surface: components, icons, actions and the i18n store.',
    license: LICENSE,
    author: LICENSE_HOLDER,
    // Registry search reads these; no repository/homepage/bugs until the app
    // has a remote to point them at.
    keywords: ['svelte', 'sveltekit', 'ui', 'components', 'design-system'],
    type: 'module',
    svelte: './index.js',
    // The stylesheet import is a side effect a bundler must keep; every JS
    // module in the surface is side-effect free.
    sideEffects: ['*.css'],
    // The package root is `dist/`, so every target is relative to it.
    exports: exportsMap(),
    // The scope is public and lives on the public registry; the account that
    // publishes it is the one this machine is logged in as.
    publishConfig: {
      access: 'public',
      registry: DEFAULT_REGISTRY,
    },
    peerDependencies: { svelte: app.devDependencies.svelte },
    dependencies: Object.fromEntries(Object.entries(dependencies).sort(([a], [b]) => (a < b ? -1 : 1))),
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

/** The license text the tarball carries. */
async function writeLicense() {
  await writeFile(join(OUT, 'LICENSE'), LICENSE_TEXT)
}

/**
 * The README the registry renders. It describes the published package, not the
 * showcase app the sources live in, so the counts come from the exports map and
 * cannot drift from what shipped.
 */
async function writeReadme(manifest) {
  // A rune module's specifier also ends in `.svelte` (`use-grid-model.svelte`),
  // but its compiled target keeps `.js`; only a component resolves to a
  // `.svelte` file, so the counts read the target, not the specifier.
  const shipped = Object.values(manifest.exports).filter(entry => typeof entry === 'object')
  const count = prefix =>
    shipped.filter(entry => entry.default.startsWith(prefix) && entry.default.endsWith('.svelte')).length
  const components = count('./components/')
  const icons = count('./icons/')
  await writeFile(
    join(OUT, 'README.md'),
    `# ${manifest.name}

${manifest.description}

## Install

\`\`\`bash
npm install ${manifest.name}
\`\`\`

\`svelte\` is a peer dependency, so the consuming app supplies it.

## Use

\`\`\`svelte
<script lang="ts">
  import Button from '${manifest.name}/components/Button.svelte'
</script>

<Button>Save</Button>
\`\`\`

The stylesheet carries the theme tokens and palettes; import it where the app's
Tailwind entry lives, because it also points Tailwind at the package's files:

\`\`\`css
@import 'tailwindcss';
@import '${manifest.name}/styles.css';
\`\`\`

## Entries

- \`${manifest.name}\` — the barrel export
- \`${manifest.name}/components/*.svelte\` — ${components} components
- \`${manifest.name}/icons/*.svelte\` — ${icons} icon glyphs
- \`${manifest.name}/actions/*\`, \`locales/*\`, \`data-table/*\` — supporting modules
- \`${manifest.name}/styles.css\` — theme tokens, palettes and Tailwind source globs

The package's \`exports\` map is the full list.

## License

${manifest.license}
`,
  )
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
  // A stale directory entry can outlive its removal on a mounted filesystem
  // (drvfs, 9p): re-read after a beat and retry the stubborn entry before
  // declaring the tree unremovable, so a rerun is not needed.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const left = await readdir(dir).catch(() => [])
    if (left.length === 0) return
    await new Promise(resolve => setTimeout(resolve, 100))
    for (const entry of left) {
      await rm(join(dir, entry), { recursive: true, force: true, maxRetries: 5 }).catch(() => {})
    }
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
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
    join(STAGING, 'svelte.config.js'),
    `import { fileURLToPath } from 'node:url'

// svelte-package resolves \`$lib\` against this staging tree, so the published
// sources carry relative specifiers without a \`$lib\` rewrite.
export default {
  alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) },
}
`,
  )
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
  await writeLicense()
  await writeReadme(manifest)

  const shipped = (await readdir(OUT, { recursive: true })).length
  console.log(
    `package: ${files.length} source files from ${surfaceHeads(files).join(', ')} -> ${shipped} files in dist/`,
  )
  console.log(`package: ${manifest.name}@${manifest.version} (${output.trim().split('\n')[0] ?? 'built'})`)
}

// The check script imports this module for the shared paths; running it
// directly builds the package.
const RUN_AS_SCRIPT = process.argv[1] === fileURLToPath(import.meta.url)
if (RUN_AS_SCRIPT) await main()
