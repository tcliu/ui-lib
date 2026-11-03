import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '#showcase/playground/snippet-playground.js'
import { staged } from '#showcase/playground/staged.js'
import { buildNumberInputSnippet, type NumberInputSnippetState } from './demo-snippet'

function state(overrides: Partial<NumberInputSnippetState> = {}): NumberInputSnippetState {
  return {
    value: staged('5'),
    ariaLabel: staged('', true),
    caretAtEnd: staged('', true),
    min: staged('', true),
    max: staged('', true),
    step: staged('', true),
    placeholder: staged('', true),
    size: staged('', true),
    ratios: staged({}),
    variant: staged('', true),
    disabled: staged('', true),
    hideOutline: staged('', true),
    showControls: staged('', true),
    clearable: staged('', true),
    clearLabel: staged('', true),
    clearPlacement: staged('', true),
    defaultValue: staged('', true),
    decrementLabel: staged('', true),
    incrementLabel: staged('', true),
    id: staged('', true),
    inputStyle: staged('', true),
    className: staged('', true),
    ...overrides,
  }
}

describe('buildNumberInputSnippet', () => {
  it('omits numeric bounds and flags while unset', () => {
    const source = buildNumberInputSnippet(state())
    expect(source).toContain('let value = $state("5")')
    expect(source).toContain('<NumberInput bind:value={value} ariaLabel={applyLabel}')
    expect(source).not.toContain('min=')
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toMatch(/^\s*ratios=/m)
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('showControls=')
    expect(source).not.toContain('decrementLabel=')
    expect(source).not.toContain('incrementLabel=')
    expect(source).not.toContain('id=')
    expect(source).not.toContain('inputStyle=')
    expect(source).not.toContain('className=')
  })

  it('emits a partial ratios override while its eye is on', () => {
    expect(buildNumberInputSnippet(state())).not.toContain('ratios=')
    expect(buildNumberInputSnippet(state({ ratios: staged({ padX: 0.75 }, true) }))).toContain(
      'ratios={{"padX":0.75}}',
    )
  })

  it('emits bounds, placeholder, disabled, and the stepless treatment', () => {
    const source = buildNumberInputSnippet(
      state({
        ariaLabel: staged('Quantity', true),
        min: staged('0', true),
        max: staged('10', true),
        step: staged('0.5', true),
        placeholder: staged('0', true),
        disabled: staged('yes', true),
        showControls: staged('no', true),
        hideOutline: staged('yes', true),
        decrementLabel: staged('Down', true),
        incrementLabel: staged('Up', true),
        id: staged('qty', true),
        inputStyle: staged('width:6rem', true),
        className: staged('w-24', true),
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
    expect(source).toContain('  hideOutline\n')
    expect(source).toContain('className="w-24"')
  })

  it('omits clearable lines while unset and emits them while set', () => {
    expect(buildNumberInputSnippet(state())).not.toContain('clearable')
    expect(buildNumberInputSnippet(state())).not.toContain('defaultValue=')
    const source = buildNumberInputSnippet(
      state({ clearable: staged('yes', true), clearLabel: staged('Clear quantity', true), clearPlacement: staged('outside', true), defaultValue: staged('5', true) }),
    )
    expect(source).toContain('  clearable\n')
    expect(source).toContain('clearLabel="Clear quantity"')
    expect(source).toContain('clearPlacement="outside"')
    expect(source).toContain('defaultValue="5"')
  })

  it('omits eye-gated booleans while their toggles are off', () => {
    const off = buildNumberInputSnippet(
      state({ disabled: staged('yes'), showControls: staged('no'), clearable: staged('yes') }),
    )
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('showControls')
    expect(off).not.toContain('clearable')
  })

  it('omits eye-gated numbers while their toggles are off', () => {
    const off = buildNumberInputSnippet(
      state({ min: staged('0'), max: staged('10'), step: staged('0.5') }),
    )
    expect(off).not.toContain('min=')
    expect(off).not.toContain('max=')
    expect(off).not.toContain('step=')
  })

  it('omits the eye-gated ariaLabel while its toggle is off', () => {
    const off = buildNumberInputSnippet(state({ ariaLabel: staged('Quantity') }))
    expect(off).toContain('ariaLabel={applyLabel}')
    expect(off).not.toContain('ariaLabel="Quantity"')
  })

  it('omits eye-gated overrides while their toggle is off and emits them while on', () => {
    const off = buildNumberInputSnippet(state({ decrementLabel: staged('Down') }))
    expect(off).not.toContain('decrementLabel=')
    const on = buildNumberInputSnippet(state({ decrementLabel: staged('Down', true) }))
    expect(on).toContain('decrementLabel="Down"')
    const defaultOff = buildNumberInputSnippet(state({ defaultValue: staged('5') }))
    expect(defaultOff).not.toContain('defaultValue=')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildNumberInputSnippet(
      state({ size: staged('lg'), clearPlacement: staged('outside') }),
    )
    expect(off).not.toContain('size=')
    expect(off).not.toContain('clearPlacement=')
  })

  it('emits a named and a numeric size, and omits invalid sizes', () => {
    expect(buildNumberInputSnippet(state({ size: staged('lg', true) }))).toContain('size="lg"')
    expect(buildNumberInputSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    expect(buildNumberInputSnippet(state({ size: staged('huge', true) }))).not.toContain('size=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildNumberInputSnippet(
      state({ step: staged('1', true), size: staged('md', true), disabled: staged('no', true), showControls: staged('yes', true), hideOutline: staged('no', true), variant: staged('bordered', true), clearable: staged('no', true), clearPlacement: staged('auto', true) }),
    )
    expect(source).not.toContain('step=')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('showControls')
    expect(source).not.toContain('hideOutline')
    expect(source).not.toContain('variant=')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearPlacement=')
  })

  it('ignores non-numeric bounds', () => {
    const source = buildNumberInputSnippet(state({ min: staged('abc', true) }))
    expect(source).not.toContain('min=')
  })

  it('emits caretAtEnd only while it is set and differing from the default', () => {
    expect(buildNumberInputSnippet(state())).not.toContain('caretAtEnd')
    expect(buildNumberInputSnippet(state({ caretAtEnd: staged('yes', true) }))).toContain('  caretAtEnd\n')
    expect(buildNumberInputSnippet(state({ caretAtEnd: staged('no', true) }))).not.toContain('caretAtEnd')
    expect(buildNumberInputSnippet(state({ caretAtEnd: staged('yes') }))).not.toContain(
      'caretAtEnd',
    )
  })

  it('emits hideOutline and a non-default variant only while set', () => {
    expect(buildNumberInputSnippet(state())).not.toContain('hideOutline')
    expect(buildNumberInputSnippet(state({ hideOutline: staged('yes', true) }))).toContain('  hideOutline\n')
    expect(buildNumberInputSnippet(state({ hideOutline: staged('no', true) }))).not.toContain('hideOutline')
    expect(buildNumberInputSnippet(state({ hideOutline: staged('yes') }))).not.toContain(
      'hideOutline',
    )
    expect(buildNumberInputSnippet(state())).not.toContain('variant=')
    expect(buildNumberInputSnippet(state({ variant: staged('embedded', true) }))).toContain('variant="embedded"')
    expect(buildNumberInputSnippet(state({ variant: staged('bordered', true) }))).not.toContain('variant=')
    expect(buildNumberInputSnippet(state({ variant: staged('embedded') }))).not.toContain(
      'variant=',
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
