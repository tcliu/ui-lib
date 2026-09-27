import { describe, expect, it } from 'vitest'
import { buildMenuSnippet } from './demo-snippet'

describe('buildMenuSnippet', () => {
  it('uses scoped labels while unset', () => {
    const source = buildMenuSnippet({ align: '', triggerLabel: '', firstLabel: '', secondLabel: '' })
    expect(source).toContain('label: editLabel')
    expect(source).toContain('label: deleteLabel')
    expect(source).toContain('ariaLabel={triggerLabel}')
    expect(source).not.toContain('align=')
    expect(source).toContain('{#snippet icon()}')
    expect(source).toContain('<KebabIcon className="h-4 w-4" />')
  })

  it('emits align and custom labels when set', () => {
    const source = buildMenuSnippet({
      align: 'left',
      triggerLabel: 'Options',
      firstLabel: 'Rename',
      secondLabel: 'Remove',
    })
    expect(source).toContain('align="left"')
    expect(source).toContain('ariaLabel="Options"')
    expect(source).toContain('label: "Rename"')
    expect(source).toContain('label: "Remove"')
    expect(source).toContain('itemClass={menuItemClass}')
  })
})
