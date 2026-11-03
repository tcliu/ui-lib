import { describe, expect, it } from 'vitest'
import { TEXT_INPUT_RATIOS } from '$lib/components/text-input-metrics'
import type { SnippetAttribute } from './snippet-attributes'
import { staged, type Staged } from './staged'
import {
  appliedRatios,
  componentRatiosField,
  parseRatiosJson,
  parseRatiosValue,
  ratiosAttrLine,
  ratiosAttributeFragment,
} from './text-input-ratios'

describe('parseRatiosJson', () => {
  it('accepts a partial object of finite shared ratios', () => {
    expect(parseRatiosJson(TEXT_INPUT_RATIOS, '{"font":0.5,"padX":0.75}')).toEqual({ font: 0.5, padX: 0.75 })
    expect(parseRatiosJson(TEXT_INPUT_RATIOS, '{}')).toEqual({})
  })

  it('rejects unknown keys, derived metrics, non-numbers, and non-objects', () => {
    expect(parseRatiosJson(TEXT_INPUT_RATIOS, '{"unknown":1}')).toBeNull()
    // The line box derives from font, so it is not an override key.
    expect(parseRatiosJson(TEXT_INPUT_RATIOS, '{"line":2}')).toBeNull()
    expect(parseRatiosJson(TEXT_INPUT_RATIOS, '{"font":"big"}')).toBeNull()
    expect(parseRatiosJson(TEXT_INPUT_RATIOS, '{"font":null}')).toBeNull()
    expect(parseRatiosValue(TEXT_INPUT_RATIOS, [0.5])).toBeNull()
    expect(parseRatiosJson(TEXT_INPUT_RATIOS, 'not json')).toBeNull()
  })
})

describe('appliedRatios', () => {
  it('applies a non-empty override only while the eye is on', () => {
    expect(appliedRatios(staged({ font: 0.5 }))).toBeUndefined()
    expect(appliedRatios(staged({}, true))).toBeUndefined()
    expect(appliedRatios(staged({ font: 0.5 }, true))).toEqual({ font: 0.5 })
  })
})

describe('ratiosAttrLine', () => {
  it('omits the override while the eye is off or the object is empty', () => {
    expect(ratiosAttrLine(staged({ font: 0.5 }))).toEqual([])
    expect(ratiosAttrLine(staged({}, true))).toEqual([])
  })

  it('emits an inline object expression while set', () => {
    expect(ratiosAttrLine(staged({ font: 0.5, clearButton: 0.7 }, true), '    ')).toEqual([
      '    ratios={{"font":0.5,"clearButton":0.7}}',
    ])
  })
})

describe('ratiosAttributeFragment', () => {
  it('emits a leading-space fragment for a one-line tag, or nothing', () => {
    expect(ratiosAttributeFragment(staged({}))).toBe('')
    expect(ratiosAttributeFragment(staged({ padX: 0.75 }, true))).toBe(' ratios={{"padX":0.75}}')
  })
})

describe('componentRatiosField', () => {
  const field = (value: Staged<Partial<typeof TEXT_INPUT_RATIOS>>) =>
    componentRatiosField({
      base: TEXT_INPUT_RATIOS,
      type: 'TextInputRatioOverrides?',
      note: 'Field ratios.',
      value,
    })

  it('builds the shared JSON row with its eye and custom write-back', () => {
    const value = staged({ font: 0.5 }, true)
    const row = field(value)
    expect(row.name).toBe('ratios')
    expect(row.editor).toBe('options-json')
    expect(row.dialog?.valid?.('{"font":0.25}')).toBe(true)
    expect(row.dialog?.valid?.('{"nope":0.25}')).toBe(false)
    expect(row.sync?.kind).toBe('custom')
    row.sync?.set?.('{"padX":0.75}')
    expect(value.value).toEqual({ padX: 0.75 })
    expect(value.on).toBe(true)
  })

  it('seeds the dialog with the resolved defaults as valid JSON', () => {
    const row = field(staged({}))
    expect(JSON.parse(row.value ?? '')).toEqual(TEXT_INPUT_RATIOS)
    expect(row.dialog?.valid?.(row.value ?? '')).toBe(true)
  })

  it('drops default-valued keys on commit', () => {
    const value = staged({}, false)
    const row = field(value)
    const seed = JSON.parse(row.value ?? '') as Record<string, number>

    row.onChange?.(JSON.stringify(seed))
    expect(value.value).toEqual({})
    expect(value.on).toBe(false)

    row.onChange?.(JSON.stringify({ ...seed, font: 0.5, padX: 0.75 }))
    expect(value.value).toEqual({ font: 0.5, padX: 0.75 })
    expect(value.on).toBe(true)

    value.value = {}
    row.onChange?.(JSON.stringify({ ...seed, font: 0.5 }))
    expect(value.value).toEqual({ font: 0.5 })
  })

  it('leaves the committed override alone while the attribute is absent', () => {
    const value = staged({ font: 0.5 }, true)
    const row = field(value)
    const read = (entries: [string, SnippetAttribute][]) => row.sync?.read?.(new Map(entries), '')
    expect(read([])).toBeUndefined()
    expect(read([['ratios', { kind: 'bare' }]])).toBeUndefined()
    expect(read([['ratios', { kind: 'expression', value: '{"padX":0.75}' }]])).toBe('{"padX":0.75}')
  })
})
