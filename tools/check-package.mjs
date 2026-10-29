#!/usr/bin/env node
// tools/check-package.mjs — verify the built package the way a consumer sees it.
//
// `npm run package` compiles into `dist/` and runs publint; this script covers
// what publint cannot: it resolves every shipped file through the exports map,
// packs the tarball, installs it into a scratch app, and builds that app with
// every shipped Svelte component. It also asserts the two hand-wired surfaces
// publint does not inspect: the Tailwind `@source` directive and the
// stylesheet's side-effect declaration.
//
// Run from the repository root after `npm run package`:
//   node tools/check-package.mjs

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'dist')
const BUILD_DIR = join(ROOT, '.package-build')
const CONSUMER = join(BUILD_DIR, 'consumer')
const PACKAGE_NAME = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).name

const failures = []
function check(label, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

/** The tarball entries `npm pack --json` reports (npm 12 keys by name). */
function packEntries(stdout) {
  const parsed = JSON.parse(stdout)
  return Array.isArray(parsed) ? parsed : Object.values(parsed)
}

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(abs))
    else files.push(abs)
  }
  return files
}

// The gate inspects built output it did not produce, so a missing or stale
// `dist/` must fail here instead of reporting on nothing.
if (!existsSync(OUT)) {
  console.error('package: dist/ is missing — run `npm run package` first')
  process.exit(1)
}

const shipped = walk(OUT)
const rel = abs => relative(OUT, abs).split(/[\\/]/).join('/')

check('the package carries files', shipped.length > 0, `${shipped.length} files`)

// A source-only specifier that leaked into the output would break a consumer
// that never defines the app aliases.
const APP_SPECIFIER_RE = /(?:\bfrom|\bimport)\s*\(?\s*['"]\$(?:lib|showcase|appLib|app)\//
const appSpecifiers = shipped
  .filter(abs => /\.(js|svelte)$/.test(abs))
  .filter(abs => APP_SPECIFIER_RE.test(readFileSync(abs, 'utf8')))
  .map(rel)
check('no app-only alias ships', appSpecifiers.length === 0, appSpecifiers.join(', '))

// publint proves every export target exists; it cannot see whether a shipped
// file is reachable at all. Resolve each one through Node's own resolver in a
// tree that installs the package the way a consumer's `node_modules` does, so a
// pattern that misroutes a rune module (specifier ends `.svelte`, target keeps
// `.js`) fails here rather than at a consumer's build.
const RESOLVE_DIR = join(BUILD_DIR, 'exports-resolve')
await rm(RESOLVE_DIR, { recursive: true, force: true, maxRetries: 3 })
await mkdir(join(RESOLVE_DIR, 'node_modules'), { recursive: true })
const [scope, pkgName] = PACKAGE_NAME.startsWith('@') ? PACKAGE_NAME.split('/') : [null, PACKAGE_NAME]
const installRoot = scope ? join(RESOLVE_DIR, 'node_modules', scope) : join(RESOLVE_DIR, 'node_modules')
await mkdir(installRoot, { recursive: true })
const installedAt = join(installRoot, pkgName)
// Mirror the installed shape exactly: `dist/` plus the root manifest, whose
// export targets all start `./dist/`.
await cp(OUT, join(installedAt, 'dist'), { recursive: true })
await writeFile(join(installedAt, 'package.json'), readFileSync(join(ROOT, 'package.json')))
await writeFile(
  join(RESOLVE_DIR, 'package.json'),
  `${JSON.stringify({ name: 'exports-resolve', private: true, type: 'module' })}\n`,
)
const resolvable = shipped
  .filter(abs => !abs.endsWith('.d.ts'))
  .map(rel)
  .map(file => ({ file, specifier: `${PACKAGE_NAME}/${file.endsWith('.js') ? file.slice(0, -3) : file}` }))
await writeFile(
  join(RESOLVE_DIR, 'resolve.mjs'),
  `import { existsSync } from 'node:fs'\nimport { fileURLToPath } from 'node:url'\n\nconst entries = ${JSON.stringify(resolvable)}\nconst failures = []\nfor (const { specifier, file } of entries) {\n  try {\n    const resolved = fileURLToPath(import.meta.resolve(specifier)).split(${JSON.stringify(sep)}).join('/')\n    if (!resolved.endsWith(\`/\${file}\`)) failures.push(\`\${specifier} -> \${resolved}\`)\n    else if (!existsSync(resolved)) failures.push(\`\${specifier}: target missing (\${resolved})\`)\n  } catch (error) {\n    failures.push(\`\${specifier}: \${error.code ?? error.message}\`)\n  }\n}\nif (failures.length > 0) {\n  console.error(failures.join('\\n'))\n  process.exit(1)\n}\n`,
)
const resolveRun = spawnSync(process.execPath, [join(RESOLVE_DIR, 'resolve.mjs')], {
  cwd: RESOLVE_DIR,
  encoding: 'utf8',
})
check(
  'every shipped file resolves through the exports map',
  resolveRun.status === 0,
  (resolveRun.stderr ?? '').trim().split('\n').slice(0, 5).join(' | '),
)

// Node resolves the runtime target; a TypeScript consumer resolves the `types`
// condition instead, so a mistyped declaration pattern would still pass the
// check above and break every consumer's typecheck.
const TYPE_OPTIONS = {
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ESNext,
  strict: true,
  skipLibCheck: true,
}
const typeProbe = join(RESOLVE_DIR, 'types-probe.ts')
await writeFile(typeProbe, '')
const unresolvedTypes = resolvable
  .filter(({ file }) => file.endsWith('.js') || file.endsWith('.svelte'))
  .flatMap(({ file, specifier }) => {
    const expected = file.endsWith('.js') ? `${file.slice(0, -3)}.d.ts` : `${file}.d.ts`
    const resolved = ts.resolveModuleName(specifier, typeProbe, TYPE_OPTIONS, ts.sys).resolvedModule
    const target = resolved?.resolvedFileName.split(sep).join('/')
    return target?.endsWith(`/${expected}`) ? [] : [`${specifier} -> ${target ?? 'unresolved'}`]
  })
check(
  'every module resolves to its type declaration',
  unresolvedTypes.length === 0,
  unresolvedTypes.slice(0, 5).join(', '),
)

// A relative import that no longer resolves is invisible to the consumer build
// when its module is not in the component graph. `svelte-package` keeps the
// specifier it was given, so an extensionless import may omit the compiled
// extension; probe the way a consumer's bundler does.
const RELATIVE_SPECIFIER_RE = /(?:\bfrom|\bimport)\s*\(?\s*['"](\.[^'"]+)['"]/g
const RESOLVE_SUFFIXES = ['', '.js', '.svelte', '.svelte.js']
function resolvesRelative(fromAbs, specifier) {
  const base = resolve(dirname(fromAbs), specifier)
  if (RESOLVE_SUFFIXES.some(suffix => existsSync(base + suffix) && statSync(base + suffix).isFile())) {
    return true
  }
  return RESOLVE_SUFFIXES.slice(1).some(suffix => existsSync(join(base, `index${suffix}`)))
}
const unresolved = []
for (const abs of shipped) {
  if (!abs.endsWith('.js')) continue
  for (const [, specifier] of readFileSync(abs, 'utf8').matchAll(RELATIVE_SPECIFIER_RE)) {
    if (!resolvesRelative(abs, specifier)) unresolved.push(`${rel(abs)} -> ${specifier}`)
  }
}
check('every relative import resolves', unresolved.length === 0, unresolved.slice(0, 5).join(', '))

const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
check('the stylesheet ships', existsSync(join(OUT, 'styles.css')))
check(
  'the stylesheet points Tailwind at the package',
  readFileSync(join(OUT, 'styles.css'), 'utf8').includes('@source "./"'),
)
check('the stylesheet keeps its side effect', manifest.sideEffects?.includes?.('**/*.css') === true)

// --- the consumer ----------------------------------------------------------

console.log('\npackage: building the scratch consumer')
await rm(CONSUMER, { recursive: true, force: true, maxRetries: 3 })
await mkdir(join(CONSUMER, 'src'), { recursive: true })

const tarball = spawnSync('npm', ['pack', '--json', '--pack-destination', BUILD_DIR], {
  cwd: ROOT,
  encoding: 'utf8',
})
if (tarball.status !== 0) {
  check('npm pack succeeds', false, (tarball.stderr ?? '').trim().split('\n')[0])
} else {
  const [{ filename, files }] = packEntries(tarball.stdout)
  const packed = files.map(file => file.path)
  check('the tarball carries the manifest', packed.includes('package.json'))
  check('the tarball carries the README', packed.includes('README.md'))
  check(
    'the tarball carries no test or harness',
    packed.every(file => !/(\.test\.[a-z]+|\.harness\.svelte)$/.test(file)),
  )
  check(
    'the tarball carries only the built surface',
    packed.every(file => /^(package\.json|README\.md|LICEN[CS]E(\.md)?|dist\/)/.test(file)),
    packed.filter(file => !/^(package\.json|README\.md|LICEN[CS]E(\.md)?|dist\/)/.test(file)).join(', '),
  )
  const app = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  await writeFile(
    join(CONSUMER, 'package.json'),
    `${JSON.stringify(
      {
        name: 'package-consumer',
        private: true,
        type: 'module',
        dependencies: {
          [PACKAGE_NAME]: `file:${join(BUILD_DIR, filename)}`,
        },
        devDependencies: {
          '@sveltejs/vite-plugin-svelte': app.devDependencies['@sveltejs/vite-plugin-svelte'],
          '@tailwindcss/vite': app.devDependencies['@tailwindcss/vite'],
          tailwindcss: app.devDependencies.tailwindcss,
          vite: app.devDependencies.vite,
        },
      },
      null,
      2,
    )}\n`,
  )
  // The consumer imports every shipped component and lets Tailwind scan the
  // package's stylesheet, so a broken export or a missing class fails the build.
  const modules = shipped.filter(abs => rel(abs).endsWith('.svelte')).map(abs => rel(abs).replace(/\.svelte$/, ''))
  await writeFile(
    join(CONSUMER, 'src', 'main.ts'),
    `import './app.css'\n${modules.map(name => `import '${PACKAGE_NAME}/${name}.svelte'`).join('\n')}\nconsole.log(${modules.length})\n`,
  )
  await writeFile(
    join(CONSUMER, 'index.html'),
    '<!doctype html><html><head><meta charset="utf-8"><title>consumer</title></head><body><script type="module" src="/src/main.ts"></script></body></html>\n',
  )
  await writeFile(join(CONSUMER, 'src', 'app.css'), `@import 'tailwindcss';\n@import '${PACKAGE_NAME}/styles.css';\n`)
  await writeFile(
    join(CONSUMER, 'vite.config.ts'),
    "import { svelte } from '@sveltejs/vite-plugin-svelte'\nimport tailwindcss from '@tailwindcss/vite'\nimport { defineConfig } from 'vite'\n\nexport default defineConfig({ plugins: [svelte(), tailwindcss()] })\n",
  )

  const install = spawnSync('npm', ['install', '--no-audit', '--no-fund'], {
    cwd: CONSUMER,
    encoding: 'utf8',
  })
  check('the consumer installs the tarball', install.status === 0, (install.stderr ?? '').trim().split('\n')[0])

  const buildConsumer = spawnSync('npx', ['vite', 'build'], { cwd: CONSUMER, encoding: 'utf8' })
  check('the consumer builds against the package', buildConsumer.status === 0)
  if (buildConsumer.status !== 0) {
    console.error((buildConsumer.stderr ?? '').split('\n').slice(-25).join('\n'))
  }
}

// --- result ----------------------------------------------------------------

console.log('')
if (failures.length > 0) {
  console.error(`package: ${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('package: every check passed')
