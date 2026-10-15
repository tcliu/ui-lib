import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildPasswordInputSnippet, type PasswordInputSnippetState } from './demo-snippet'

function state(overrides: Partial<PasswordInputSnippetState> = {}): PasswordInputSnippetState {
  return {
    value: '',
    placeholder: '',
    placeholderOn: false,
    showLabel: '',
    showLabelOn: false,
    hideLabel: '',
    hideLabelOn: false,
    size: '',
    sizeOn: true,
    disabled: '',
    disabledOn: true,
    required: '',
    requiredOn: true,
    clearable: '',
    clearableOn: true,
    clearLabel: '',
    clearLabelOn: false,
    clearPlacement: '',
    clearPlacementOn: true,
    defaultValue: '',
    defaultValueOn: false,
    className: '',
    classNameOn: false,
    autocomplete: '',
    autocompleteOn: false,
    id: '',
    idOn: false,
    name: '',
    nameOn: false,
    ...overrides,
  }
}

describe('buildPasswordInputSnippet', () => {
  it('falls back to the default placeholder', () => {
    const source = buildPasswordInputSnippet(state())
    expect(source).toContain('let value = $state("")')
    expect(source).toContain('placeholder="Password"')
    expect(source).not.toContain('showLabel=')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('className=')
    expect(source).not.toContain('autocomplete=')
    expect(source).not.toContain('id=')
    expect(source).not.toContain('name=')
  })

  it('emits custom labels, flags, and className', () => {
    const source = buildPasswordInputSnippet(
      state({
        placeholder: 'Secret',
        placeholderOn: true,
        showLabel: 'Show secret',
        showLabelOn: true,
        hideLabel: 'Hide secret',
        hideLabelOn: true,
        disabled: 'yes',
        required: 'yes',
        className: 'w-64',
        classNameOn: true,
        autocomplete: 'new-password',
        autocompleteOn: true,
        id: 'pwd',
        idOn: true,
        name: 'pwd',
        nameOn: true,
      }),
    )
    expect(source).toContain('placeholder="Secret"')
    expect(source).toContain('showLabel="Show secret"')
    expect(source).toContain('hideLabel="Hide secret"')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('  required\n')
    expect(source).toContain('className="w-64"')
    expect(source).toContain('autocomplete="new-password"')
    expect(source).toContain('id="pwd"')
    expect(source).toContain('name="pwd"')
  })

  it('omits clearable lines while unset and emits them while set', () => {
    expect(buildPasswordInputSnippet(state())).not.toContain('clearable')
    expect(buildPasswordInputSnippet(state())).not.toContain('defaultValue=')
    const source = buildPasswordInputSnippet(
      state({ clearable: 'yes', clearLabel: 'Clear password', clearLabelOn: true, clearPlacement: 'outside', defaultValue: 'secret', defaultValueOn: true }),
    )
    expect(source).toContain('  clearable\n')
    expect(source).toContain('clearLabel="Clear password"')
    expect(source).toContain('clearPlacement="outside"')
    expect(source).toContain('defaultValue="secret"')
  })

  it('emits a named and a numeric size, and omits invalid sizes', () => {
    expect(buildPasswordInputSnippet(state({ size: 'lg' }))).toContain('size="lg"')
    expect(buildPasswordInputSnippet(state({ size: '14' }))).toContain('size={14}')
    expect(buildPasswordInputSnippet(state({ size: 'huge' }))).not.toContain('size=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildPasswordInputSnippet(
      state({ size: 'md', disabled: 'no', required: 'no', clearable: 'no', clearPlacement: 'auto' }),
    )
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('required')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearPlacement=')
  })

  it('omits eye-gated booleans while their toggles are off', () => {
    const off = buildPasswordInputSnippet(
      state({ disabled: 'yes', disabledOn: false, required: 'yes', requiredOn: false, clearable: 'yes', clearableOn: false }),
    )
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('required')
    expect(off).not.toContain('clearable')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const source = buildPasswordInputSnippet(state())
    const component = await createSnippetComponent(source, {})
    expect(typeof component).toBe('function')
  })

  it('omits staged text props while the eye is off and emits them while on', () => {
    const staged = buildPasswordInputSnippet(state({ showLabel: 'Show secret', id: 'pwd', defaultValue: 'secret' }))
    expect(staged).not.toContain('showLabel=')
    expect(staged).not.toContain('id=')
    expect(staged).not.toContain('defaultValue=')
    expect(staged).toContain('placeholder="Password"')
    const applied = buildPasswordInputSnippet(
      state({ showLabel: 'Show secret', showLabelOn: true, id: 'pwd', idOn: true, defaultValue: 'secret', defaultValueOn: true }),
    )
    expect(applied).toContain('showLabel="Show secret"')
    expect(applied).toContain('id="pwd"')
    expect(applied).toContain('defaultValue="secret"')
  })

  it('omits the size line when the key is absent', () => {
    const { value, placeholder, showLabel, hideLabel, disabled, required, clearable, clearLabel, clearPlacement, clearPlacementOn, defaultValue, className, autocomplete, id, name } = state()
    const source = buildPasswordInputSnippet({
      value,
      placeholder,
      placeholderOn: false,
      showLabel,
      showLabelOn: false,
      hideLabel,
      hideLabelOn: false,
      disabled,
      disabledOn: true,
      required,
      requiredOn: true,
      clearable,
      clearableOn: true,
      clearLabel,
      clearLabelOn: false,
      clearPlacement,
      clearPlacementOn,
      defaultValue,
      defaultValueOn: false,
      className,
      classNameOn: false,
      autocomplete,
      autocompleteOn: false,
      id,
      idOn: false,
      name,
      nameOn: false,
      sizeOn: false,
    })
    expect(source).not.toContain('size=')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildPasswordInputSnippet(
      state({ size: 'lg', sizeOn: false, clearPlacement: 'outside', clearPlacementOn: false }),
    )
    expect(off).not.toContain('size=')
    expect(off).not.toContain('clearPlacement=')
  })
})
