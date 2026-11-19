import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { collectViolations } from './check-size-literals.mjs'

// A throwaway project tree: `files` maps a path to its contents.
function scratch(files) {
  const root = mkdtempSync(join(tmpdir(), 'check-size-literals-'))
  for (const [path, contents] of Object.entries(files)) {
    const abs = join(root, path)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, contents)
  }
  return root
}

function sized(body, extra = '') {
  return `<script lang="ts">
  import type { SizeInput } from '#lib/size-scale.js'
  ${extra}
  interface Props { size?: SizeInput }
  let { size = 'md' }: Props = $props()
</script>
${body}
`
}

describe('collectViolations', () => {
  it('fails a sized component that leaves chrome at the md step', () => {
    const root = scratch({
      'src/lib/components/Foo.svelte': sized('<div class="rounded-md gap-2 p-1"></div>'),
    })
    const violations = collectViolations(root, {}, [])
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('Foo.svelte: rounded-md, gap-2, p-1')
  })

  it('accepts metric vars, structural layout, and pill shapes', () => {
    const root = scratch({
      'src/lib/components/Foo.svelte': sized(
        '<div class="rounded-[var(--foo-radius)] gap-[var(--foo-gap)] min-w-0 w-full rounded-full"></div>',
      ),
    })
    expect(collectViolations(root, {}, [])).toEqual([])
  })

  it('accepts an allowlisted token and rejects a stale entry', () => {
    const root = scratch({
      'src/lib/components/Foo.svelte': sized('<div class="rounded-md"></div>'),
    })
    const allowed = { 'Foo.svelte': [{ tokens: ['rounded-md'], reason: 'fixed frame' }] }
    expect(collectViolations(root, allowed, [])).toEqual([])

    const clean = scratch({ 'src/lib/components/Foo.svelte': sized('<div></div>') })
    const stale = { 'Foo.svelte': [{ tokens: ['gap-2'], reason: 'gone' }] }
    const violations = collectViolations(clean, stale, [])
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('stale allowlist entries (gap-2)')
  })

  it('scans a component that forwards size from another component props type', () => {
    const forwarder = `<script lang="ts">
  import type Base from './Base.svelte'
  import type { ComponentProps } from 'svelte'
  type Props = Omit<ComponentProps<typeof Base>, 'theme'>
  let { size = 'md' }: Props = $props()
</script>
<div class="rounded-md"></div>
`
    const root = scratch({ 'src/lib/components/Lazy.svelte': forwarder })
    expect(collectViolations(root, {}, [])[0]).toContain('Lazy.svelte: rounded-md')
  })

  it('scans a class-map module a sized component imports', () => {
    const root = scratch({
      'src/lib/components/Foo.svelte': sized("<div class={shared}></div>", "import { shared } from './style-map'"),
      'src/lib/components/style-map.ts': "export const shared = 'rounded-md gap-2'\n",
    })
    const companions = ['src/lib/components/style-map.ts']
    const violations = collectViolations(root, {}, companions)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('style-map.ts: rounded-md, gap-2')
  })

  it('fails a companion module nothing imports and a missing one', () => {
    const root = scratch({
      'src/lib/components/Foo.svelte': sized('<div></div>'),
      'src/lib/dropdown-chrome.ts': "export const PANEL = 'rounded-xl'\n",
    })
    const unimported = collectViolations(root, {}, ['src/lib/dropdown-chrome.ts'])
    expect(unimported[0]).toContain('no sized component imports this companion module')

    const missing = collectViolations(root, {}, ['src/lib/components/style-map.ts'])
    expect(missing[0]).toContain('companion module is missing')
  })

  it('reports an allowlist entry for a file that is not scanned', () => {
    const root = scratch({ 'src/lib/components/Foo.svelte': sized('<div></div>') })
    const violations = collectViolations(root, { 'Gone.svelte': [{ tokens: ['gap-2'], reason: 'x' }] }, [])
    expect(violations[0]).toContain('Gone.svelte: allowlisted but not a sized surface')
  })
})
