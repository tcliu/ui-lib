import { describe, expect, it } from 'vitest'
import { useSelectFilter } from './use-select-filter.svelte'

const OPTIONS = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'twenty', label: 'Twenty' },
]

interface FilterSetup {
  query: string
  options?: { value: string; label: string }[]
  filterable?: boolean
  dirty?: boolean
  echoedLabel?: string
}

// Each case builds its own filter over constant getters, so the derived values
// compute once against that case's inputs.
function filter({ query, options = OPTIONS, filterable = true, dirty = true, echoedLabel = '' }: FilterSetup) {
  return useSelectFilter({
    options: () => options,
    filterable: () => filterable,
    dirty: () => dirty,
    text: () => query,
    echoedLabel: () => echoedLabel,
  })
}

describe('useSelectFilter', () => {
  it('filters case-insensitively on label and value', () => {
    const { filteredOptions } = filter({ query: 'TW' })
    expect(filteredOptions.map(option => option.value)).toEqual(['two', 'twenty'])
  })

  it('returns every option for an empty query', () => {
    const { filteredOptions } = filter({ query: '' })
    expect(filteredOptions).toEqual(OPTIONS)
  })

  it('returns every option when filtering is off, even with typed text', () => {
    const { filteredOptions } = filter({ query: 'one', filterable: false })
    expect(filteredOptions).toEqual(OPTIONS)
  })

  it('returns every option when the query matches nothing', () => {
    const { filteredOptions } = filter({ query: 'zzz' })
    expect(filteredOptions).toEqual(OPTIONS)
  })

  it('emphasizes matches only while the query is ambiguous', () => {
    const multi = filter({ query: 'o' })
    expect(multi.filteredOptions).toHaveLength(2)
    expect(multi.highlightMatches).toBe(true)

    const single = filter({ query: 'one' })
    expect(single.filteredOptions).toHaveLength(1)
    expect(single.highlightMatches).toBe(false)
  })

  it('splits a label around its matched span', () => {
    const { labelParts } = filter({ query: 'o' })
    expect(labelParts('Two')).toEqual({ before: 'Tw', match: 'o', after: '' })
    expect(labelParts('One')).toEqual({ before: '', match: 'O', after: 'ne' })
  })

  it('returns null parts when highlighting is off', () => {
    const { labelParts } = filter({ query: 'one' })
    expect(labelParts('One')).toBeNull()
  })
})
