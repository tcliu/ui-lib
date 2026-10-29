import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { collectViolations, readAliases } from './check-test-layout.mjs'

// A throwaway project tree: `files` maps a path to its contents.
function scratch(files) {
  const root = mkdtempSync(join(tmpdir(), 'check-test-layout-'))
  for (const [path, contents] of Object.entries(files)) {
    const abs = join(root, path)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, contents)
  }
  return root
}

// The scratch trees carry no generated config, so the suite supplies the alias
// map `svelte-kit sync` writes for the project.
const ALIASES = new Map([
  ['$lib', 'src/lib'],
  ['$showcase', 'src/showcase'],
  ['$appLib', 'src/app'],
])
const gate = root => collectViolations(root, ALIASES)

describe('readAliases', () => {
  it('reads the aliases from the generated tsconfig', () => {
    const root = scratch({
      '.svelte-kit/tsconfig.json': JSON.stringify({
        compilerOptions: {
          paths: {
            $lib: ['../src/lib'],
            '$lib/*': ['../src/lib/*'],
            $showcase: ['../src/showcase'],
          },
        },
      }),
    })
    expect([...readAliases(root)]).toEqual([
      ['$lib', 'src/lib'],
      ['$showcase', 'src/showcase'],
    ])
  })

  it('returns no aliases without a generated config', () => {
    expect(readAliases(scratch({}))).toEqual(new Map())
  })
})

describe('collectViolations', () => {
  it('accepts a test that sits beside the module it exercises', () => {
    const root = scratch({
      'src/lib/components/Button.svelte': '<button></button>',
      'src/lib/components/button-size.test.ts': "import Button from './Button.svelte'\n",
    })
    expect(gate(root)).toEqual([])
  })

  it('accepts a browser spec in the tests directory', () => {
    const root = scratch({ 'tests/button.spec.ts': "import { test } from '@playwright/test'\n" })
    expect(gate(root)).toEqual([])
  })

  it('reports a test-only directory', () => {
    const root = scratch({
      'src/lib/components/Button.svelte': '<button></button>',
      'src/lib/components/__tests__/button.test.ts': "import Button from '../Button.svelte'\n",
    })
    const violations = gate(root)
    // The directory is reported, and so is the test it holds.
    expect(violations).toHaveLength(2)
    expect(violations[0]).toMatch(/test dir {2}src\/lib\/components\/__tests__/)
    expect(violations[1]).toMatch(/misplaced {2}src\/lib\/components\/__tests__\/button\.test\.ts/)
  })

  it('reports a test that imports no module from its own directory', () => {
    const root = scratch({
      'src/lib/size-scale.ts': 'export const scale = 1\n',
      'src/lib/components/Button.svelte': '<button></button>',
      'src/lib/components/button-size.test.ts': "import { scale } from '../size-scale'\n",
    })
    const violations = gate(root)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatch(/imports no module from src\/lib\/components/)
  })

  it('reports a test directory that holds no module to sit beside', () => {
    const root = scratch({ 'src/lib/button.test.ts': "import { test } from 'vitest'\n" })
    const violations = gate(root)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatch(/no module in src\/lib/)
  })

  it('reports a unit test parked in the browser directory', () => {
    const root = scratch({ 'tests/button.test.ts': "import { test } from 'vitest'\n" })
    const violations = gate(root)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatch(/wrong kind tests\/button\.test\.ts/)
  })

  it('reports a browser spec outside the browser directory', () => {
    const root = scratch({
      'src/lib/components/Button.svelte': '<button></button>',
      'src/lib/components/button.spec.ts': "import { test } from '@playwright/test'\n",
    })
    const violations = gate(root)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatch(/wrong kind src\/lib\/components\/button\.spec\.ts/)
  })

  it('does not count a type declaration as the module a test sits beside', () => {
    const root = scratch({
      'src/lib/components/button.d.ts': 'export interface ButtonProps { label: string }\n',
      'src/lib/components/button.test.ts': "import './button.d.ts'\n",
    })
    const violations = gate(root)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatch(/no module in src\/lib\/components/)
  })

  it('accepts a $lib import that points back at the test directory', () => {
    const root = scratch({
      'src/lib/components/use-resize-drag.svelte.ts': 'export const drag = 1\n',
      'src/lib/components/use-resize-drag.test.ts': "import { drag } from '$lib/components/use-resize-drag.svelte'\n",
    })
    expect(gate(root)).toEqual([])
  })

  it('accepts a $showcase import that points back at the test directory', () => {
    const root = scratch({
      'src/showcase/snippet-build.ts': 'export const escape = 1\n',
      'src/showcase/snippet-build.test.ts': "import { escape } from '$showcase/snippet-build'\n",
    })
    expect(gate(root)).toEqual([])
  })

  it('accepts a test under a root reached through a symlink', () => {
    const root = scratch({
      'src/lib/components/Button.svelte': '<button></button>',
      'src/lib/components/button-size.test.ts': "import Button from './Button.svelte'\n",
    })
    const link = join(mkdtempSync(join(tmpdir(), 'check-test-layout-link-')), 'root')
    symlinkSync(root, link, 'dir')
    expect(collectViolations(link)).toEqual([])
  })

  it('ignores a package import beside a sibling import', () => {
    const root = scratch({
      'src/lib/components/Button.svelte': '<button></button>',
      'src/lib/components/button-size.test.ts': "import { it } from 'vitest'\nimport Button from './Button.svelte'\n",
    })
    expect(gate(root)).toEqual([])
  })

  it('reports a test whose imports point at nothing', () => {
    const root = scratch({
      'src/lib/components/Button.svelte': '<button></button>',
      'src/lib/components/button-size.test.ts':
        "import Missing from './Missing.svelte'\nimport { nope } from '$lib/components/nope'\n",
    })
    const violations = gate(root)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatch(/imports no module from src\/lib\/components/)
  })

  it('reports a unit test parked outside the unit-test roots', () => {
    const root = scratch({
      'lib/button.ts': 'export const button = 1\n',
      'lib/button.test.ts': "import { button } from './button'\n",
    })
    const violations = gate(root)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatch(/misplaced {2}lib\/button\.test\.ts/)
  })
})
