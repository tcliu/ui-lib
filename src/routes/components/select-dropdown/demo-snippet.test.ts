import { describe, expect, it } from 'vitest'
import { buildSelectDropdownSnippet } from './demo-snippet'

describe('buildSelectDropdownSnippet', () => {
  it('omits size, flags, and align while unset', () => {
    const source = buildSelectDropdownSnippet({ size: '', filterable: '', controlClass: '', clearable: '', align: '' })
    expect(source).toContain('ariaLabel="default"')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('filterable')
    expect(source).not.toContain('controlClass=')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('align=')
  })

  it('emits size, filterable treatment, clearable, and align', () => {
    const source = buildSelectDropdownSnippet({
      size: 'lg',
      filterable: 'yes',
      controlClass: 'w-40',
      clearable: 'yes',
      align: 'right',
    })
    expect(source).toContain('size="lg"')
    expect(source).toContain('  filterable\n')
    expect(source).toContain('controlClass="w-40"')
    expect(source).toContain('  clearable\n')
    expect(source).toContain('align="right"')
  })
})
