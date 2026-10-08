import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildSearchInputSnippet, type SearchInputSnippetState } from './demo-snippet'

function state(overrides: Partial<SearchInputSnippetState> = {}): SearchInputSnippetState {
  return {
    ariaLabel: '',
    query: '',
    placeholder: '',
    size: '',
    wrapperClass: '',
    inputClass: '',
    ...overrides,
  }
}

describe('buildSearchInputSnippet', () => {
  it('reads the scope label while unset and omits every other override', () => {
    const source = buildSearchInputSnippet(state())
    expect(source).toContain('ariaLabel={applyLabel}')
    expect(source).not.toContain('placeholder=')
    // `onResize={` also contains "size=", so match the attribute at line start.
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('wrapperClass=')
    expect(source).not.toContain('inputClass=')
  })

  it('emits a custom ariaLabel literal and text overrides while set', () => {
    const source = buildSearchInputSnippet(
      state({ ariaLabel: 'Site search', placeholder: 'Search...', size: 'lg', wrapperClass: 'w-64', inputClass: 'italic' }),
    )
    expect(source).toContain('ariaLabel="Site search"')
    expect(source).toContain('placeholder="Search..."')
    expect(source).toContain('size="lg"')
    expect(source).toContain('wrapperClass="w-64"')
    expect(source).toContain('inputClass="italic"')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildSearchInputSnippet(state({ size: '14' }))).toContain('size={14}')
    expect(buildSearchInputSnippet(state({ size: 'huge' }))).not.toMatch(/^\s*size=/m)
  })

  it('seeds the bound query as script-local state', () => {
    const source = buildSearchInputSnippet(state({ query: 'he"llo' }))
    expect(source).toContain('let query = $state("he\\"llo")')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildSearchInputSnippet(state()), {
      applyLabel: 'Search',
      handleKeydown: () => {},
    })
    expect(typeof component).toBe('function')
  })
})
