import { describe, expect, it } from 'vitest'
import { extractComponentAttributes, extractScriptJsonConst, extractScriptValue } from './snippet-attributes'

describe('extractComponentAttributes', () => {
  it('extracts string, bare, and expression attributes without tripping on arrows', () => {
    const attrs = extractComponentAttributes(
      [
        '<SelectDropdown',
        '  ariaLabel="mini"',
        '  size="lg"',
        '  filterable',
        '  autoPlace={false}',
        '  onSelect={next => (value = next)} />',
      ].join('\n'),
      'SelectDropdown',
    )
    expect(attrs?.get('ariaLabel')).toEqual({ kind: 'string', value: 'mini' })
    expect(attrs?.get('size')).toEqual({ kind: 'string', value: 'lg' })
    expect(attrs?.get('filterable')).toEqual({ kind: 'bare' })
    expect(attrs?.get('autoPlace')).toEqual({ kind: 'expression', value: 'false' })
    expect(attrs?.get('onSelect')).toEqual({ kind: 'expression', value: 'next => (value = next)' })
  })

  it('finds the named tag among other markup', () => {
    const attrs = extractComponentAttributes('<div><ChipDropdown label="x" /></div>', 'ChipDropdown')
    expect(attrs?.get('label')).toEqual({ kind: 'string', value: 'x' })
  })

  it('returns null without a complete named tag', () => {
    expect(extractComponentAttributes('<Button>Hi</Button>', 'SelectDropdown')).toBeNull()
    expect(extractComponentAttributes('<SelectDropdown size="lg"', 'SelectDropdown')).toBeNull()
    expect(extractComponentAttributes('<SelectDropdown {...spread} />', 'SelectDropdown')).toBeNull()
  })

  it('reads script-local value state back out', () => {
    expect(extractScriptValue('let stageWidth = $state(560)\nlet value = $state("four")')).toBe('four')
    expect(extractScriptValue('let value = $state("a\\"b")')).toBe('a"b')
    expect(extractScriptValue('let value = $state(4)')).toBeNull()
    expect(extractScriptValue('no script here')).toBeNull()
  })

  it('reads script-local state by name', () => {
    const declarations = 'let from = $state("2026-09-01")\nlet to = $state("")'
    expect(extractScriptValue(declarations, 'from')).toBe('2026-09-01')
    expect(extractScriptValue(declarations, 'to')).toBe('')
    expect(extractScriptValue(declarations, 'value')).toBeNull()
    expect(extractScriptValue(declarations, 'fro')).toBeNull()
  })

  it('reads script-local array state back out', () => {
    expect(
      extractScriptJsonConst('let stageWidth = $state(560)\nlet columns = $state([{ "key": "id" }])', 'columns'),
    ).toEqual([{ key: 'id' }])
    expect(extractScriptJsonConst('let columns = $state([{ "key": "a[b" }])', 'columns')).toEqual([{ key: 'a[b' }])
    expect(extractScriptJsonConst('let columns = $state(4)', 'columns')).toBeNull()
    expect(extractScriptJsonConst('let columns = $state([{ "key": "id" }', 'columns')).toBeNull()
    expect(extractScriptJsonConst('let other = $state([1])', 'columns')).toBeNull()
    expect(extractScriptJsonConst('no script here', 'columns')).toBeNull()
  })
})
