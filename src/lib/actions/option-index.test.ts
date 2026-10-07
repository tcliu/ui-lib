import { describe, expect, it } from 'vitest'
import { createOptionIndex, matchLabelParts, matchesOption } from './option-index'

describe('createOptionIndex / matchesOption', () => {
  it('lowercases labels and values once and matches by either', () => {
    const index = createOptionIndex([
      { value: 'Four', label: 'Four' },
      { value: 'fourteen', label: 'Fourteen' },
    ])
    expect(index[0]).toEqual({ option: { value: 'Four', label: 'Four' }, label: 'four', value: 'four' })
    expect(matchesOption(index[1], 'fou')).toBe(true)
    expect(matchesOption(index[0], 'zzz')).toBe(false)
  })
})

describe('matchLabelParts', () => {
  it('splits around the first case-insensitive match, preserving original case', () => {
    expect(matchLabelParts('Fourteen', 'fou')).toEqual({ before: '', match: 'Fou', after: 'rteen' })
    expect(matchLabelParts('Two', 'o')).toEqual({ before: 'Tw', match: 'o', after: '' })
  })

  it('returns null for an empty needle', () => {
    expect(matchLabelParts('Four', '')).toBeNull()
  })

  it('returns null when the label does not contain the needle', () => {
    expect(matchLabelParts('Four', 'six')).toBeNull()
  })
})
