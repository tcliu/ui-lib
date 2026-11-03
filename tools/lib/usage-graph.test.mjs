import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { ROOT } from '../../scripts/lib/root.mjs'
import { collectUsage } from './usage-graph.mjs'

// The canonical package name, read the same way the graph reads it, so the spec
// resolves against this repo's own manifest instead of a hardcoded scope.
const NAME = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).name

// A throwaway app tree: `files` maps a path to its contents.
function scratch(files) {
  const root = mkdtempSync(join(tmpdir(), 'usage-graph-'))
  for (const [path, contents] of Object.entries(files)) {
    const abs = join(root, path)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, contents)
  }
  return root
}

describe('package imports', () => {
  it('reports a directory subpath, which the exports map has no index fallback for', () => {
    const root = scratch({
      'src/a.ts': `import { store } from '${NAME}/i18n'\n`,
    })
    expect(collectUsage(root).missingPackageImports).toEqual([
      { specifier: `${NAME}/i18n`, target: 'src/lib/i18n', importer: 'src/a.ts' },
    ])
  })

  it('reports a source the package prune drops', () => {
    const root = scratch({
      'src/a.ts': `import { card } from '${NAME}/server/card'\nimport Harness from '${NAME}/i18n/store.harness.svelte'\n`,
    })
    expect(collectUsage(root).missingPackageImports.map(miss => miss.specifier)).toEqual([
      `${NAME}/server/card`,
      `${NAME}/i18n/store.harness.svelte`,
    ])
  })

  it('accepts a shipped subpath carrying a query suffix', () => {
    const root = scratch({
      'src/a.ts': `import raw from '${NAME}/styles.css?raw'\n`,
    })
    expect(collectUsage(root).missingPackageImports).toEqual([])
  })

  it('ignores a package path named only in a whole-line comment', () => {
    const root = scratch({
      'src/a.ts': `// import gone from '${NAME}/gone/away'\n/* import also from '${NAME}/also/gone' */\nexport {}\n`,
    })
    expect(collectUsage(root).missingPackageImports).toEqual([])
  })

  it('reports a specifier whose canonical source is gone, with the file that imports it', () => {
    const root = scratch({
      'src/a.ts': `import gone from '${NAME}/gone/away'\n`,
    })
    expect(collectUsage(root).missingPackageImports).toEqual([
      { specifier: `${NAME}/gone/away`, target: 'src/lib/gone/away', importer: 'src/a.ts' },
    ])
  })

  it('accepts the shipped component, entry, and manifest paths', () => {
    const root = scratch({
      'src/a.ts':
        `import Button from '${NAME}/components/Button.svelte'\n` +
        `import { LOCALES } from '${NAME}'\n` +
        `import manifest from '${NAME}/package.json'\n`,
    })
    expect(collectUsage(root).missingPackageImports).toEqual([])
  })

  it('reports one entry per specifier even when several files import it', () => {
    const root = scratch({
      'src/a.ts': `import gone from '${NAME}/gone/away'\n`,
      'src/b.ts': `import gone from '${NAME}/gone/away'\n`,
    })
    expect(collectUsage(root).missingPackageImports).toHaveLength(1)
  })

  it('ignores a bare specifier that names another package', () => {
    const root = scratch({
      'src/a.ts': `import 'svelte'\nimport '${NAME}-extra/gone'\n`,
    })
    expect(collectUsage(root).missingPackageImports).toEqual([])
  })

  it('keeps resolving $lib imports to the app source', () => {
    const root = scratch({
      'src/a.ts': `import { SIZE_PX } from '$lib/size-scale'\n`,
    })
    expect(collectUsage(root).importTargets.has('src/lib/size-scale.ts')).toBe(true)
  })
})

describe('subpath imports', () => {
  it('resolves a Node subpath import from the project manifest', () => {
    const root = scratch({
      'package.json': JSON.stringify({ imports: { '#lib/*': './src/lib/*' } }),
      'src/a.ts': `import Button from '#lib/components/Button.svelte'\n`,
    })
    expect(collectUsage(root).live.has('src/lib/components/Button.svelte')).toBe(true)
  })

  it('resolves a subpath import emitted with a .js extension to its TypeScript source', () => {
    const root = scratch({
      'package.json': JSON.stringify({ imports: { '#lib/*': './src/lib/*' } }),
      'src/a.ts': `import env from '#lib/app-environment.js'\n`,
    })
    expect(collectUsage(root).importTargets.has('src/lib/app-environment.ts')).toBe(true)
  })

  it('ignores a subpath import that maps outside the project', () => {
    const root = scratch({
      'package.json': JSON.stringify({ imports: { '#dep': 'some-package' } }),
      'src/a.ts': `import dep from '#dep'\n`,
    })
    expect(collectUsage(root).importTargets.size).toBe(0)
  })
})
