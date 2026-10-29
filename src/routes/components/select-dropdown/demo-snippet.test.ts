import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$showcase/snippet-playground'
import { buildSelectDropdownSnippet, type SelectDropdownSnippetState } from './demo-snippet'

function state(overrides: Partial<SelectDropdownSnippetState> = {}): SelectDropdownSnippetState {
  return {
    ariaLabel: 'default',
    ariaLabelOn: true,
    buttonLabel: '',
    buttonLabelOn: true,
    value: 'two',
    valueOn: true,
    defaultValue: '',
    defaultValueOn: true,
    size: '',
    sizeOn: true,
    filterable: '',
    filterableOn: true,
    allowCustomValue: '',
    allowCustomValueOn: true,
    buttonClass: '',
    buttonClassOn: true,
    controlClass: '',
    controlClassOn: true,
    optionClass: '',
    optionClassOn: true,
    emptyLabel: '',
    emptyLabelOn: true,
    clearable: '',
    clearableOn: true,
    clearLabel: '',
    clearLabelOn: true,
    align: '',
    alignOn: true,
    autoPlace: '',
    autoPlaceOn: true,
    panelClass: '',
    panelClassOn: true,
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
    expect(source).not.toContain('filterable')
    expect(source).not.toContain('controlClass=')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('align=')
  })

  it('emits size, flags, text overrides, and align while set', () => {
    const source = buildSelectDropdownSnippet(
      state({
        size: 'lg',
        sizeOn: true,
        filterable: 'yes',
        allowCustomValue: 'yes',
        buttonClass: 'w-40',
        controlClass: 'w-40',
        optionClass: 'italic',
        emptyLabel: 'None',
        clearable: 'yes',
        clearLabel: 'Clear it',
        align: 'right',
        alignOn: true,
        autoPlace: 'no',
        panelClass: 'shadow-lg',
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
        size: 'md',
        sizeOn: true,
        filterable: 'no',
        allowCustomValue: 'no',
        clearable: 'no',
        align: 'left',
        alignOn: true,
        autoPlace: 'yes',
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
    expect(buildSelectDropdownSnippet(state({ size: '14', sizeOn: true }))).toContain('size={14}')
    expect(buildSelectDropdownSnippet(state({ size: 'huge' }))).not.toMatch(/^\s*size=/m)
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildSelectDropdownSnippet(
      state({ size: 'lg', sizeOn: false, align: 'right', alignOn: false }),
    )
    expect(off).not.toMatch(/^\s*size=/m)
    expect(off).not.toContain('align=')
  })

  it('emits a custom buttonLabel literal and omits it while unset', () => {
    const unset = buildSelectDropdownSnippet(state())
    expect(unset).not.toContain('buttonLabel')
    const custom = buildSelectDropdownSnippet(state({ buttonLabel: 'Pick one' }))
    expect(custom).toContain('buttonLabel="Pick one"')
  })

  it('omits eye-gated overrides while their toggle is off and emits them while on', () => {
    const off = buildSelectDropdownSnippet(
      state({ ariaLabel: 'Custom', ariaLabelOn: false, buttonClass: 'w-40', buttonClassOn: false, defaultValue: 'two', defaultValueOn: false }),
    )
    expect(off).not.toContain('ariaLabel=')
    expect(off).not.toContain('buttonClass=')
    expect(off).not.toContain('defaultValue=')
    const on = buildSelectDropdownSnippet(
      state({ ariaLabel: 'Custom', ariaLabelOn: true, buttonClass: 'w-40', buttonClassOn: true, defaultValue: 'two', defaultValueOn: true }),
    )
    expect(on).toContain('ariaLabel="Custom"')
    expect(on).toContain('buttonClass="w-40"')
    expect(on).toContain('defaultValue="two"')
  })

  it('omits staged flags while their eyes are off', () => {
    const off = buildSelectDropdownSnippet(
      state({ filterable: 'yes', filterableOn: false, allowCustomValue: 'yes', allowCustomValueOn: false, clearable: 'yes', clearableOn: false, autoPlace: 'no', autoPlaceOn: false }),
    )
    expect(off).not.toContain('filterable')
    expect(off).not.toContain('allowCustomValue')
    expect(off).not.toContain('clearable')
    expect(off).not.toContain('autoPlace')
  })

  it('omits the committed value while its eye is off', () => {
    const off = buildSelectDropdownSnippet(state({ value: 'three', valueOn: false }))
    expect(off).not.toContain('activeValue=')
    expect(off).toContain('let value = $state("three")')
    const on = buildSelectDropdownSnippet(state({ value: 'three', valueOn: true }))
    expect(on).toContain('activeValue={value}')
  })

  it('seeds the committed value as script-local state', () => {
    const source = buildSelectDropdownSnippet(state({ value: 'three' }))
    expect(source).toContain('let value = $state("three")')
    const quoted = buildSelectDropdownSnippet(state({ value: 'a"b' }))
    expect(quoted).toContain('let value = $state("a\\"b")')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildSelectDropdownSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
