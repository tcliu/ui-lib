import { describe, expect, it } from 'vitest'
import { buildComboboxSnippet } from './demo-snippet'

describe('buildComboboxSnippet', () => {
  it('wires selection symbolically while unset', () => {
    const source = buildComboboxSnippet({ placeholder: '' })
    expect(source).toContain('selected={selected}')
    expect(source).toContain('suggestions={suggestions}')
    expect(source).toContain('onQueryChange={filterSuggestions}')
    expect(source).not.toContain('placeholder=')
  })

  it('emits the placeholder when set', () => {
    const source = buildComboboxSnippet({ placeholder: 'Pick a fruit' })
    expect(source).toContain('placeholder="Pick a fruit"')
  })
})
