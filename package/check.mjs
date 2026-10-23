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
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

import { BUILD_DIR, OUT, PACKAGE_NAME, ROOT } from './build.mjs'

const CONSUMER = join(BUILD_DIR, 'consumer')

const failures = []
function check(label, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(label)
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
const rel = (abs) => relative(OUT, abs).split(/[\\/]/).join('/')

check('the package carries files', shipped.length > 0, `${shipped.length} files`)

const testFiles = shipped.filter((abs) => /(\.test\.[a-z]+|\.harness\.svelte)$/.test(rel(abs)))
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

// Every relative import must name a file that exists.
const RELATIVE_SPECIFIER_RE = /(?:\bfrom|\bimport)\s*\(?\s*['"](\.[^'"]+)['"]/g
const unresolved = []
for (const abs of shipped) {
  if (!/\.js$/.test(abs)) continue
  const text = readFileSync(abs, 'utf8')
  for (const [, specifier] of text.matchAll(RELATIVE_SPECIFIER_RE)) {
    const target = resolve(dirname(abs), specifier)
    if (!existsSync(target)) unresolved.push(`${rel(abs)} -> ${specifier}`)
  }
}
check('every relative import resolves', unresolved.length === 0, unresolved.slice(0, 5).join(', '))

// The manifest's promises must exist.
const manifest = JSON.parse(readFileSync(join(OUT, 'package.json'), 'utf8'))
const missingTargets = []
for (const [key, value] of Object.entries(manifest.exports ?? {})) {
  const targets = typeof value === 'string' ? [value] : Object.values(value)
  for (const target of targets) {
    if (target.includes('*')) continue
    if (!existsSync(join(OUT, target))) missingTargets.push(`${key} -> ${target}`)
  }
}
check('every export target exists', missingTargets.length === 0, missingTargets.join(', '))
check('the package declares its peer dependency', Boolean(manifest.peerDependencies?.svelte))
check('the stylesheet ships', existsSync(join(OUT, 'styles.css')))
check(
  'the stylesheet points Tailwind at the package',
  readFileSync(join(OUT, 'styles.css'), 'utf8').includes('@source "./"'),
)

// --- the tarball -----------------------------------------------------------

console.log('\npackage: packing')
const pack = spawnSync('npm', ['pack', '--dry-run', '--json'], { cwd: OUT, encoding: 'utf8' })
if (pack.status !== 0) {
  check('npm pack succeeds', false, (pack.stderr ?? '').trim().split('\n')[0])
} else {
  const [tarball] = JSON.parse(pack.stdout)
  const packedFiles = tarball.files.map((file) => file.path)
  check('the tarball carries the manifest', packedFiles.includes('package.json'))
  check(
    'the tarball carries no test',
    packedFiles.every((file) => !/(\.test\.[a-z]+|\.harness\.svelte)$/.test(file)),
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

  const tarball = spawnSync('npm', ['pack', '--json'], { cwd: OUT, encoding: 'utf8' })
  if (tarball.status !== 0) {
    check('npm pack succeeds', false, (tarball.stderr ?? '').trim().split('\n')[0])
  } else {
    const [{ filename }] = JSON.parse(tarball.stdout)
    const app = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    await writeFile(
      join(CONSUMER, 'package.json'),
      `${JSON.stringify(
        {
          name: 'package-consumer',
          private: true,
          type: 'module',
          dependencies: {
            [PACKAGE_NAME]: `file:${join(OUT, filename)}`,
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
    const modules = shipped
      .filter((abs) => rel(abs).endsWith('.svelte'))
      .map((abs) => rel(abs).replace(/\.svelte$/, ''))
    await writeFile(
      join(CONSUMER, 'src', 'main.ts'),
      `import './app.css'\n${modules.map((name) => `import '${PACKAGE_NAME}/${name}.svelte'`).join('\n')}\nconsole.log(${modules.length})\n`,
    )
    await writeFile(
      join(CONSUMER, 'index.html'),
      '<!doctype html><html><head><meta charset="utf-8"><title>consumer</title></head><body><script type="module" src="/src/main.ts"></script></body></html>\n',
    )
    await writeFile(
      join(CONSUMER, 'src', 'app.css'),
      `@import 'tailwindcss';\n@import '${PACKAGE_NAME}/styles.css';\n`,
    )
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
