import { describe, expect, it } from 'vitest'
import { extractScriptValue } from '$showcase/snippet-attributes'
import { createSnippetComponent } from '$showcase/snippet-playground'
import { splitLeadingScript } from '$showcase/snippet-source'
import { buildTextAreaSnippet, type TextAreaSnippetState } from './demo-snippet'

function state(overrides: Partial<TextAreaSnippetState> = {}): TextAreaSnippetState {
  return {
    ariaLabel: '',
    ariaLabelOn: true,
    value: '',
    placeholder: '',
    placeholderOn: false,
    rows: '',
    rowsOn: true,
    size: '',
    sizeOn: false,
    disabled: '',
    disabledOn: true,
    hideOutline: '',
    hideOutlineOn: true,
    readonly: '',
    readonlyOn: true,
    id: '',
    idOn: false,
    inputClass: '',
    inputClassOn: false,
    ...overrides,
  }
}

describe('buildTextAreaSnippet', () => {
  it('reads the aria label from scope while unset and seeds value state', () => {
    const source = buildTextAreaSnippet(state())
    expect(source).toContain('<TextArea bind:value={value} ariaLabel={applyLabel}')
    expect(source).toContain('let value = $state("")')
    expect(source).not.toContain('placeholder=')
    expect(source).not.toContain('rows=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('hideOutline')
    expect(source).not.toContain('id=')
  })

  it('emits placeholder, rows, size, flags, id, and inputClass', () => {
    const source = buildTextAreaSnippet(
      state({ ariaLabel: 'Notes', ariaLabelOn: true, placeholder: 'Write…', placeholderOn: true, rows: '5', rowsOn: true, size: 'lg', sizeOn: true, disabled: 'yes', disabledOn: true, hideOutline: 'yes', hideOutlineOn: true, readonly: 'yes', readonlyOn: true, id: 'notes', idOn: true, inputClass: 'ml-2', inputClassOn: true }),
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
    const source = buildTextAreaSnippet(state({ rows: '3', rowsOn: true, size: 'md', sizeOn: true, disabled: 'no', disabledOn: true, hideOutline: 'no', hideOutlineOn: true, readonly: 'no', readonlyOn: true }))
    expect(source).not.toContain('rows=')
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('hideOutline')
    expect(source).not.toContain('readonly')
  })

  it('omits non-numeric rows', () => {
    expect(buildTextAreaSnippet(state({ rows: 'tall' }))).not.toContain('rows=')
  })

  it('omits staged label, rows, and flags while their eyes are off and emits them while on', () => {
    const off = buildTextAreaSnippet(state({ ariaLabel: 'Notes', ariaLabelOn: false, rows: '5', rowsOn: false, disabled: 'yes', disabledOn: false, readonly: 'yes', readonlyOn: false }))
    expect(off).toContain('ariaLabel={applyLabel}')
    expect(off).not.toContain('ariaLabel="Notes"')
    expect(off).not.toContain('rows=')
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('readonly')
    const on = buildTextAreaSnippet(state({ ariaLabel: 'Notes', ariaLabelOn: true, rows: '5', rowsOn: true, disabled: 'yes', disabledOn: true, readonly: 'yes', readonlyOn: true }))
    expect(on).toContain('ariaLabel="Notes"')
    expect(on).toContain('rows={5}')
    expect(on).toContain('  disabled\n')
    expect(on).toContain('  readonly\n')
  })

  it('omits staged text attrs while the eye is off and emits them while on', () => {
    const off = buildTextAreaSnippet(state({ placeholder: 'Write…', id: 'notes', inputClass: 'ml-2' }))
    expect(off).not.toContain('placeholder=')
    expect(off).not.toContain('id=')
    expect(off).not.toContain('inputClass=')
    const on = buildTextAreaSnippet(state({ placeholder: 'Write…', placeholderOn: true, id: 'notes', idOn: true, inputClass: 'ml-2', inputClassOn: true }))
    expect(on).toContain('placeholder="Write…"')
    expect(on).toContain('id="notes"')
    expect(on).toContain('inputClass="ml-2"')
  })

  it('omits the staged size while its eye is off and emits it while on', () => {
    const off = buildTextAreaSnippet(state({ size: 'lg' }))
    expect(off).not.toMatch(/^\s*size=/m)
    const on = buildTextAreaSnippet(state({ size: 'lg', sizeOn: true }))
    expect(on).toContain('size="lg"')
  })

  it('round-trips a multiline value through script state', () => {
    const source = buildTextAreaSnippet(state({ value: 'one\ntwo' }))
    expect(extractScriptValue(splitLeadingScript(source).declarations, 'value')).toBe('one\ntwo')
  })

  it('escapes markup in the value so it cannot break the snippet', () => {
    const source = buildTextAreaSnippet(state({ value: '</script><TextArea>' }))
    expect(source).toContain('let value = $state("\\u003c/script>\\u003cTextArea>")')
    // The escaped literal reads back as the original text.
    expect(extractScriptValue(splitLeadingScript(source).declarations, 'value')).toBe('</script><TextArea>')
  })

  it('mounts the generated snippet with a bound textarea', { timeout: 30000 }, async () => {
    const { mount, unmount } = await import('svelte')
    const { flushSync } = await import('svelte')
    const component = await createSnippetComponent(buildTextAreaSnippet(state({ value: 'one\ntwo' })), {
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
