import { describe, expect, it } from 'vitest'
import { buildChipDropdownSnippet } from './demo-snippet'

describe('buildChipDropdownSnippet', () => {
  const unset = { variant: '', filterable: '', disabled: '', align: '', filterPlaceholder: '' } as const

  it('omits every override while unset', () => {
    const source = buildChipDropdownSnippet({ ...unset })
    expect(source).toContain('label={labelFor(options, value)}')
    expect(source).toContain('options={options}')
    expect(source).not.toContain('variant=')
    expect(source).not.toContain('filterable')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('align=')
    expect(source).not.toContain('filterPlaceholder')
  })

  it('emits each curated override when set', () => {
    const source = buildChipDropdownSnippet({
      variant: 'emerald',
      filterable: 'yes',
      disabled: 'no',
      align: 'right',
      filterPlaceholder: 'Find a status',
    })
    expect(source).toContain('variant="emerald"')
    expect(source).toContain('  filterable\n')
    expect(source).toContain('disabled={false}')
    expect(source).toContain('align="right"')
    expect(source).toContain('filterPlaceholder="Find a status"')
  })

  it('escapes quotes in the filter placeholder', () => {
    const source = buildChipDropdownSnippet({ ...unset, filterPlaceholder: 'Say "hi"' })
    expect(source).toContain('filterPlaceholder="Say &quot;hi&quot;"')
  })
})
