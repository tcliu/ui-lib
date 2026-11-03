import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '#showcase/playground/snippet-playground.js'
import { staged } from '#showcase/playground/staged.js'
import { buildSelectDropdownSnippet, type SelectDropdownSnippetState } from './demo-snippet'

function state(overrides: Partial<SelectDropdownSnippetState> = {}): SelectDropdownSnippetState {
  return {
    ariaLabel: staged('default', true),
    buttonLabel: staged('', true),
    value: staged('two', true),
    defaultValue: staged('', true),
    size: staged('', true),
    ratios: staged({}),
    filterable: staged('', true),
    allowCustomValue: staged('', true),
    buttonClass: staged('', true),
    controlClass: staged('', true),
    optionClass: staged('', true),
    emptyLabel: staged('', true),
    clearable: staged('', true),
    clearLabel: staged('', true),
    align: staged('', true),
    autoPlace: staged('', true),
    panelClass: staged('', true),
    ...overrides,
  }
}

describe('buildSelectDropdownSnippet', () => {
  it('emits content-only markup and omits unset overrides', () => {
    const source = buildSelectDropdownSnippet(state())
    // The resize harness is ShowcasePage-owned chrome, never in the snippet.
    expect(source).not.toContain('<Resizable')
    expect(source).not.toContain('stageWidth')
    expect(source).toContain('ariaLabel="default"')
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toMatch(/^\s*ratios=/m)
    expect(source).not.toContain('filterable')
    expect(source).not.toContain('controlClass=')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('align=')
  })

  it('emits a partial ratios override while its eye is on', () => {
    expect(buildSelectDropdownSnippet(state())).not.toContain('ratios=')
    expect(
      buildSelectDropdownSnippet(state({ ratios: staged({ padX: 0.75 }, true) })),
    ).toContain('ratios={{"padX":0.75}}')
  })

  it('emits size, flags, text overrides, and align while set', () => {
    const source = buildSelectDropdownSnippet(
      state({
        size: staged('lg', true),
        filterable: staged('yes', true),
        allowCustomValue: staged('yes', true),
        buttonClass: staged('w-40', true),
        controlClass: staged('w-40', true),
        optionClass: staged('italic', true),
        emptyLabel: staged('None', true),
        clearable: staged('yes', true),
        clearLabel: staged('Clear it', true),
        align: staged('right', true),
        autoPlace: staged('no', true),
        panelClass: staged('shadow-lg', true),
      }),
    )
    expect(source).toContain('size="lg"')
    expect(source).toContain('  filterable\n')
    expect(source).toContain('  allowCustomValue\n')
    expect(source).toContain('buttonClass="w-40"')
    expect(source).toContain('controlClass="w-40"')
    expect(source).toContain('optionClass="italic"')
    expect(source).toContain('emptyLabel="None"')
    expect(source).toContain('  clearable\n')
    expect(source).toContain('clearLabel="Clear it"')
    expect(source).toContain('align="right"')
    expect(source).toContain('  autoPlace={false}')
    expect(source).toContain('panelClass="shadow-lg"')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildSelectDropdownSnippet(
      state({
        size: staged('md', true),
        filterable: staged('no', true),
        allowCustomValue: staged('no', true),
        clearable: staged('no', true),
        align: staged('left', true),
        autoPlace: staged('yes', true),
      }),
    )
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('filterable')
    expect(source).not.toContain('allowCustomValue')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('align=')
    expect(source).not.toContain('autoPlace')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildSelectDropdownSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    expect(buildSelectDropdownSnippet(state({ size: staged('huge', true) }))).not.toMatch(/^\s*size=/m)
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildSelectDropdownSnippet(state({ size: staged('lg'), align: staged('right') }))
    expect(off).not.toMatch(/^\s*size=/m)
    expect(off).not.toContain('align=')
  })

  it('emits a custom buttonLabel literal and omits it while unset', () => {
    const unset = buildSelectDropdownSnippet(state())
    expect(unset).not.toContain('buttonLabel')
    const custom = buildSelectDropdownSnippet(state({ buttonLabel: staged('Pick one', true) }))
    expect(custom).toContain('buttonLabel="Pick one"')
  })

  it('omits eye-gated overrides while their toggle is off and emits them while on', () => {
    const off = buildSelectDropdownSnippet(
      state({ ariaLabel: staged('Custom'), buttonClass: staged('w-40'), defaultValue: staged('two') }),
    )
    expect(off).not.toContain('ariaLabel=')
    expect(off).not.toContain('buttonClass=')
    expect(off).not.toContain('defaultValue=')
    const on = buildSelectDropdownSnippet(
      state({ ariaLabel: staged('Custom', true), buttonClass: staged('w-40', true), defaultValue: staged('two', true) }),
    )
    expect(on).toContain('ariaLabel="Custom"')
    expect(on).toContain('buttonClass="w-40"')
    expect(on).toContain('defaultValue="two"')
  })

  it('omits staged flags while their eyes are off', () => {
    const off = buildSelectDropdownSnippet(
      state({ filterable: staged('yes'), allowCustomValue: staged('yes'), clearable: staged('yes'), autoPlace: staged('no') }),
    )
    expect(off).not.toContain('filterable')
    expect(off).not.toContain('allowCustomValue')
    expect(off).not.toContain('clearable')
    expect(off).not.toContain('autoPlace')
  })

  it('omits the committed value while its eye is off', () => {
    const off = buildSelectDropdownSnippet(state({ value: staged('three') }))
    expect(off).not.toContain('activeValue=')
    expect(off).toContain('let value = $state("three")')
    const on = buildSelectDropdownSnippet(state({ value: staged('three', true) }))
    expect(on).toContain('activeValue={value}')
  })

  it('seeds the committed value as script-local state', () => {
    const source = buildSelectDropdownSnippet(state({ value: staged('three', true) }))
    expect(source).toContain('let value = $state("three")')
    const quoted = buildSelectDropdownSnippet(state({ value: staged('a"b', true) }))
    expect(quoted).toContain('let value = $state("a\\"b")')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildSelectDropdownSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
