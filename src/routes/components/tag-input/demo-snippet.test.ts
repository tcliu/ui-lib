import { describe, expect, it } from 'vitest'
import { buildTagInputSnippet } from './demo-snippet'

describe('buildTagInputSnippet', () => {
  it('falls back to the default placeholder and the built-in palette', () => {
    const source = buildTagInputSnippet({ placeholder: '', palette: '', disabled: '' })
    expect(source).toContain('placeholder="Add a tag"')
    expect(source).not.toContain('palette=')
    expect(source).not.toContain('disabled')
  })

  it('emits the palette override and the disabled flag', () => {
    const source = buildTagInputSnippet({ placeholder: 'Pick', palette: 'alt', disabled: 'yes' })
    expect(source).toContain('placeholder="Pick"')
    expect(source).toContain('palette={altPalette}')
    expect(source).toContain('  disabled\n')
  })
})
