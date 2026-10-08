import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildTextInputSnippet, type TextInputSnippetState } from './demo-snippet'

function state(overrides: Partial<TextInputSnippetState> = {}): TextInputSnippetState {
  return {
    ariaLabel: '',
    value: '',
    placeholder: '',
    size: '',
    disabled: '',
    readonly: '',
    inputClass: '',
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
    expect(source).not.toContain('readonly')
    expect(source).not.toContain('inputClass=')
  })

  it('emits a custom ariaLabel literal and text overrides while set', () => {
    const source = buildTextInputSnippet(
      state({ ariaLabel: 'Full name', placeholder: 'Jane', size: 'lg', disabled: 'yes', readonly: 'no', inputClass: 'italic' }),
    )
    expect(source).toContain('ariaLabel="Full name"')
    expect(source).toContain('placeholder="Jane"')
    expect(source).toContain('size="lg"')
    expect(source).toContain('    disabled\n')
    expect(source).toContain('readonly={false}')
    expect(source).toContain('inputClass="italic"')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildTextInputSnippet(state({ size: '14' }))).toContain('size={14}')
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
})
