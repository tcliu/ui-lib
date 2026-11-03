import { describe, expect, it } from 'vitest'
import { staged } from '$showcase/playground/staged'
import { DEFAULT_TEXT, buildEditableTextSnippet, type EditableTextSnippetState } from './demo-snippet'

function state(overrides: Partial<EditableTextSnippetState> = {}): EditableTextSnippetState {
  return {
    value: staged(''),
    size: staged('', true),
    ratios: staged({}),
    copyable: staged('', true),
    className: staged(''),
    maxWidth: staged('', true),
    ...overrides,
  }
}

describe('buildEditableTextSnippet', () => {
  it('declares the controlled value in a leading script', () => {
    const source = buildEditableTextSnippet(state())
    expect(source.startsWith('<script>')).toBe(true)
    expect(source).toContain(`let value = $state('${DEFAULT_TEXT}')`)
    expect(source).toContain('text={value}')
    expect(source).toContain('onChange={next => { value = next }}')
    expect(source.indexOf('</script>')).toBeLessThan(source.indexOf('<EditableText'))
  })

  it('omits unset size, className, maxWidth, and copyable', () => {
    const source = buildEditableTextSnippet(state())
    expect(source).not.toContain('size=')
    expect(source).not.toContain('ratios=')
    expect(source).not.toContain('className=')
    expect(source).not.toContain('maxWidth=')
    expect(source).not.toContain('copyable')
  })

  it('emits the tri-state copyable flag', () => {
    expect(buildEditableTextSnippet(state({ copyable: staged('yes', true) }))).toContain('    copyable\n')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildEditableTextSnippet(state({ size: staged('md', true), copyable: staged('no', true), maxWidth: staged('480', true) }))
    expect(source).not.toContain('size=')
    expect(source).not.toContain('copyable')
    expect(source).not.toContain('maxWidth=')
  })

  it('bakes the size and escapes the className and value', () => {
    const source = buildEditableTextSnippet({
      ...state(),
      value: staged("Ada's <draft>"),
      size: staged('lg', true),
      className: staged('text-cyan-200', true),
    })
    expect(source).toContain("let value = $state('Ada\\'s <draft>')")
    expect(source).toContain('size="lg"')
    expect(source).toContain('className="text-cyan-200"')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    const numeric = buildEditableTextSnippet(state({ size: staged('14', true) }))
    expect(numeric).toContain('size={14}')
    const invalid = buildEditableTextSnippet(state({ size: staged('huge', true) }))
    expect(invalid).not.toContain('size=')
  })

  it('emits a numeric maxWidth and omits blank or non-numeric input', () => {
    expect(buildEditableTextSnippet(state({ maxWidth: staged('240', true) }))).toContain('maxWidth={240}')
    expect(buildEditableTextSnippet(state({ maxWidth: staged('', true) }))).not.toContain('maxWidth=')
    expect(buildEditableTextSnippet(state({ maxWidth: staged('wide', true) }))).not.toContain('maxWidth=')
  })

  it('omits the staged size while its eye is off', () => {
    expect(buildEditableTextSnippet(state({ size: staged('lg') }))).not.toContain('size=')
  })

  it('omits the staged className while the eye is off and emits it while on', () => {
    expect(buildEditableTextSnippet(state({ className: staged('text-cyan-200') }))).not.toContain('className=')
    expect(buildEditableTextSnippet(state({ className: staged('text-cyan-200', true) }))).toContain('className="text-cyan-200"')
  })

  it('omits the staged copyable while its eye is off', () => {
    expect(buildEditableTextSnippet(state({ copyable: staged('yes') }))).not.toContain('copyable')
  })

  it('omits the staged maxWidth while its eye is off', () => {
    expect(buildEditableTextSnippet(state({ maxWidth: staged('240') }))).not.toContain('maxWidth=')
  })
})

describe('EditableText ratios snippet', () => {
  it('emits a partial override while its eye is on', () => {
    expect(buildEditableTextSnippet(state({ ratios: staged({ padX: 0.75 }, true) }))).toContain(
      'ratios={{"padX":0.75}}',
    )
  })
})
