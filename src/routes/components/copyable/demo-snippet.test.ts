import { describe, expect, it } from 'vitest'
import { buildCopyableSnippet } from './demo-snippet'

describe('buildCopyableSnippet', () => {
  it('falls back to the default text while unset', () => {
    const source = buildCopyableSnippet({ text: '', copyPosition: '', alwaysVisible: '', className: '' })
    expect(source).toContain('text="Copy me"')
    expect(source).not.toContain('copyPosition=')
    expect(source).not.toContain('alwaysVisible')
    expect(source).not.toContain('className=')
  })

  it('emits text, position, visibility, and className when set', () => {
    const source = buildCopyableSnippet({
      text: 'npm run check',
      copyPosition: 'top-right',
      alwaysVisible: 'yes',
      className: 'font-mono',
    })
    expect(source).toContain('text="npm run check"')
    expect(source).toContain('copyPosition="top-right"')
    expect(source).toContain('  alwaysVisible\n')
    expect(source).toContain('className="font-mono"')
  })
})
