import { describe, expect, it } from 'vitest'
import { parse } from 'svelte/compiler'
import { buildSource, collectDeclaredNames, rewriteImports, splitLeadingScript } from './snippet-source'

describe('splitLeadingScript', () => {
  it('returns the snippet untouched when it has no script', () => {
    const result = splitLeadingScript('<Button>Hi</Button>')
    expect(result).toEqual({ declarations: '', markup: '<Button>Hi</Button>' })
  })

  it('splits a leading script from the markup', () => {
    const result = splitLeadingScript(`<script>
  const rows = [{ id: 'p1' }]
</script>
<DataTable rows={rows} />`)
    expect(result.declarations).toContain("const rows = [{ id: 'p1' }]")
    expect(result.markup).toBe('\n<DataTable rows={rows} />')
  })

  it('allows leading whitespace before the script', () => {
    const result = splitLeadingScript('\n  <script>const a = 1</script>\n<span />')
    expect(result.declarations).toBe('const a = 1')
    expect(result.markup).toBe('\n<span />')
  })

  it('rejects a module-context script', () => {
    expect(() => splitLeadingScript('<script context="module">const a = 1</script>')).toThrow(
      /must not have attributes/,
    )
    expect(() => splitLeadingScript('<script module>const a = 1</script>')).toThrow(/must not have attributes/)
  })

  it('rejects a second top-level script', () => {
    expect(() => splitLeadingScript('<script>const a = 1</script>\n<script>const b = 2</script>')).toThrow(
      /at most one top-level/,
    )
  })

  it('rejects a script that is not first', () => {
    expect(() => splitLeadingScript('<span />\n<script>const a = 1</script>')).toThrow(/must be the first thing/)
  })
})

describe('buildSource', () => {
  it('omits scope keys the snippet declares and keeps the rest', () => {
    const source = buildSource({
      markup: '<DataTable />',
      declarations: 'const rows = []',
      scopeKeys: ['rows', 'foo'],
      declaredNames: new Set(['rows']),
      componentImports: '',
    })
    expect(source).toContain('let foo = $state(__scope.foo)')
    expect(source).not.toContain('$state(__scope.rows)')
    expect(source).toContain('const rows = []')
    expect(source).toContain('</script>\n<DataTable />')
  })

  it('seeds every locally declared key as $state', () => {
    const source = buildSource({
      markup: '<span />',
      declarations: 'const a = 1',
      scopeKeys: ['a'],
      declaredNames: new Set(['a']),
      componentImports: '',
    })
    expect(source).not.toContain('__scope')
  })

  it('works without declarations', () => {
    const source = buildSource({
      markup: '<span />',
      declarations: '',
      scopeKeys: ['value'],
      declaredNames: new Set(),
      componentImports: '',
    })
    expect(source).toContain('let value = $state(__scope.value)')
    expect(source).toContain('</script>\n<span />')
  })
})

describe('collectDeclaredNames', () => {
  function namesFor(declarations: string): string[] {
    const ast = parse(`<script>${declarations}</script>`, { modern: true })
    expect(ast.instance).not.toBeNull()
    return [...collectDeclaredNames(ast.instance!.content)].sort()
  }

  it('collects const, destructured, function, and class names', () => {
    expect(
      namesFor(`
        const rows = []
        const columns = []
        let { a, b: c } = obj
        const [x, , y] = list
        function helper() {}
        class Thing {}
      `),
    ).toEqual(['Thing', 'a', 'c', 'helper', 'rows', 'x', 'y', 'columns'].sort())
  })

  it('returns an empty set for no declarations', () => {
    expect(namesFor('')).toEqual([])
  })
})

describe('rewriteImports', () => {
  const compiled = [
    "import 'svelte/internal/disclose-version';",
    "import * as svelteClient from 'svelte/internal/client';",
    "import Button from 'ui/Button.svelte';",
    "import { a, b } from 'ui/Tabs.svelte';",
    'export default function App() { return svelteClient }',
  ].join('\n')

  it('drops side-effect imports', () => {
    expect(rewriteImports(compiled)).not.toContain('disclose-version')
  })

  it('binds namespace, default, and named imports to the registry', () => {
    const out = rewriteImports(compiled)
    expect(out).toContain('const svelteClient = __mods["svelte/internal/client"];')
    expect(out).toContain('const Button = __mods["ui/Button.svelte"].default;')
    expect(out).toContain('const { a, b } = __mods["ui/Tabs.svelte"];')
  })

  it('turns the default export into the factory return', () => {
    expect(rewriteImports(compiled)).toContain('return function App()')
  })
})
