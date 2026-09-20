import { describe, expect, it } from 'vitest'
import { FILTERABLE_CONTROL, buildSelectDropdownSnippet } from './demo-snippet'

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
    const source = buildSelectDropdownSnippet({ size: 'lg', filterable: 'yes', controlClass: FILTERABLE_CONTROL, clearable: 'yes', align: 'right' })
    expect(source).toContain('size="lg"')
    expect(source).toContain('  filterable\n')
    expect(source).toContain('controlClass="w-40 rounded-md border border-slate-700 bg-slate-950 pl-3 pr-7 py-2 text-sm text-slate-100 outline-none transition motion-reduce:transition-none hover:border-cyan-500 focus-visible:border-cyan-500"')
    expect(source).toContain('  clearable\n')
    expect(source).toContain('align="right"')
  })
})
