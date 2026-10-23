import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { STEPLESS_CLASS, buildNumberInputSnippet, type NumberInputSnippetState } from './demo-snippet'

function state(overrides: Partial<NumberInputSnippetState> = {}): NumberInputSnippetState {
  return {
    value: '5',
    ariaLabel: '',
    ariaLabelOn: true,
    caretAtEnd: '',
    caretAtEndOn: true,
    min: '',
    minOn: true,
    max: '',
    maxOn: true,
    step: '',
    stepOn: true,
    placeholder: '',
    placeholderOn: true,
    size: '',
    sizeOn: true,
    disabled: '',
    disabledOn: true,
    showControls: '',
    showControlsOn: true,
    clearable: '',
    clearableOn: true,
    clearLabel: '',
    clearLabelOn: true,
    clearPlacement: '',
    clearPlacementOn: true,
    defaultValue: '',
    defaultValueOn: true,
    decrementLabel: '',
    decrementLabelOn: true,
    incrementLabel: '',
    incrementLabelOn: true,
    id: '',
    idOn: true,
    inputStyle: '',
    inputStyleOn: true,
    className: '',
    classNameOn: true,
    ...overrides,
  }
}

describe('buildNumberInputSnippet', () => {
  it('omits numeric bounds and flags while unset', () => {
    const source = buildNumberInputSnippet(state())
    expect(source).toContain('let value = $state("5")')
    expect(source).toContain('<NumberInput bind:value={value} ariaLabel={applyLabel}')
    expect(source).not.toContain('min=')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('showControls=')
    expect(source).not.toContain('decrementLabel=')
    expect(source).not.toContain('incrementLabel=')
    expect(source).not.toContain('id=')
    expect(source).not.toContain('inputStyle=')
    expect(source).not.toContain('className=')
  })

  it('emits bounds, placeholder, disabled, and the stepless treatment', () => {
    const source = buildNumberInputSnippet(
      state({
        ariaLabel: 'Quantity',
        min: '0',
        max: '10',
        step: '0.5',
        placeholder: '0',
        disabled: 'yes',
        showControls: 'no',
        decrementLabel: 'Down',
        incrementLabel: 'Up',
        id: 'qty',
        inputStyle: 'width:6rem',
        className: STEPLESS_CLASS,
      }),
    )
    expect(source).toContain('ariaLabel="Quantity"')
    expect(source).toContain('min={0}')
    expect(source).toContain('max={10}')
    expect(source).toContain('step={0.5}')
    expect(source).toContain('decrementLabel="Down"')
    expect(source).toContain('incrementLabel="Up"')
    expect(source).toContain('id="qty"')
    expect(source).toContain('inputStyle="width:6rem"')
    expect(source).toContain('placeholder="0"')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('showControls={false}')
    expect(source).toContain('className="w-24 px-3 py-2 text-sm"')
  })

  it('omits clearable lines while unset and emits them while set', () => {
    expect(buildNumberInputSnippet(state())).not.toContain('clearable')
    expect(buildNumberInputSnippet(state())).not.toContain('defaultValue=')
    const source = buildNumberInputSnippet(
      state({ clearable: 'yes', clearLabel: 'Clear quantity', clearPlacement: 'outside', defaultValue: '5', defaultValueOn: true }),
    )
    expect(source).toContain('  clearable\n')
    expect(source).toContain('clearLabel="Clear quantity"')
    expect(source).toContain('clearPlacement="outside"')
    expect(source).toContain('defaultValue="5"')
  })

  it('omits eye-gated booleans while their toggles are off', () => {
    const off = buildNumberInputSnippet(
      state({ disabled: 'yes', disabledOn: false, showControls: 'no', showControlsOn: false, clearable: 'yes', clearableOn: false }),
    )
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('showControls')
    expect(off).not.toContain('clearable')
  })

  it('omits eye-gated numbers while their toggles are off', () => {
    const off = buildNumberInputSnippet(
      state({ min: '0', minOn: false, max: '10', maxOn: false, step: '0.5', stepOn: false }),
    )
    expect(off).not.toContain('min=')
    expect(off).not.toContain('max=')
    expect(off).not.toContain('step=')
  })

  it('omits the eye-gated ariaLabel while its toggle is off', () => {
    const off = buildNumberInputSnippet(state({ ariaLabel: 'Quantity', ariaLabelOn: false }))
    expect(off).toContain('ariaLabel={applyLabel}')
    expect(off).not.toContain('ariaLabel="Quantity"')
  })

  it('omits eye-gated overrides while their toggle is off and emits them while on', () => {
    const off = buildNumberInputSnippet(state({ decrementLabel: 'Down', decrementLabelOn: false }))
    expect(off).not.toContain('decrementLabel=')
    const on = buildNumberInputSnippet(state({ decrementLabel: 'Down', decrementLabelOn: true }))
    expect(on).toContain('decrementLabel="Down"')
    const defaultOff = buildNumberInputSnippet(state({ defaultValue: '5', defaultValueOn: false }))
    expect(defaultOff).not.toContain('defaultValue=')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildNumberInputSnippet(
      state({ size: 'lg', sizeOn: false, clearPlacement: 'outside', clearPlacementOn: false }),
    )
    expect(off).not.toContain('size=')
    expect(off).not.toContain('clearPlacement=')
  })

  it('emits a named and a numeric size, and omits invalid sizes', () => {
    expect(buildNumberInputSnippet(state({ size: 'lg' }))).toContain('size="lg"')
    expect(buildNumberInputSnippet(state({ size: '14' }))).toContain('size={14}')
    expect(buildNumberInputSnippet(state({ size: 'huge' }))).not.toContain('size=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildNumberInputSnippet(
      state({ step: '1', size: 'md', disabled: 'no', showControls: 'yes', clearable: 'no', clearPlacement: 'auto' }),
    )
    expect(source).not.toContain('step=')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('showControls')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearPlacement=')
  })

  it('ignores non-numeric bounds', () => {
    const source = buildNumberInputSnippet(state({ min: 'abc' }))
    expect(source).not.toContain('min=')
  })

  it('emits caretAtEnd only while it is set and differing from the default', () => {
    expect(buildNumberInputSnippet(state())).not.toContain('caretAtEnd')
    expect(buildNumberInputSnippet(state({ caretAtEnd: 'yes' }))).toContain('  caretAtEnd\n')
    expect(buildNumberInputSnippet(state({ caretAtEnd: 'no' }))).not.toContain('caretAtEnd')
    expect(buildNumberInputSnippet(state({ caretAtEnd: 'yes', caretAtEndOn: false }))).not.toContain(
      'caretAtEnd',
    )
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const source = buildNumberInputSnippet(state())
    const component = await createSnippetComponent(source, { applyLabel: 'Quantity' })
    expect(typeof component).toBe('function')
  })

  it('omits the size line when the key is absent', () => {
    const source = buildNumberInputSnippet({ ...state(), size: undefined })
    expect(source).not.toContain('size=')
  })
})
