import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildTextInputSnippet, type TextInputSnippetState } from './demo-snippet'

function state(overrides: Partial<TextInputSnippetState> = {}): TextInputSnippetState {
  return {
    ariaLabel: '',
    ariaLabelOn: true,
    value: '',
    placeholder: '',
    placeholderOn: false,
    size: '',
    sizeOn: false,
    disabled: '',
    disabledOn: true,
    hideOutline: '',
    hideOutlineOn: true,
    readonly: '',
    readonlyOn: true,
    required: '',
    requiredOn: true,
    id: '',
    idOn: false,
    inputClass: '',
    inputClassOn: false,
    variant: 'bordered',
    variantOn: false,
    className: '',
    classNameOn: true,
    clearable: '',
    clearableOn: true,
    clearLabel: '',
    clearLabelOn: false,
    clearPlacement: '',
    clearPlacementOn: false,
    defaultValue: '',
    defaultValueOn: false,
    autocomplete: '',
    autocompleteOn: false,
    inputmode: '',
    inputmodeOn: false,
    name: '',
    nameOn: false,
    type: '',
    typeOn: false,
    inputStyle: '',
    inputStyleOn: false,
    wrapperStyle: '',
    wrapperStyleOn: false,
    leading: '',
    trailing: '',
    trailer: '',
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
        ariaLabel: 'Full name',
        ariaLabelOn: true,
        placeholder: 'Jane',
        placeholderOn: true,
        size: 'lg',
        sizeOn: true,
        disabled: 'yes',
        disabledOn: true,
        hideOutline: 'yes',
        hideOutlineOn: true,
        readonly: 'yes',
        readonlyOn: true,
        required: 'yes',
        requiredOn: true,
        inputClass: 'italic',
        inputClassOn: true,
        className: 'pr-12',
        classNameOn: true,
        clearable: 'yes',
        clearableOn: true,
        clearLabel: 'Clear field',
        clearLabelOn: true,
        clearPlacement: 'outside',
        clearPlacementOn: true,
        defaultValue: 'John',
        defaultValueOn: true,
        autocomplete: 'email',
        autocompleteOn: true,
        inputmode: 'numeric',
        inputmodeOn: true,
        name: 'fullName',
        nameOn: true,
        type: 'email',
        typeOn: true,
        inputStyle: 'width: 12rem',
        inputStyleOn: true,
        wrapperStyle: '--input-pad-x: 0.5rem',
        wrapperStyleOn: true,
        trailer: 'Edit',
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
        size: 'md',
        sizeOn: true,
        disabled: 'no',
        disabledOn: true,
        readonly: 'no',
        readonlyOn: true,
        required: 'no',
        requiredOn: true,
        clearable: 'no',
        clearableOn: true,
        clearPlacement: 'auto',
        clearPlacementOn: true,
        variant: 'bordered',
        variantOn: true,
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
    const staged = buildTextInputSnippet(state({ variant: 'embedded' }))
    expect(staged).not.toContain('variant=')
    const applied = buildTextInputSnippet(state({ variant: 'embedded', variantOn: true }))
    expect(applied).toContain('variant="embedded"')
  })

  it('compiles the generated snippet with the embedded variant', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(
      buildTextInputSnippet(state({ variant: 'embedded', variantOn: true })),
      { applyLabel: 'Name' },
    )
    expect(typeof component).toBe('function')
  })

  it('omits staged text props while the eye is off and emits them while on', () => {
    const staged = buildTextInputSnippet(state({ placeholder: 'Jane', id: 'name', defaultValue: 'John' }))
    expect(staged).not.toContain('placeholder=')
    expect(staged).not.toContain('id=')
    expect(staged).not.toContain('defaultValue=')
    const applied = buildTextInputSnippet(
      state({
        placeholder: 'Jane',
        placeholderOn: true,
        id: 'name',
        idOn: true,
        defaultValue: 'John',
        defaultValueOn: true,
      }),
    )
    expect(applied).toContain('placeholder="Jane"')
    expect(applied).toContain('id="name"')
    expect(applied).toContain('defaultValue="John"')
  })

  it('omits staged dropdown props while the eye is off and emits them while on', () => {
    const staged = buildTextInputSnippet(state({ size: 'lg', clearPlacement: 'outside' }))
    expect(staged).not.toMatch(/^\s*size=/m)
    expect(staged).not.toContain('clearPlacement=')
    const applied = buildTextInputSnippet(
      state({ size: 'lg', sizeOn: true, clearPlacement: 'outside', clearPlacementOn: true }),
    )
    expect(applied).toContain('size="lg"')
    expect(applied).toContain('clearPlacement="outside"')
  })

  it('omits staged boolean and label props while the eye is off and emits them while on', () => {
    const staged = buildTextInputSnippet(
      state({ ariaLabel: 'Full name', ariaLabelOn: false, disabled: 'yes', disabledOn: false, readonly: 'yes', readonlyOn: false, required: 'yes', requiredOn: false, className: 'pr-12', classNameOn: false, clearable: 'yes', clearableOn: false }),
    )
    expect(staged).toContain('ariaLabel={applyLabel}')
    expect(staged).not.toContain('ariaLabel="Full name"')
    expect(staged).not.toContain('disabled')
    expect(staged).not.toContain('readonly')
    expect(staged).not.toContain('required')
    expect(staged).not.toContain('className=')
    expect(staged).not.toContain('clearable')
    const applied = buildTextInputSnippet(
      state({ ariaLabel: 'Full name', ariaLabelOn: true, disabled: 'yes', disabledOn: true, readonly: 'yes', readonlyOn: true, required: 'yes', requiredOn: true, className: 'pr-12', classNameOn: true, clearable: 'yes', clearableOn: true }),
    )
    expect(applied).toContain('ariaLabel="Full name"')
    expect(applied).toContain('    disabled\n')
    expect(applied).toContain('    readonly\n')
    expect(applied).toContain('    required\n')
    expect(applied).toContain('className="pr-12"')
    expect(applied).toContain('    clearable\n')
  })

  it('emits adornment snippets with gutters while set', () => {
    const source = buildTextInputSnippet(state({ leading: '$', trailing: 'USD' }))
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
    const source = buildTextInputSnippet(state({ trailer: 'Edit' }))
    expect(source).toContain('{#snippet trailer()}')
    expect(source).toContain('Edit</span>')
    expect(source).toContain('</TextInput>')
    expect(source).not.toContain('{#snippet leading()}')
    expect(source).not.toContain('className=')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildTextInputSnippet(state({ size: '14', sizeOn: true }))).toContain('size={14}')
    expect(buildTextInputSnippet(state({ size: 'huge' }))).not.toMatch(/^\s*size=/m)
  })

  it('seeds the bound value as script-local state', () => {
    const source = buildTextInputSnippet(state({ value: 'a"b' }))
    expect(source).toContain('let value = $state("a\\"b")')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildTextInputSnippet(state()), { applyLabel: 'Name' })
    expect(typeof component).toBe('function')
  })

  it('compiles the generated snippet with adornments', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildTextInputSnippet(state({ leading: '$' })), {
      applyLabel: 'Name',
    })
    expect(typeof component).toBe('function')
  })
})
