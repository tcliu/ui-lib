import { describe, expect, it } from 'vitest'
import { extractScriptValue } from '#showcase/playground/snippet-attributes.js'
import { createSnippetComponent } from '#showcase/playground/snippet-playground.js'
import { splitLeadingScript } from '#showcase/playground/snippet-source.js'
import { staged } from '#showcase/playground/staged.js'
import { buildTextAreaSnippet, type TextAreaSnippetState } from './demo-snippet'

function state(overrides: Partial<TextAreaSnippetState> = {}): TextAreaSnippetState {
  return {
    ariaLabel: staged('', true),
    value: staged(''),
    placeholder: staged(''),
    rows: staged('', true),
    size: staged(''),
    ratios: staged({}),
    disabled: staged('', true),
    hideOutline: staged('', true),
    readonly: staged('', true),
    id: staged(''),
    inputClass: staged(''),
    ...overrides,
  }
}

describe('buildTextAreaSnippet', () => {
  it('reads the aria label from scope while unset and seeds value state', () => {
    const source = buildTextAreaSnippet(state())
    expect(source).toContain('<TextArea bind:value={value} ariaLabel={applyLabel}')
    expect(source).toContain('let value = $state("")')
    expect(source).not.toContain('placeholder=')
    expect(source).not.toContain('ratios=')
    expect(source).not.toContain('rows=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('hideOutline')
    expect(source).not.toContain('id=')
  })

  it('emits placeholder, rows, size, flags, id, and inputClass', () => {
    const source = buildTextAreaSnippet(
      state({ ariaLabel: staged('Notes', true), placeholder: staged('Write…', true), rows: staged('5', true), size: staged('lg', true), disabled: staged('yes', true), hideOutline: staged('yes', true), readonly: staged('yes', true), id: staged('notes', true), inputClass: staged('ml-2', true) }),
    )
    expect(source).toContain('ariaLabel="Notes"')
    expect(source).toContain('placeholder="Write…"')
    expect(source).toContain('rows={5}')
    expect(source).toContain('size="lg"')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('  hideOutline\n')
    expect(source).toContain('  readonly\n')
    expect(source).toContain('id="notes"')
    expect(source).toContain('inputClass="ml-2"')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildTextAreaSnippet(state({ rows: staged('3', true), size: staged('md', true), disabled: staged('no', true), hideOutline: staged('no', true), readonly: staged('no', true) }))
    expect(source).not.toContain('rows=')
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('hideOutline')
    expect(source).not.toContain('readonly')
  })

  it('omits non-numeric rows', () => {
    expect(buildTextAreaSnippet(state({ rows: staged('tall', true) }))).not.toContain('rows=')
  })

  it('emits a partial ratios override while its eye is on', () => {
    expect(buildTextAreaSnippet(state())).not.toContain('ratios=')
    expect(buildTextAreaSnippet(state({ ratios: staged({ padX: 0.75 }, true) }))).toContain(
      'ratios={{"padX":0.75}}',
    )
  })

  it('omits staged label, rows, and flags while their eyes are off and emits them while on', () => {
    const off = buildTextAreaSnippet(state({ ariaLabel: staged('Notes'), rows: staged('5'), disabled: staged('yes'), readonly: staged('yes') }))
    expect(off).toContain('ariaLabel={applyLabel}')
    expect(off).not.toContain('ariaLabel="Notes"')
    expect(off).not.toContain('rows=')
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('readonly')
    const on = buildTextAreaSnippet(state({ ariaLabel: staged('Notes', true), rows: staged('5', true), disabled: staged('yes', true), readonly: staged('yes', true) }))
    expect(on).toContain('ariaLabel="Notes"')
    expect(on).toContain('rows={5}')
    expect(on).toContain('  disabled\n')
    expect(on).toContain('  readonly\n')
  })

  it('omits staged text attrs while the eye is off and emits them while on', () => {
    const off = buildTextAreaSnippet(state({ placeholder: staged('Write…'), id: staged('notes'), inputClass: staged('ml-2') }))
    expect(off).not.toContain('placeholder=')
    expect(off).not.toContain('id=')
    expect(off).not.toContain('inputClass=')
    const on = buildTextAreaSnippet(state({ placeholder: staged('Write…', true), id: staged('notes', true), inputClass: staged('ml-2', true) }))
    expect(on).toContain('placeholder="Write…"')
    expect(on).toContain('id="notes"')
    expect(on).toContain('inputClass="ml-2"')
  })

  it('omits the staged size while its eye is off and emits it while on', () => {
    const off = buildTextAreaSnippet(state({ size: staged('lg') }))
    expect(off).not.toMatch(/^\s*size=/m)
    const on = buildTextAreaSnippet(state({ size: staged('lg', true) }))
    expect(on).toContain('size="lg"')
  })

  it('round-trips a multiline value through script state', () => {
    const source = buildTextAreaSnippet(state({ value: staged('one\ntwo') }))
    expect(extractScriptValue(splitLeadingScript(source).declarations, 'value')).toBe('one\ntwo')
  })

  it('escapes markup in the value so it cannot break the snippet', () => {
    const source = buildTextAreaSnippet(state({ value: staged('</script><TextArea>') }))
    expect(source).toContain('let value = $state("\\u003c/script>\\u003cTextArea>")')
    // The escaped literal reads back as the original text.
    expect(extractScriptValue(splitLeadingScript(source).declarations, 'value')).toBe('</script><TextArea>')
  })

  it('mounts the generated snippet with a bound textarea', { timeout: 30000 }, async () => {
    const { mount, unmount } = await import('svelte')
    const { flushSync } = await import('svelte')
    const component = await createSnippetComponent(buildTextAreaSnippet(state({ value: staged('one\ntwo') })), {
      applyLabel: 'Notes',
    })
    const target = document.createElement('div')
    document.body.appendChild(target)
    const instance = mount(component, { target })
    flushSync()
    try {
      // Mounting (not just compiling) proves the preamble resolves TextArea.
      expect(target.querySelector('textarea')?.value).toBe('one\ntwo')
    } finally {
      await unmount(instance)
      target.remove()
    }
  })
})
