import { describe, expect, it } from 'vitest'
import { DEFAULT_TEXT, buildEditableTextSnippet, type EditableTextSnippetState } from './demo-snippet'

const base: EditableTextSnippetState = {
  value: '',
  size: '',
  sizeOn: true,
  copyable: '',
  copyableOn: true,
  className: '',
  classNameOn: false,
  maxWidth: '',
  maxWidthOn: true,
}

describe('buildEditableTextSnippet', () => {
  it('declares the controlled value in a leading script', () => {
    const source = buildEditableTextSnippet(base)
    expect(source.startsWith('<script>')).toBe(true)
    expect(source).toContain(`let value = $state('${DEFAULT_TEXT}')`)
    expect(source).toContain('text={value}')
    expect(source).toContain('onChange={next => { value = next }}')
    expect(source.indexOf('</script>')).toBeLessThan(source.indexOf('<EditableText'))
  })

  it('omits unset size, className, maxWidth, and copyable', () => {
    const source = buildEditableTextSnippet(base)
    expect(source).not.toContain('size=')
    expect(source).not.toContain('className=')
    expect(source).not.toContain('maxWidth=')
    expect(source).not.toContain('copyable')
  })

  it('emits the tri-state copyable flag', () => {
    expect(buildEditableTextSnippet({ ...base, copyable: 'yes' })).toContain('    copyable\n')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildEditableTextSnippet({ ...base, size: 'md', copyable: 'no', maxWidth: '480' })
    expect(source).not.toContain('size=')
    expect(source).not.toContain('copyable')
    expect(source).not.toContain('maxWidth=')
  })

  it('bakes the size and escapes the className and value', () => {
    const source = buildEditableTextSnippet({
      ...base,
      value: "Ada's <draft>",
      size: 'lg',
      className: 'text-cyan-200',
      classNameOn: true,
    })
    expect(source).toContain("let value = $state('Ada\\'s <draft>')")
    expect(source).toContain('size="lg"')
    expect(source).toContain('className="text-cyan-200"')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    const numeric = buildEditableTextSnippet({ ...base, size: '14' })
    expect(numeric).toContain('size={14}')
    const invalid = buildEditableTextSnippet({ ...base, size: 'huge' })
    expect(invalid).not.toContain('size=')
  })

  it('emits a numeric maxWidth and omits blank or non-numeric input', () => {
    expect(buildEditableTextSnippet({ ...base, maxWidth: '240' })).toContain('maxWidth={240}')
    expect(buildEditableTextSnippet({ ...base, maxWidth: '' })).not.toContain('maxWidth=')
    expect(buildEditableTextSnippet({ ...base, maxWidth: 'wide' })).not.toContain('maxWidth=')
  })

  it('omits the staged size while its eye is off', () => {
    expect(buildEditableTextSnippet({ ...base, size: 'lg', sizeOn: false })).not.toContain('size=')
  })

  it('omits the staged className while the eye is off and emits it while on', () => {
    expect(buildEditableTextSnippet({ ...base, className: 'text-cyan-200' })).not.toContain('className=')
    expect(buildEditableTextSnippet({ ...base, className: 'text-cyan-200', classNameOn: true })).toContain('className="text-cyan-200"')
  })

  it('omits the staged copyable while its eye is off', () => {
    expect(buildEditableTextSnippet({ ...base, copyable: 'yes', copyableOn: false })).not.toContain('copyable')
  })

  it('omits the staged maxWidth while its eye is off', () => {
    expect(buildEditableTextSnippet({ ...base, maxWidth: '240', maxWidthOn: false })).not.toContain('maxWidth=')
  })
})
