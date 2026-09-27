import { describe, expect, it } from 'vitest'
import { DEFAULT_TEXT, buildCopyButtonSnippet, type CopyButtonSnippetState } from './demo-snippet'

const base: CopyButtonSnippetState = {
  text: '',
  alwaysVisible: '',
  copyAriaLabel: '',
  copyTooltip: '',
}

describe('buildCopyButtonSnippet', () => {
  it('falls back to the default text and omits unset props', () => {
    const source = buildCopyButtonSnippet(base)
    expect(source).toContain(`>${DEFAULT_TEXT}</span>`)
    expect(source).toContain(`text="${DEFAULT_TEXT}"`)
    expect(source).not.toContain('alwaysVisible')
    expect(source).not.toContain('copyAriaLabel=')
    expect(source).not.toContain('copyTooltip=')
  })

  it('emits the tri-state alwaysVisible flag', () => {
    expect(buildCopyButtonSnippet({ ...base, alwaysVisible: 'yes' })).toContain('      alwaysVisible\n')
    expect(buildCopyButtonSnippet({ ...base, alwaysVisible: 'no' })).toContain('alwaysVisible={false}')
  })

  it('emits and escapes the accessible name and tooltip', () => {
    const source = buildCopyButtonSnippet({
      ...base,
      copyAriaLabel: 'Copy "link"',
      copyTooltip: 'Copy link',
    })
    expect(source).toContain('copyAriaLabel="Copy &quot;link&quot;"')
    expect(source).toContain('copyTooltip="Copy link"')
  })

  it('escapes markup in the copied and displayed text', () => {
    const source = buildCopyButtonSnippet({ ...base, text: 'a <b> & c' })
    expect(source).toContain('a &lt;b&gt; &amp; c')
    expect(source).toContain('text="a &lt;b&gt; &amp; c"')
  })
})
