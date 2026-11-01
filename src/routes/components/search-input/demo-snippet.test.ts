import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$showcase/playground/snippet-playground'
import { staged } from '$showcase/playground/staged'
import { buildSearchInputSnippet, type SearchInputSnippetState } from './demo-snippet'

function state(overrides: Partial<SearchInputSnippetState> = {}): SearchInputSnippetState {
  return {
    ariaLabel: staged('', true),
    query: staged(''),
    placeholder: staged('', true),
    size: staged('', true),
    wrapperClass: staged('', true),
    inputClass: staged('', true),
    clearable: staged('', true),
    clearLabel: staged('', true),
    clearPlacement: staged('', true),
    defaultValue: staged('', true),
    hideOutline: staged('', true),
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
    expect(source).not.toContain('hideOutline')
  })

  it('emits a custom ariaLabel literal and text overrides while set', () => {
    const source = buildSearchInputSnippet(
      state({ ariaLabel: staged('Site search', true), placeholder: staged('Search...', true), size: staged('lg', true), wrapperClass: staged('w-64', true), inputClass: staged('italic', true) }),
    )
    expect(source).toContain('ariaLabel="Site search"')
    expect(source).toContain('placeholder="Search..."')
    expect(source).toContain('size="lg"')
    expect(source).toContain('wrapperClass="w-64"')
    expect(source).toContain('inputClass="italic"')
  })

  it('omits clearable lines while unset and emits them while set', () => {
    expect(buildSearchInputSnippet(state())).not.toContain('clearable')
    expect(buildSearchInputSnippet(state())).not.toContain('defaultValue=')
    const source = buildSearchInputSnippet(
      state({ clearable: staged('yes', true), clearLabel: staged('Clear search', true), clearPlacement: staged('outside', true), defaultValue: staged('hello', true) }),
    )
    expect(source).toContain('    clearable\n')
    expect(source).toContain('clearLabel="Clear search"')
    expect(source).toContain('clearPlacement="outside"')
    expect(source).toContain('defaultValue="hello"')
  })

  it('omits staged text overrides while their eye is off and emits them while on', () => {
    const off = buildSearchInputSnippet(
      state({ placeholder: staged('Search...'), wrapperClass: staged('w-64'), inputClass: staged('italic'), clearLabel: staged('Clear search'), defaultValue: staged('hello') }),
    )
    expect(off).not.toContain('placeholder=')
    expect(off).not.toContain('wrapperClass=')
    expect(off).not.toContain('inputClass=')
    expect(off).not.toContain('clearLabel=')
    expect(off).not.toContain('defaultValue=')
    const on = buildSearchInputSnippet(
      state({ placeholder: staged('Search...', true), wrapperClass: staged('w-64', true), inputClass: staged('italic', true), clearLabel: staged('Clear search', true), defaultValue: staged('hello', true) }),
    )
    expect(on).toContain('placeholder="Search..."')
    expect(on).toContain('wrapperClass="w-64"')
    expect(on).toContain('inputClass="italic"')
    expect(on).toContain('clearLabel="Clear search"')
    expect(on).toContain('defaultValue="hello"')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildSearchInputSnippet(
      state({ size: staged('lg'), clearPlacement: staged('outside') }),
    )
    expect(off).not.toMatch(/^\s*size=/m)
    expect(off).not.toContain('clearPlacement=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildSearchInputSnippet(state({ size: staged('md', true), clearable: staged('no', true), clearPlacement: staged('auto', true) }))
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearPlacement=')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildSearchInputSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    expect(buildSearchInputSnippet(state({ size: staged('huge', true) }))).not.toMatch(/^\s*size=/m)
  })

  it('omits eye-gated booleans and text while their toggles are off', () => {
    const off = buildSearchInputSnippet(
      state({ ariaLabel: staged('Site search'), clearable: staged('yes') }),
    )
    expect(off).toContain('ariaLabel={applyLabel}')
    expect(off).not.toContain('ariaLabel="Site search"')
    expect(off).not.toContain('clearable')
  })

  it('emits hideOutline only while set', () => {
    expect(buildSearchInputSnippet(state({ hideOutline: staged('yes', true) }))).toContain('    hideOutline\n')
    expect(buildSearchInputSnippet(state({ hideOutline: staged('no', true) }))).not.toContain('hideOutline')
    expect(buildSearchInputSnippet(state({ hideOutline: staged('yes') }))).not.toContain(
      'hideOutline',
    )
  })

  it('seeds the bound query as script-local state', () => {
    const source = buildSearchInputSnippet(state({ query: staged('he"llo') }))
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
