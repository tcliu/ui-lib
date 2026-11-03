import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '#showcase/playground/snippet-playground.js'
import { staged } from '#showcase/playground/staged.js'
import { buildTextInputSnippet, type TextInputSnippetState } from './demo-snippet'

function state(overrides: Partial<TextInputSnippetState> = {}): TextInputSnippetState {
  return {
    ariaLabel: staged('', true),
    value: staged(''),
    placeholder: staged(''),
    size: staged(''),
    ratios: staged({}),
    disabled: staged('', true),
    hideOutline: staged('', true),
    readonly: staged('', true),
    required: staged('', true),
    id: staged(''),
    inputClass: staged(''),
    variant: staged('bordered'),
    className: staged('', true),
    clearable: staged('', true),
    clearLabel: staged(''),
    clearPlacement: staged(''),
    defaultValue: staged(''),
    autocomplete: staged(''),
    inputmode: staged(''),
    name: staged(''),
    type: staged(''),
    inputStyle: staged(''),
    wrapperStyle: staged(''),
    leading: staged(''),
    trailing: staged(''),
    trailer: staged(''),
    ...overrides,
  }
}

describe('buildTextInputSnippet', () => {
  it('reads the scope label while unset and omits every other override', () => {
    const source = buildTextInputSnippet(state())
    expect(source).toContain('let value = $state("")')
    expect(source).toContain('ariaLabel={applyLabel}')
    expect(source).not.toContain('placeholder=')
    // `size={` only appears when a size is set.
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toMatch(/^\s*ratios=/m)
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('hideOutline')
    expect(source).not.toContain('readonly')
    expect(source).not.toContain('required')
    expect(source).not.toContain('id=')
    expect(source).not.toContain('inputClass=')
    expect(source).not.toContain('className=')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearLabel')
    expect(source).not.toContain('clearPlacement')
    expect(source).not.toContain('defaultValue=')
    expect(source).not.toContain('autocomplete=')
    expect(source).not.toContain('inputmode=')
    expect(source).not.toContain('name=')
    expect(source).not.toContain('type=')
    expect(source).not.toContain('inputStyle=')
    expect(source).not.toContain('wrapperStyle=')
    expect(source).not.toContain('trailer')
  })

  it('emits a custom ariaLabel literal and text overrides while set', () => {
    const source = buildTextInputSnippet(
      state({
        ariaLabel: staged('Full name', true),
        placeholder: staged('Jane', true),
        size: staged('lg', true),
        disabled: staged('yes', true),
        hideOutline: staged('yes', true),
        readonly: staged('yes', true),
        required: staged('yes', true),
        inputClass: staged('italic', true),
        className: staged('pr-12', true),
        clearable: staged('yes', true),
        clearLabel: staged('Clear field', true),
        clearPlacement: staged('outside', true),
        defaultValue: staged('John', true),
        autocomplete: staged('email', true),
        inputmode: staged('numeric', true),
        name: staged('fullName', true),
        type: staged('email', true),
        inputStyle: staged('width: 12rem', true),
        wrapperStyle: staged('--input-pad-x: 0.5rem', true),
        trailer: staged('Edit', true),
      }),
    )
    expect(source).toContain('ariaLabel="Full name"')
    expect(source).toContain('placeholder="Jane"')
    expect(source).toContain('size="lg"')
    expect(source).toContain('    disabled\n')
    expect(source).toContain('    hideOutline\n')
    expect(source).toContain('    readonly\n')
    expect(source).toContain('    required\n')
    expect(source).toContain('inputClass="italic"')
    expect(source).toContain('className="pr-12"')
    expect(source).toContain('    clearable\n')
    expect(source).toContain('clearLabel="Clear field"')
    expect(source).toContain('clearPlacement="outside"')
    expect(source).toContain('defaultValue="John"')
    expect(source).toContain('autocomplete="email"')
    expect(source).toContain('inputmode="numeric"')
    expect(source).toContain('name="fullName"')
    expect(source).toContain('type="email"')
    expect(source).toContain('inputStyle="width: 12rem"')
    expect(source).toContain('wrapperStyle="--input-pad-x: 0.5rem"')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildTextInputSnippet(
      state({
        size: staged('md', true),
        disabled: staged('no', true),
        readonly: staged('no', true),
        required: staged('no', true),
        clearable: staged('no', true),
        clearPlacement: staged('auto', true),
        variant: staged('bordered', true),
      }),
    )
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('hideOutline')
    expect(source).not.toContain('readonly')
    expect(source).not.toContain('required')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearPlacement')
    expect(source).not.toContain('variant=')
  })

  it('emits the embedded variant while it is set', () => {
    const off = buildTextInputSnippet(state({ variant: staged('embedded') }))
    expect(off).not.toContain('variant=')
    const on = buildTextInputSnippet(state({ variant: staged('embedded', true) }))
    expect(on).toContain('variant="embedded"')
  })

  it('compiles the generated snippet with the embedded variant', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(
      buildTextInputSnippet(state({ variant: staged('embedded', true) })),
      { applyLabel: 'Name' },
    )
    expect(typeof component).toBe('function')
  })

  it('omits staged text props while the eye is off and emits them while on', () => {
    const off = buildTextInputSnippet(state({ placeholder: staged('Jane'), id: staged('name'), defaultValue: staged('John') }))
    expect(off).not.toContain('placeholder=')
    expect(off).not.toContain('id=')
    expect(off).not.toContain('defaultValue=')
    const on = buildTextInputSnippet(
      state({
        placeholder: staged('Jane', true),
        id: staged('name', true),
        defaultValue: staged('John', true),
      }),
    )
    expect(on).toContain('placeholder="Jane"')
    expect(on).toContain('id="name"')
    expect(on).toContain('defaultValue="John"')
  })

  it('omits staged dropdown props while the eye is off and emits them while on', () => {
    const off = buildTextInputSnippet(state({ size: staged('lg'), clearPlacement: staged('outside') }))
    expect(off).not.toMatch(/^\s*size=/m)
    expect(off).not.toContain('clearPlacement=')
    const on = buildTextInputSnippet(
      state({ size: staged('lg', true), clearPlacement: staged('outside', true) }),
    )
    expect(on).toContain('size="lg"')
    expect(on).toContain('clearPlacement="outside"')
  })

  it('omits staged boolean and label props while the eye is off and emits them while on', () => {
    const off = buildTextInputSnippet(
      state({ ariaLabel: staged('Full name'), disabled: staged('yes'), readonly: staged('yes'), required: staged('yes'), className: staged('pr-12'), clearable: staged('yes') }),
    )
    expect(off).toContain('ariaLabel={applyLabel}')
    expect(off).not.toContain('ariaLabel="Full name"')
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('readonly')
    expect(off).not.toContain('required')
    expect(off).not.toContain('className=')
    expect(off).not.toContain('clearable')
    const on = buildTextInputSnippet(
      state({ ariaLabel: staged('Full name', true), disabled: staged('yes', true), readonly: staged('yes', true), required: staged('yes', true), className: staged('pr-12', true), clearable: staged('yes', true) }),
    )
    expect(on).toContain('ariaLabel="Full name"')
    expect(on).toContain('    disabled\n')
    expect(on).toContain('    readonly\n')
    expect(on).toContain('    required\n')
    expect(on).toContain('className="pr-12"')
    expect(on).toContain('    clearable\n')
  })

  it('emits adornment snippets with gutters while set', () => {
    const source = buildTextInputSnippet(state({ leading: staged('$', true), trailing: staged('USD', true) }))
    expect(source).toContain('{#snippet leading()}')
    expect(source).toContain('{#snippet trailing()}')
    expect(source).toContain('className="pl-8 pr-8"')
    expect(source).toContain('</TextInput>')
  })

  it('omits adornment snippets while unset', () => {
    const source = buildTextInputSnippet(state())
    expect(source).not.toContain('{#snippet leading()}')
    expect(source).not.toContain('{#snippet trailing()}')
    expect(source).toContain('  />')
  })

  it('emits a trailer snippet with no input gutter', () => {
    const source = buildTextInputSnippet(state({ trailer: staged('Edit', true) }))
    expect(source).toContain('{#snippet trailer()}')
    expect(source).toContain('Edit</span>')
    expect(source).toContain('</TextInput>')
    expect(source).not.toContain('{#snippet leading()}')
    expect(source).not.toContain('className=')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildTextInputSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    expect(buildTextInputSnippet(state({ size: staged('huge') }))).not.toMatch(/^\s*size=/m)
  })

  it('emits a partial ratios override as an inline object expression', () => {
    const off = buildTextInputSnippet(state({ ratios: staged({ font: 0.5 }) }))
    expect(off).not.toMatch(/^\s*ratios=/m)
    const on = buildTextInputSnippet(state({ ratios: staged({ font: 0.5, clearButton: 0.7 }, true) }))
    expect(on).toContain('ratios={{"font":0.5,"clearButton":0.7}}')
  })

  it('compiles the generated snippet with a ratios override', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(
      buildTextInputSnippet(state({ ratios: staged({ padX: 0.75 }, true) })),
      { applyLabel: 'Name' },
    )
    expect(typeof component).toBe('function')
  })

  it('seeds the bound value as script-local state', () => {
    const source = buildTextInputSnippet(state({ value: staged('a"b') }))
    expect(source).toContain('let value = $state("a\\"b")')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildTextInputSnippet(state()), { applyLabel: 'Name' })
    expect(typeof component).toBe('function')
  })

  it('compiles the generated snippet with adornments', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildTextInputSnippet(state({ leading: staged('$', true) })), {
      applyLabel: 'Name',
    })
    expect(typeof component).toBe('function')
  })
})
