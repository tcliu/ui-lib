import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  collectViolations,
  destructuredProps,
  fieldRows,
  fieldsBody,
  formatReport,
  isPrimitiveType,
  readComponents,
} from './check-showcase-props.mjs'

// A throwaway project tree: `files` maps a path to its contents.
function scratch(files) {
  const root = mkdtempSync(join(tmpdir(), 'check-showcase-props-'))
  for (const [path, contents] of Object.entries(files)) {
    const abs = join(root, path)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, contents)
  }
  return root
}

const INDEX = `
export const SHOWCASE_COMPONENTS = [
  { slug: 'widget', name: 'Widget' },
  { slug: 'icons', name: 'Icons' },
]
`

function component(props) {
  return `<script lang="ts">
  let { ${props} }: Props = $props()
</script>
`
}

function page(rows) {
  return `<script lang="ts">
  const fields: SyncableFieldConfig[] = $derived([
${rows}
  ])
</script>
`
}

const COMPLETE_PAGE = page(`    textField({ name: 'label', type: 'string', defaultValue: '—', note: 'Label.' }),
    { name: 'onChange', type: '(value: string) => void', defaultValue: '—', note: 'Handler.' },
    sizeField({ note: 'Size.' })`)

function project(overrides = {}) {
  return scratch({
    'src/app/showcase/index/showcase-components.ts': INDEX,
    'src/lib/components/Widget.svelte': component(`label, onChange, size = 'md'`),
    'src/routes/components/widget/+page.svelte': COMPLETE_PAGE,
    ...overrides,
  })
}

describe('destructuredProps', () => {
  it('reads names through defaults, renames, and rest spreads', () => {
    expect(destructuredProps(component(`label, state: tabState, items = [], ...rest`))).toEqual([
      'label',
      'state',
      'items',
    ])
  })

  it('skips comments inside the destructure', () => {
    expect(
      destructuredProps(`let {
  // A required label.
  label,
  /* Optional. */ size = 'md',
}: Props = $props()`),
    ).toEqual(['label', 'size'])
  })

  it('returns null when the component has no $props destructure', () => {
    expect(destructuredProps('<script>let count = 0</script>')).toBeNull()
  })
})

describe('fieldsBody and fieldRows', () => {
  it('slices the derived array across comments and nested commas', () => {
    const body = fieldsBody(COMPLETE_PAGE)
    expect(body).not.toBeNull()
    expect(body).toContain("name: 'label'")
  })

  it('reads plain array literals', () => {
    const source = `const fields = [\n  textField({ name: 'a' }),\n]`
    expect(fieldsBody(source)).toContain("name: 'a'")
  })

  it('maps helper calls and raw rows to names, editors, and types', () => {
    const rows = fieldRows(fieldsBody(COMPLETE_PAGE))
    expect(rows).toEqual([
      { name: 'label', type: 'string', hasEditor: true },
      { name: 'onChange', type: '(value: string) => void', hasEditor: false },
      { name: 'size', type: null, hasEditor: true },
    ])
  })

  it('does not split on a comma inside a string', () => {
    const rows = fieldRows(`    { name: 'note', type: 'string', defaultValue: '—', note: 'a, b', editor: 'text' }`)
    expect(rows).toEqual([{ name: 'note', type: 'string', hasEditor: true }])
  })
})

describe('isPrimitiveType', () => {
  it('accepts strings, numbers, booleans, and literal unions', () => {
    expect(isPrimitiveType('string')).toBe(true)
    expect(isPrimitiveType('boolean?')).toBe(true)
    expect(isPrimitiveType("'cyan' | 'rose' | 'neutral'")).toBe(true)
    expect(isPrimitiveType('true | false')).toBe(true)
    expect(isPrimitiveType('1 | 2')).toBe(true)
  })

  it('rejects compound and function types', () => {
    expect(isPrimitiveType('(value: string) => void')).toBe(false)
    expect(isPrimitiveType('string[]')).toBe(false)
    expect(isPrimitiveType('{ a: string }')).toBe(false)
    expect(isPrimitiveType('HTMLInputElement | null')).toBe(false)
    expect(isPrimitiveType('Snippet<[Row]>')).toBe(false)
    expect(isPrimitiveType(null)).toBe(false)
  })
})

describe('readComponents', () => {
  it('reads the index list', () => {
    expect(readComponents(INDEX)).toEqual([
      { slug: 'widget', component: 'Widget' },
      { slug: 'icons', component: 'Icons' },
    ])
  })
})

describe('collectViolations', () => {
  it('passes a page whose rows cover every declared prop', () => {
    expect(collectViolations(project())).toEqual({ pages: 1, props: 3, violations: [] })
  })

  it('skips the icons index (no single component)', () => {
    expect(collectViolations(project()).violations).toEqual([])
  })

  it('reports a declared prop with no row', () => {
    const root = project({
      'src/routes/components/widget/+page.svelte': page(`    textField({ name: 'label' }),\n    sizeField({ note: 'Size.' })`),
    })
    expect(collectViolations(root).violations).toEqual([
      { page: 'widget', reason: 'onChange has no props-table row' },
    ])
  })

  it('reports a primitive row with no editor', () => {
    const root = project({
      'src/routes/components/widget/+page.svelte': page(`    textField({ name: 'label' }),
    { name: 'onChange', type: '(value: string) => void', defaultValue: '—', note: 'Handler.' },
    { name: 'size', type: "'sm' | 'md'", defaultValue: 'md', note: 'Size.' }`),
    })
    expect(collectViolations(root).violations).toContainEqual({
      page: 'widget',
      reason: "size ('sm' | 'md') has no editor",
    })
  })

  it('leaves a read-only function row alone', () => {
    const root = project({
      'src/routes/components/widget/+page.svelte': page(`    textField({ name: 'label' }),
    { name: 'onChange', type: '(value: string) => void', defaultValue: '—', note: 'Handler.' },
    sizeField({ note: 'Size.' })`),
    })
    expect(collectViolations(root).violations).toEqual([])
  })

  it('reports a component with no $props destructure and a page with no fields', () => {
    const root = project({
      'src/lib/components/Widget.svelte': '<script>let count = 0</script>',
    })
    expect(collectViolations(root).violations).toEqual([
      { page: 'widget', reason: 'Widget declares no $props() destructure' },
    ])
    const noFields = project({
      'src/routes/components/widget/+page.svelte': '<p>No table</p>',
    })
    expect(collectViolations(noFields).violations).toEqual([
      { page: 'widget', reason: 'page declares no fields array' },
    ])
  })

  it('reports a missing page or component file', () => {
    const root = scratch({ 'src/app/showcase/index/showcase-components.ts': INDEX })
    const { violations } = collectViolations(root)
    expect(violations).toHaveLength(1)
    expect(violations[0].reason).toContain('missing')
  })
})

describe('formatReport', () => {
  it('summarizes a clean run and lists each violation otherwise', () => {
    expect(formatReport({ pages: 2, props: 9, violations: [] })).toBe(
      'showcase-props: 2 page(s) cover all 9 declared prop(s)',
    )
    expect(formatReport({ pages: 0, props: 0, violations: [{ page: 'widget', reason: 'x has no row' }] })).toContain(
      '- widget: x has no row',
    )
  })
})
