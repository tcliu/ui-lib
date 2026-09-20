import { describe, expect, it } from 'vitest'
import { buildTagInputSnippet } from './demo-snippet'

describe('buildTagInputSnippet', () => {
  it('falls back to the default placeholder', () => {
    const source = buildTagInputSnippet({ placeholder: '', colored: '', disabled: '', chipClass: '' })
    expect(source).toContain('placeholder="Add a tag"')
    expect(source).not.toContain('chipClassFor=')
    expect(source).not.toContain('chipClass=')
    expect(source).not.toContain('disabled')
  })

  it('emits the colored chips hook and disabled flag', () => {
    const source = buildTagInputSnippet({ placeholder: 'Pick', colored: 'yes', disabled: 'yes', chipClass: '' })
    expect(source).toContain('placeholder="Pick"')
    expect(source).toContain('chipClassFor={colorFor}')
    expect(source).toContain('  disabled\n')
  })

  it('emits a custom chip class', () => {
    const source = buildTagInputSnippet({ placeholder: '', colored: '', disabled: '', chipClass: 'text-cyan-200' })
    expect(source).toContain('chipClass="text-cyan-200"')
  })
})
