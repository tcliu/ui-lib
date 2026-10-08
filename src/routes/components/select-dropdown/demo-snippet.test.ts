import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildSelectDropdownSnippet, type SelectDropdownSnippetState } from './demo-snippet'

function state(overrides: Partial<SelectDropdownSnippetState> = {}): SelectDropdownSnippetState {
  return {
    ariaLabel: 'default',
    buttonLabel: '',
    value: 'two',
    size: '',
    filterable: '',
    allowCustomValue: '',
    buttonClass: '',
    controlClass: '',
    optionClass: '',
    emptyLabel: '',
    clearable: '',
    clearLabel: '',
    align: '',
    autoPlace: '',
    panelClass: '',
    ...overrides,
  }
}

describe('buildSelectDropdownSnippet', () => {
  it('wraps the demo in the shared resizable stage and omits unset overrides', () => {
    const source = buildSelectDropdownSnippet(state())
    expect(source).toContain('<Resizable')
    expect(source).toContain('width={stageWidth}')
    expect(source).not.toContain('stageHeight')
    expect(source).toContain('ariaLabel="default"')
    // `onResize={` also contains "size=", so match the attribute at line start.
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
        filterable: 'yes',
        allowCustomValue: 'yes',
        buttonClass: 'w-40',
        controlClass: 'w-40',
        optionClass: 'italic',
        emptyLabel: 'None',
        clearable: 'yes',
        clearLabel: 'Clear it',
        align: 'right',
        autoPlace: 'no',
        panelClass: 'shadow-lg',
      }),
    )
    expect(source).toContain('size="lg"')
    expect(source).toContain('        filterable\n')
    expect(source).toContain('        allowCustomValue\n')
    expect(source).toContain('buttonClass="w-40"')
    expect(source).toContain('controlClass="w-40"')
    expect(source).toContain('optionClass="italic"')
    expect(source).toContain('emptyLabel="None"')
    expect(source).toContain('        clearable\n')
    expect(source).toContain('clearLabel="Clear it"')
    expect(source).toContain('align="right"')
    expect(source).toContain('        autoPlace={false}')
    expect(source).toContain('panelClass="shadow-lg"')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildSelectDropdownSnippet(state({ size: '14' }))).toContain('size={14}')
    expect(buildSelectDropdownSnippet(state({ size: 'huge' }))).not.toMatch(/^\s*size=/m)
  })

  it('emits a custom buttonLabel literal and omits it while unset', () => {
    const unset = buildSelectDropdownSnippet(state())
    expect(unset).not.toContain('buttonLabel')
    const custom = buildSelectDropdownSnippet(state({ buttonLabel: 'Pick one' }))
    expect(custom).toContain('buttonLabel="Pick one"')
  })

  it('seeds the committed value as script-local state', () => {
    const source = buildSelectDropdownSnippet(state({ value: 'three' }))
    expect(source).toContain('let value = $state("three")')
    const quoted = buildSelectDropdownSnippet(state({ value: 'a"b' }))
    expect(quoted).toContain('let value = $state("a\\"b")')
  })

  it('compiles the generated stage snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildSelectDropdownSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
