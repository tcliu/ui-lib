import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildAutoCompleteSnippet, type AutoCompleteSnippetState } from './demo-snippet'

function state(overrides: Partial<AutoCompleteSnippetState> = {}): AutoCompleteSnippetState {
  return {
    ariaLabel: 'default',
    ariaLabelOn: true,
    value: 'Two',
    size: '',
    sizeOn: true,
    placeholder: '',
    placeholderOn: true,
    disabled: '',
    disabledOn: true,
    clearable: '',
    clearableOn: true,
    clearLabel: '',
    clearLabelOn: true,
    clearPlacement: '',
    clearPlacementOn: true,
    defaultValue: '',
    defaultValueOn: true,
    align: '',
    alignOn: true,
    autoPlace: '',
    autoPlaceOn: true,
    panelClass: '',
    panelClassOn: true,
    ...overrides,
  }
}

const SCOPE = { options: ['One', 'Two', 'Three'] }

describe('buildAutoCompleteSnippet', () => {
  it('emits content-only markup and omits unset overrides', () => {
    const source = buildAutoCompleteSnippet(state())
    // The resize harness is ShowcasePage-owned chrome, never in the snippet.
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
        size: 'lg',
        sizeOn: true,
        placeholder: 'Pick a country',
        disabled: 'yes',
        align: 'right',
        alignOn: true,
        autoPlace: 'no',
        panelClass: 'shadow-lg',
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
      state({ clearable: 'yes', clearLabel: 'Clear choice', clearPlacement: 'outside', clearPlacementOn: true, defaultValue: 'Two', defaultValueOn: true }),
    )
    expect(source).toContain('  clearable\n')
    expect(source).toContain('clearLabel="Clear choice"')
    expect(source).toContain('clearPlacement="outside"')
    expect(source).toContain('defaultValue="Two"')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildAutoCompleteSnippet(state({ size: '14', sizeOn: true }))).toContain('size={14}')
    expect(buildAutoCompleteSnippet(state({ size: 'huge' }))).not.toMatch(/^\s*size=/m)
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildAutoCompleteSnippet(
      state({
        size: 'md',
        sizeOn: true,
        disabled: 'no',
        align: 'left',
        alignOn: true,
        autoPlace: 'yes',
        clearable: 'no',
        clearPlacement: 'auto',
        clearPlacementOn: true,
      }),
    )
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('align=')
    expect(source).not.toContain('autoPlace')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearPlacement=')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildAutoCompleteSnippet(
      state({ size: 'lg', sizeOn: false, align: 'right', alignOn: false, clearPlacement: 'outside', clearPlacementOn: false }),
    )
    expect(off).not.toMatch(/^\s*size=/m)
    expect(off).not.toContain('align=')
    expect(off).not.toContain('clearPlacement=')
  })

  it('omits staged flag props while their eyes are off', () => {
    const off = buildAutoCompleteSnippet(
      state({ disabled: 'yes', disabledOn: false, clearable: 'yes', clearableOn: false, autoPlace: 'no', autoPlaceOn: false }),
    )
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('clearable')
    expect(off).not.toContain('autoPlace')
  })

  it('seeds the bound value as script-local state', () => {
    const source = buildAutoCompleteSnippet(state({ value: 'Three' }))
    expect(source).toContain('let value = $state("Three")')
    const quoted = buildAutoCompleteSnippet(state({ value: 'a"b' }))
    expect(quoted).toContain('let value = $state("a\\"b")')
  })

  it('omits staged text overrides while their eye is off and emits them while on', () => {
    const off = buildAutoCompleteSnippet(
      state({ ariaLabel: 'Search', ariaLabelOn: false, placeholder: 'Pick one', placeholderOn: false, clearLabel: 'Clear', clearLabelOn: false, panelClass: 'shadow-lg', panelClassOn: false, defaultValue: 'Two', defaultValueOn: false }),
    )
    expect(off).not.toContain('ariaLabel=')
    expect(off).not.toContain('placeholder=')
    expect(off).not.toContain('clearLabel=')
    expect(off).not.toContain('panelClass=')
    expect(off).not.toContain('defaultValue=')
    const on = buildAutoCompleteSnippet(
      state({ placeholder: 'Pick one', clearLabel: 'Clear', panelClass: 'shadow-lg', defaultValue: 'Two', defaultValueOn: true }),
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
