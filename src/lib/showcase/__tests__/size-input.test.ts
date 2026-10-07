import { describe, expect, it } from 'vitest'
import { parseSizeValue, sizeAttributeFragment, sizeAttributeLine } from '../size-input'

describe('parseSizeValue', () => {
  it('parses playground size input into names, numbers, or unset', () => {
    expect(parseSizeValue('')).toBeUndefined()
    expect(parseSizeValue('sm')).toBe('sm')
    expect(parseSizeValue('14')).toBe(14)
    expect(parseSizeValue('13.5')).toBe(13.5)
    expect(parseSizeValue('huge')).toBeUndefined()
    expect(parseSizeValue('14px')).toBeUndefined()
  })
})

describe('sizeAttributeLine', () => {
  it('emits names as strings, numbers as expressions, nothing for invalid', () => {
    expect(sizeAttributeLine('lg')).toEqual(['  size="lg"'])
    expect(sizeAttributeLine('14')).toEqual(['  size={14}'])
    expect(sizeAttributeLine('')).toEqual([])
    expect(sizeAttributeLine('huge')).toEqual([])
  })
})

describe('sizeAttributeFragment', () => {
  it('emits an inline fragment for names and numbers', () => {
    expect(sizeAttributeFragment('lg')).toBe(' size="lg"')
    expect(sizeAttributeFragment('14')).toBe(' size={14}')
    expect(sizeAttributeFragment('')).toBe('')
    expect(sizeAttributeFragment('huge')).toBe('')
  })
})
