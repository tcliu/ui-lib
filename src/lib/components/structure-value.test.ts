import { describe, expect, it } from 'vitest'
import {
  childEntries,
  containerSummary,
  copyValue,
  inputText,
  isContainer,
  jsonPath,
  parseInputValue,
  renameKeyAtPath,
  setAtPath,
  valueClass,
  valueText,
} from './structure-value'

describe('structure-value', () => {
  it('detects containers and lists child entries for objects and arrays', () => {
    expect(isContainer({ a: 1 })).toBe(true)
    expect(isContainer([1])).toBe(true)
    expect(isContainer(null)).toBe(false)
    expect(isContainer('x')).toBe(false)

    expect(childEntries(['a', 'b'])).toEqual([
      { key: '0', value: 'a' },
      { key: '1', value: 'b' },
    ])
    expect(childEntries({ a: 1 })).toEqual([{ key: 'a', value: 1 }])
  })

  it('summarizes containers and renders scalar text', () => {
    expect(containerSummary([1, 2, 3])).toBe('array[3]')
    expect(containerSummary({ a: 1 })).toBe('object{1}')

    expect(valueText(null)).toBe('null')
    expect(valueText('hi')).toBe('"hi"')
    expect(valueText(3)).toBe('3')
    expect(valueText(true)).toBe('true')
  })

  it('colors values by type with a neutral fallback for containers', () => {
    expect(valueClass(null)).toContain('italic')
    expect(valueClass('s')).toBe('text-emerald-300')
    expect(valueClass(1)).toBe('text-amber-300')
    expect(valueClass(false)).toBe('text-sky-300')
    expect(valueClass({})).toBe('text-slate-300')
  })

  it('renders the inline edit text and parses it back', () => {
    expect(inputText(null)).toBe('null')
    expect(inputText('x')).toBe('x')
    expect(inputText(3)).toBe('3')

    expect(parseInputValue('null')).toBeNull()
    expect(parseInputValue('true')).toBe(true)
    expect(parseInputValue('false')).toBe(false)
    expect(parseInputValue('3.5')).toBe(3.5)
    expect(parseInputValue('  hi  ')).toBe('hi')
    expect(parseInputValue('')).toBe('')
  })

  it('serializes a copy payload per kind', () => {
    expect(copyValue('plain')).toBe('plain')
    expect(copyValue({ a: 1 })).toBe('{\n  "a": 1\n}')
  })

  it('builds dotted and bracketed JSON paths', () => {
    expect(jsonPath([])).toBe('$')
    expect(jsonPath(['a', '0'])).toBe('$.a[0]')
    expect(jsonPath(['a b'])).toBe('$["a b"]')
    expect(jsonPath(['a', 'b-c'])).toBe('$.a["b-c"]')
  })

  it('replaces a value at a path without mutating the source', () => {
    const source = { a: { b: 1 }, list: [1, 2] }
    expect(setAtPath(source, ['a', 'b'], 9)).toEqual({ a: { b: 9 }, list: [1, 2] })
    expect(setAtPath(source, ['list', '1'], 7)).toEqual({ a: { b: 1 }, list: [1, 7] })
    // Source untouched.
    expect(source).toEqual({ a: { b: 1 }, list: [1, 2] })
  })

  it('renames a key at a path, no-ops on an equal or missing key', () => {
    const source = { a: 1, b: { c: 2 } }
    expect(renameKeyAtPath(source, [], 'a', 'z')).toEqual({ z: 1, b: { c: 2 } })
    expect(renameKeyAtPath(source, ['b'], 'c', 'd')).toEqual({ a: 1, b: { d: 2 } })
    expect(renameKeyAtPath(source, [], 'a', 'a')).toBe(source)
    expect(renameKeyAtPath(source, [], 'missing', 'z')).toBe(source)
  })
})
