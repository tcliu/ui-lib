#!/usr/bin/env node
// package/check.mjs — verify the publishable package before it is published.
//
// The build compiles the surface into `dist/`; this script asserts that what
// npm would publish is correct and self-contained: no app-only specifier
// survives, no test ships, every import inside the package resolves, and every
// export the manifest promises exists. It then packs the tarball and, with
// `--consumer`, installs it into a scratch app and builds it, which is the
// only check that exercises the package the way a consumer does.
//
// Run from the repository root:
//   node package/check.mjs             # build, assert, pack
//   node package/check.mjs --consumer  # also build the scratch consumer

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

import { BUILD_DIR, OUT, PACKAGE_NAME, ROOT } from './build.mjs'

const CONSUMER = join(BUILD_DIR, 'consumer')

const failures = []
function check(label, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

/**
 * The tarball entries `npm pack --json` reports. npm 12 emits one entry keyed by
 * package name; earlier releases emit an array.
 */
function packEntries(stdout) {
  const parsed = JSON.parse(stdout)
  return Array.isArray(parsed) ? parsed : Object.values(parsed)
}

// --- build -----------------------------------------------------------------

console.log('package: building')
const build = spawnSync(process.execPath, [join(ROOT, 'package', 'build.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
})
if (build.status !== 0) {
  console.error(build.stdout ?? '')
  console.error(build.stderr ?? '')
  process.exit(1)
}
console.log((build.stdout ?? '').trim())

// --- the shipped tree ------------------------------------------------------

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(abs))
    else files.push(abs)
  }
  return files
}

const shipped = walk(OUT)
const rel = abs => relative(OUT, abs).split(/[\\/]/).join('/')

check('the package carries files', shipped.length > 0, `${shipped.length} files`)

const testFiles = shipped.filter(abs => /(\.test\.[a-z]+|\.harness\.svelte)$/.test(rel(abs)))
check('no test or harness ships', testFiles.length === 0, testFiles.map(rel).join(', '))

// A specifier that only resolves inside this app: `from '$lib/x'` or
// `import '$lib/x'`. A mention in a comment is documentation, not a
// specifier, so the match is anchored on the import keyword.
const APP_SPECIFIER_RE = /(?:\bfrom|\bimport)\s*\(?\s*['"]\$(?:lib|app)\//
const appSpecifiers = []
for (const abs of shipped) {
  if (!/\.(js|svelte)$/.test(abs)) continue
  const text = readFileSync(abs, 'utf8')
  if (APP_SPECIFIER_RE.test(text)) appSpecifiers.push(rel(abs))
}
check('no app-only specifier ships', appSpecifiers.length === 0, appSpecifiers.join(', '))

// Every relative import must resolve. `svelte-package` keeps the specifier it
// was given, so a source import may omit the compiled extension; resolve the
// way the consumer's bundler does.
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
  if (!/\.js$/.test(abs)) continue
  const text = readFileSync(abs, 'utf8')
  for (const [, specifier] of text.matchAll(RELATIVE_SPECIFIER_RE)) {
    if (!resolvesRelative(abs, specifier)) unresolved.push(`${rel(abs)} -> ${specifier}`)
  }
}
check('every relative import resolves', unresolved.length === 0, unresolved.slice(0, 5).join(', '))

// The manifest's literal promises must exist. A pattern's target is a template,
// so the resolution check below covers those.
const manifest = JSON.parse(readFileSync(join(OUT, 'package.json'), 'utf8'))
const missingTargets = []
for (const [key, value] of Object.entries(manifest.exports ?? {})) {
  const targets = typeof value === 'string' ? [value] : Object.values(value)
  for (const target of targets) {
    if (target.includes('*')) continue
    if (!existsSync(join(OUT, target))) missingTargets.push(`${key} -> ${target}`)
  }
}
check('every literal export target exists', missingTargets.length === 0, missingTargets.join(', '))

// Every shipped module, stylesheet and the manifest must resolve through Node's
// own exports resolver: a pattern that misroutes a rune module is invisible to
// the literal check, and only a consumer install used to catch it.
const flagged = shipped.filter(abs => /\.(svelte|js|css|json)$/.test(abs) && !/\.d\.ts$/.test(abs)).map(rel)
const specifierOf = file => {
  const name = file.endsWith('.js') ? file.slice(0, -'.js'.length) : file
  return { specifier: `${PACKAGE_NAME}/${name}`, file }
}
const resolveDir = join(BUILD_DIR, 'exports-resolve')
await rm(resolveDir, { recursive: true, force: true, maxRetries: 3 }).catch(() => {})
await mkdir(join(resolveDir, 'node_modules'), { recursive: true })
await writeFile(
  join(resolveDir, 'package.json'),
  `${JSON.stringify({ name: 'exports-resolve', private: true, type: 'module' })}\n`,
)
const [scope, pkgName] = PACKAGE_NAME.split('/')
await mkdir(join(resolveDir, 'node_modules', scope), { recursive: true })
await cp(OUT, join(resolveDir, 'node_modules', scope, pkgName), { recursive: true })
await writeFile(
  join(resolveDir, 'resolve.mjs'),
  `import { fileURLToPath } from 'node:url'\n\nconst entries = ${JSON.stringify(flagged.map(specifierOf))}\nconst failures = []\nfor (const { specifier, file } of entries) {\n  try {\n    const resolved = fileURLToPath(import.meta.resolve(specifier))\n    if (!resolved.endsWith(\`/\${file}\`)) failures.push(\`\${specifier} -> \${resolved}\`)\n  } catch (error) {\n    failures.push(\`\${specifier}: \${error.code ?? error.message}\`)\n  }\n}\nif (failures.length > 0) {\n  console.error(failures.join('\\n'))\n  process.exit(1)\n}\n`,
)
const resolveRun = spawnSync(process.execPath, [join(resolveDir, 'resolve.mjs')], {
  cwd: resolveDir,
  encoding: 'utf8',
})
check(
  'every shipped file resolves through the exports map',
  resolveRun.status === 0,
  (resolveRun.stderr ?? '').trim().split('\n').slice(0, 5).join(' | '),
)
check('the package declares its peer dependency', Boolean(manifest.peerDependencies?.svelte))
check('the stylesheet ships', existsSync(join(OUT, 'styles.css')))
check(
  'the stylesheet points Tailwind at the package',
  readFileSync(join(OUT, 'styles.css'), 'utf8').includes('@source "./"'),
)
check('the README ships', existsSync(join(OUT, 'README.md')))
check('the stylesheet keeps its side effect', manifest.sideEffects?.includes?.('*.css') === true)

// --- the tarball -----------------------------------------------------------

console.log('\npackage: packing')
const pack = spawnSync('npm', ['pack', '--dry-run', '--json'], { cwd: OUT, encoding: 'utf8' })
if (pack.status !== 0) {
  check('npm pack succeeds', false, (pack.stderr ?? '').trim().split('\n')[0])
} else {
  const [tarball] = packEntries(pack.stdout)
  const packedFiles = tarball.files.map(file => file.path)
  check('the tarball carries the manifest', packedFiles.includes('package.json'))
  check(
    'the tarball carries no test',
    packedFiles.every(file => !/(\.test\.[a-z]+|\.harness\.svelte)$/.test(file)),
  )
  console.log(`       ${tarball.filename} (${packedFiles.length} files, ${tarball.size} bytes)`)
}

// --- the consumer ----------------------------------------------------------

if (process.argv.includes('--consumer')) {
  console.log('\npackage: building the scratch consumer')
  // The consumer's tree holds installed packages; a leftover directory from an
  // earlier run must not stop the check.
  await rm(CONSUMER, { recursive: true, force: true, maxRetries: 3 }).catch(() => {})
  await mkdir(join(CONSUMER, 'src'), { recursive: true })

  const tarball = spawnSync('npm', ['pack', '--json', '--pack-destination', BUILD_DIR], { cwd: OUT, encoding: 'utf8' })
  if (tarball.status !== 0) {
    check('npm pack succeeds', false, (tarball.stderr ?? '').trim().split('\n')[0])
  } else {
    const [{ filename }] = packEntries(tarball.stdout)
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
            'svelte-sonner': app.dependencies['svelte-sonner'],
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
    // The consumer imports every component and icon the package ships and lets
    // Tailwind scan the package's own stylesheet, so a broken export or a
    // missing class fails the build.
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
}

// --- result ----------------------------------------------------------------

console.log('')
if (failures.length > 0) {
  console.error(`package: ${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('package: every check passed')
