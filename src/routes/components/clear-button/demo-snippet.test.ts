import { describe, expect, it } from 'vitest'
import { staged } from '#showcase/playground/staged.js'
import { buildClearButtonSnippet } from './demo-snippet'

const base = {
  ariaLabel: staged(''),
  disabled: staged('no' as const, true),
  size: staged('md', true),
  tooltip: staged(''),
}

describe('buildClearButtonSnippet', () => {
  it('omits the component defaults while the Value column prefills them', () => {
    const source = buildClearButtonSnippet(base)
    expect(source).toContain('<ClearButton')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('ariaLabel=')
    expect(source).not.toContain('tooltip=')
  })

  it('emits the clear handler and the demo count', () => {
    const source = buildClearButtonSnippet(base)
    expect(source).toContain('onClick={() => (clicks += 1)} />')
    expect(source).toContain('<span>{clicks}</span>')
  })

  it('emits a non-default size, label, tooltip, and disabled state', () => {
    const source = buildClearButtonSnippet({
      ariaLabel: staged('Clear tag filters', true),
      disabled: staged('yes' as const, true),
      size: staged('lg', true),
      tooltip: staged('Remove filters', true),
    })
    expect(source).toContain('size="lg"')
    expect(source).toContain('disabled')
    expect(source).toContain('ariaLabel="Clear tag filters"')
    expect(source).toContain('tooltip="Remove filters"')
  })

  it('emits a numeric size as an expression', () => {
    expect(buildClearButtonSnippet({ ...base, size: staged('20', true) })).toContain('size={20}')
  })

  it('omits a staged value while its eye is off', () => {
    const source = buildClearButtonSnippet({
      ariaLabel: staged('Clear tag filters'),
      disabled: staged('no' as const, true),
      size: staged('lg'),
      tooltip: staged('Remove filters'),
    })
    expect(source).not.toContain('size=')
    expect(source).not.toContain('ariaLabel=')
    expect(source).not.toContain('tooltip=')
  })
})
