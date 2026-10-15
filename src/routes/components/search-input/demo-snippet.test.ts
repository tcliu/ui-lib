import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildSearchInputSnippet, type SearchInputSnippetState } from './demo-snippet'

function state(overrides: Partial<SearchInputSnippetState> = {}): SearchInputSnippetState {
  return {
    ariaLabel: '',
    ariaLabelOn: true,
    query: '',
    placeholder: '',
    placeholderOn: true,
    size: '',
    sizeOn: true,
    wrapperClass: '',
    wrapperClassOn: true,
    inputClass: '',
    inputClassOn: true,
    clearable: '',
    clearableOn: true,
    clearLabel: '',
    clearLabelOn: true,
    clearPlacement: '',
    clearPlacementOn: true,
    defaultValue: '',
    defaultValueOn: true,
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
      state({ ariaLabel: 'Site search', placeholder: 'Search...', size: 'lg', sizeOn: true, wrapperClass: 'w-64', inputClass: 'italic' }),
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
      state({ clearable: 'yes', clearLabel: 'Clear search', clearPlacement: 'outside', clearPlacementOn: true, defaultValue: 'hello', defaultValueOn: true }),
    )
    expect(source).toContain('    clearable\n')
    expect(source).toContain('clearLabel="Clear search"')
    expect(source).toContain('clearPlacement="outside"')
    expect(source).toContain('defaultValue="hello"')
  })

  it('omits staged text overrides while their eye is off and emits them while on', () => {
    const off = buildSearchInputSnippet(
      state({ placeholder: 'Search...', placeholderOn: false, wrapperClass: 'w-64', wrapperClassOn: false, inputClass: 'italic', inputClassOn: false, clearLabel: 'Clear search', clearLabelOn: false, defaultValue: 'hello', defaultValueOn: false }),
    )
    expect(off).not.toContain('placeholder=')
    expect(off).not.toContain('wrapperClass=')
    expect(off).not.toContain('inputClass=')
    expect(off).not.toContain('clearLabel=')
    expect(off).not.toContain('defaultValue=')
    const on = buildSearchInputSnippet(
      state({ placeholder: 'Search...', wrapperClass: 'w-64', inputClass: 'italic', clearLabel: 'Clear search', defaultValue: 'hello', defaultValueOn: true }),
    )
    expect(on).toContain('placeholder="Search..."')
    expect(on).toContain('wrapperClass="w-64"')
    expect(on).toContain('inputClass="italic"')
    expect(on).toContain('clearLabel="Clear search"')
    expect(on).toContain('defaultValue="hello"')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildSearchInputSnippet(
      state({ size: 'lg', sizeOn: false, clearPlacement: 'outside', clearPlacementOn: false }),
    )
    expect(off).not.toMatch(/^\s*size=/m)
    expect(off).not.toContain('clearPlacement=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildSearchInputSnippet(state({ size: 'md', sizeOn: true, clearable: 'no', clearPlacement: 'auto', clearPlacementOn: true }))
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearPlacement=')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildSearchInputSnippet(state({ size: '14', sizeOn: true }))).toContain('size={14}')
    expect(buildSearchInputSnippet(state({ size: 'huge' }))).not.toMatch(/^\s*size=/m)
  })

  it('omits eye-gated booleans and text while their toggles are off', () => {
    const off = buildSearchInputSnippet(
      state({ ariaLabel: 'Site search', ariaLabelOn: false, clearable: 'yes', clearableOn: false }),
    )
    expect(off).toContain('ariaLabel={applyLabel}')
    expect(off).not.toContain('ariaLabel="Site search"')
    expect(off).not.toContain('clearable')
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
