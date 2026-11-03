import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$showcase/playground/snippet-playground'
import { staged } from '$showcase/playground/staged'
import { buildPasswordInputSnippet, type PasswordInputSnippetState } from './demo-snippet'

function state(overrides: Partial<PasswordInputSnippetState> = {}): PasswordInputSnippetState {
  return {
    value: staged(''),
    placeholder: staged(''),
    showLabel: staged(''),
    hideLabel: staged(''),
    size: staged('', true),
    ratios: staged({}),
    disabled: staged('', true),
    hideOutline: staged('', true),
    required: staged('', true),
    clearable: staged('', true),
    clearLabel: staged(''),
    clearPlacement: staged('', true),
    defaultValue: staged(''),
    className: staged(''),
    autocomplete: staged(''),
    id: staged(''),
    name: staged(''),
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
    expect(source).not.toContain('hideOutline')
    expect(source).not.toContain('className=')
    expect(source).not.toContain('autocomplete=')
    expect(source).not.toContain('id=')
    expect(source).not.toContain('name=')
  })

  it('emits custom labels, flags, and className', () => {
    const source = buildPasswordInputSnippet(
      state({
        placeholder: staged('Secret', true),
        showLabel: staged('Show secret', true),
        hideLabel: staged('Hide secret', true),
        disabled: staged('yes', true),
        hideOutline: staged('yes', true),
        required: staged('yes', true),
        className: staged('w-64', true),
        autocomplete: staged('new-password', true),
        id: staged('pwd', true),
        name: staged('pwd', true),
      }),
    )
    expect(source).toContain('placeholder="Secret"')
    expect(source).toContain('showLabel="Show secret"')
    expect(source).toContain('hideLabel="Hide secret"')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('  hideOutline\n')
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
      state({ clearable: staged('yes', true), clearLabel: staged('Clear password', true), clearPlacement: staged('outside', true), defaultValue: staged('secret', true) }),
    )
    expect(source).toContain('  clearable\n')
    expect(source).toContain('clearLabel="Clear password"')
    expect(source).toContain('clearPlacement="outside"')
    expect(source).toContain('defaultValue="secret"')
  })

  it('emits a named and a numeric size, and omits invalid sizes', () => {
    expect(buildPasswordInputSnippet(state({ size: staged('lg', true) }))).toContain('size="lg"')
    expect(buildPasswordInputSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    expect(buildPasswordInputSnippet(state({ size: staged('huge', true) }))).not.toContain('size=')
  })

  it('emits a partial ratios override while its eye is on', () => {
    expect(buildPasswordInputSnippet(state())).not.toContain('ratios=')
    expect(buildPasswordInputSnippet(state({ ratios: staged({ padX: 0.75 }, true) }))).toContain(
      'ratios={{"padX":0.75}}',
    )
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildPasswordInputSnippet(
      state({ size: staged('md', true), disabled: staged('no', true), hideOutline: staged('no', true), required: staged('no', true), clearable: staged('no', true), clearPlacement: staged('auto', true) }),
    )
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('hideOutline')
    expect(source).not.toContain('required')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearPlacement=')
  })

  it('omits eye-gated booleans while their toggles are off', () => {
    const off = buildPasswordInputSnippet(
      state({ disabled: staged('yes'), hideOutline: staged('yes'), required: staged('yes'), clearable: staged('yes') }),
    )
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('hideOutline')
    expect(off).not.toContain('required')
    expect(off).not.toContain('clearable')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const source = buildPasswordInputSnippet(state())
    const component = await createSnippetComponent(source, {})
    expect(typeof component).toBe('function')
  })

  it('omits staged text props while the eye is off and emits them while on', () => {
    const off = buildPasswordInputSnippet(state({ showLabel: staged('Show secret'), id: staged('pwd'), defaultValue: staged('secret') }))
    expect(off).not.toContain('showLabel=')
    expect(off).not.toContain('id=')
    expect(off).not.toContain('defaultValue=')
    expect(off).toContain('placeholder="Password"')
    const on = buildPasswordInputSnippet(
      state({ showLabel: staged('Show secret', true), id: staged('pwd', true), defaultValue: staged('secret', true) }),
    )
    expect(on).toContain('showLabel="Show secret"')
    expect(on).toContain('id="pwd"')
    expect(on).toContain('defaultValue="secret"')
  })

  it('omits the size line when the key is absent', () => {
    const source = buildPasswordInputSnippet({ ...state(), size: undefined })
    expect(source).not.toContain('size=')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildPasswordInputSnippet(
      state({ size: staged('lg'), clearPlacement: staged('outside') }),
    )
    expect(off).not.toContain('size=')
    expect(off).not.toContain('clearPlacement=')
  })
})
