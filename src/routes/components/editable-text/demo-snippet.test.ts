import { describe, expect, it } from 'vitest'
import { DEFAULT_TEXT, buildEditableTextSnippet, type EditableTextSnippetState } from './demo-snippet'

const base: EditableTextSnippetState = {
  value: '',
  size: '',
  copyable: '',
  className: '',
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

  it('omits unset size, className, and copyable', () => {
    const source = buildEditableTextSnippet(base)
    expect(source).not.toContain('size=')
    expect(source).not.toContain('className=')
    expect(source).not.toContain('copyable')
  })

  it('emits the tri-state copyable flag', () => {
    expect(buildEditableTextSnippet({ ...base, copyable: 'yes' })).toContain('    copyable\n')
    expect(buildEditableTextSnippet({ ...base, copyable: 'no' })).toContain('copyable={false}')
  })

  it('bakes the size and escapes the className and value', () => {
    const source = buildEditableTextSnippet({
      ...base,
      value: "Ada's <draft>",
      size: 'lg',
      className: 'text-cyan-200',
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
})
