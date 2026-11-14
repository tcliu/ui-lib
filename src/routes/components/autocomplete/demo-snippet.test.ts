import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '#showcase/playground/snippet-playground.js'
import { staged } from '#showcase/playground/staged.js'
import { buildAutoCompleteSnippet, type AutoCompleteSnippetState } from './demo-snippet'

function state(overrides: Partial<AutoCompleteSnippetState> = {}): AutoCompleteSnippetState {
  return {
    ariaLabel: staged('default', true),
    value: staged('Two'),
    size: staged('', true),
    ratios: staged({}),
    placeholder: staged('', true),
    disabled: staged('', true),
    variant: staged('bordered'),
    hideOutline: staged(''),
    clearable: staged('', true),
    clearLabel: staged('', true),
    clearPlacement: staged('', true),
    defaultValue: staged('', true),
    align: staged('', true),
    autoPlace: staged('', true),
    panelClass: staged('', true),
    ...overrides,
  }
}

const SCOPE = { options: ['One', 'Two', 'Three'] }

describe('buildAutoCompleteSnippet', () => {
  it('emits content-only markup and omits unset overrides', () => {
    const source = buildAutoCompleteSnippet(state())
    // The resize harness is ShowcasePage-owned chrome, never in the snippet.
    expect(source).not.toContain('ratios=')
    expect(source).not.toContain('<Resizable')
    expect(source).not.toContain('stageWidth')
    expect(source).toContain('ariaLabel="default"')
    expect(source).toContain('bind:value')
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('placeholder=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('align=')
    expect(source).not.toContain('autoPlace')
    expect(source).not.toContain('panelClass=')
  })

  it('emits size, flags, and text overrides while set', () => {
    const source = buildAutoCompleteSnippet(
      state({
        size: staged('lg', true),
        placeholder: staged('Pick a country', true),
        disabled: staged('yes', true),
        align: staged('right', true),
        autoPlace: staged('no', true),
        panelClass: staged('shadow-lg', true),
      }),
    )
    expect(source).toContain('size="lg"')
    expect(source).toContain('placeholder="Pick a country"')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('align="right"')
    expect(source).toContain('  autoPlace={false}')
    expect(source).toContain('panelClass="shadow-lg"')
  })

  it('omits clearable lines while unset and emits them while set', () => {
    expect(buildAutoCompleteSnippet(state())).not.toContain('clearable')
    expect(buildAutoCompleteSnippet(state())).not.toContain('defaultValue=')
    const source = buildAutoCompleteSnippet(
      state({ clearable: staged('yes', true), clearLabel: staged('Clear choice', true), clearPlacement: staged('outside', true), defaultValue: staged('Two', true) }),
    )
    expect(source).toContain('  clearable\n')
    expect(source).toContain('clearLabel="Clear choice"')
    expect(source).toContain('clearPlacement="outside"')
    expect(source).toContain('defaultValue="Two"')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildAutoCompleteSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    expect(buildAutoCompleteSnippet(state({ size: staged('huge', true) }))).not.toMatch(/^\s*size=/m)
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildAutoCompleteSnippet(
      state({
        size: staged('md', true),
        disabled: staged('no', true),
        variant: staged('bordered', true),
        hideOutline: staged('no', true),
        align: staged('left', true),
        autoPlace: staged('yes', true),
        clearable: staged('no', true),
        clearPlacement: staged('auto', true),
      }),
    )
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('variant=')
    expect(source).not.toContain('hideOutline')
    expect(source).not.toContain('align=')
    expect(source).not.toContain('autoPlace')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearPlacement=')
  })

  it('emits a non-default variant and an applied hideOutline, and omits them otherwise', () => {
    const embedded = buildAutoCompleteSnippet(
      state({ variant: staged('embedded', true), hideOutline: staged('yes', true) }),
    )
    expect(embedded).toContain('variant="embedded"')
    expect(embedded).toContain('  hideOutline\n')

    // The defaults and an unset eye stay out.
    expect(
      buildAutoCompleteSnippet(state({ variant: staged('embedded'), hideOutline: staged('yes') })),
    ).not.toContain('variant=')
    expect(
      buildAutoCompleteSnippet(state({ variant: staged('embedded'), hideOutline: staged('yes') })),
    ).not.toContain('hideOutline')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildAutoCompleteSnippet(
      state({ size: staged('lg'), align: staged('right'), clearPlacement: staged('outside') }),
    )
    expect(off).not.toMatch(/^\s*size=/m)
    expect(off).not.toContain('align=')
    expect(off).not.toContain('clearPlacement=')
  })

  it('omits staged flag props while their eyes are off', () => {
    const off = buildAutoCompleteSnippet(
      state({ disabled: staged('yes'), clearable: staged('yes'), autoPlace: staged('no') }),
    )
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('clearable')
    expect(off).not.toContain('autoPlace')
  })

  it('seeds the bound value as script-local state', () => {
    const source = buildAutoCompleteSnippet(state({ value: staged('Three') }))
    expect(source).toContain('let value = $state("Three")')
    const quoted = buildAutoCompleteSnippet(state({ value: staged('a"b') }))
    expect(quoted).toContain('let value = $state("a\\"b")')
  })

  it('omits staged text overrides while their eye is off and emits them while on', () => {
    const off = buildAutoCompleteSnippet(
      state({ ariaLabel: staged('Search'), placeholder: staged('Pick one'), clearLabel: staged('Clear'), panelClass: staged('shadow-lg'), defaultValue: staged('Two') }),
    )
    expect(off).not.toContain('ariaLabel=')
    expect(off).not.toContain('placeholder=')
    expect(off).not.toContain('clearLabel=')
    expect(off).not.toContain('panelClass=')
    expect(off).not.toContain('defaultValue=')
    const on = buildAutoCompleteSnippet(
      state({ placeholder: staged('Pick one', true), clearLabel: staged('Clear', true), panelClass: staged('shadow-lg', true), defaultValue: staged('Two', true) }),
    )
    expect(on).toContain('ariaLabel="default"')
    expect(on).toContain('placeholder="Pick one"')
    expect(on).toContain('clearLabel="Clear"')
    expect(on).toContain('panelClass="shadow-lg"')
    expect(on).toContain('defaultValue="Two"')
  })

  it('compiles the generated stage snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildAutoCompleteSnippet(state()), SCOPE)
    expect(typeof component).toBe('function')
  })
})

describe('AutoComplete ratios snippet', () => {
  it('emits a partial override while its eye is on', () => {
    expect(buildAutoCompleteSnippet(state({ ratios: staged({ padX: 0.75 }, true) }))).toContain(
      'ratios={{"padX":0.75}}',
    )
  })
})
