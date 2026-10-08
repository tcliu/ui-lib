import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildPasswordInputSnippet } from './demo-snippet'

describe('buildPasswordInputSnippet', () => {
  it('falls back to the default placeholder', () => {
    const source = buildPasswordInputSnippet({
      value: '',
      placeholder: '',
      showLabel: '',
      hideLabel: '',
      disabled: '',
      required: '',
      className: '',
    })
    expect(source).toContain('let value = $state("")')
    expect(source).toContain('placeholder="Password"')
    expect(source).not.toContain('showLabel=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('className=')
  })

  it('emits custom labels, flags, and className', () => {
    const source = buildPasswordInputSnippet({
      value: '',
      placeholder: 'Secret',
      showLabel: 'Show secret',
      hideLabel: 'Hide secret',
      disabled: 'yes',
      required: 'no',
      className: 'w-64',
    })
    expect(source).toContain('placeholder="Secret"')
    expect(source).toContain('showLabel="Show secret"')
    expect(source).toContain('hideLabel="Hide secret"')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('required={false}')
    expect(source).toContain('className="w-64"')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const source = buildPasswordInputSnippet({
      value: '',
      placeholder: '',
      showLabel: '',
      hideLabel: '',
      disabled: '',
      required: '',
      className: '',
    })
    const component = await createSnippetComponent(source, {})
    expect(typeof component).toBe('function')
  })
})
