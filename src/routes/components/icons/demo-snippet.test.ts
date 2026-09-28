import { describe, expect, it } from 'vitest'
import { buildIconsSnippet, ICON_ENTRIES, iconLabel } from './demo-snippet'

describe('buildIconsSnippet', () => {
  it('renders bare icons while unset', () => {
    const source = buildIconsSnippet({ size: '', tint: '', className: '' })
    for (const entry of ICON_ENTRIES) {
      const variant = entry.variant ? ` variant="${entry.variant}"` : ''
      expect(source).toContain(`<${entry.name}Icon${variant} />${iconLabel(entry)}`)
    }
    expect(source).not.toContain('className=')
  })

  it('applies the chosen size and tint', () => {
    const source = buildIconsSnippet({ size: 'lg', tint: 'text-cyan-400', className: '' })
    expect(source).toContain('<CheckIcon size="lg" className="text-cyan-400" />Check')
  })

  it('renders the solid chevron variant', () => {
    const source = buildIconsSnippet({ size: '', tint: '', className: '' })
    expect(source).toContain('<ChevronDownIcon variant="solid" />ChevronDownSolid')
  })

  it('appends a custom className', () => {
    const source = buildIconsSnippet({ size: '', tint: '', className: 'shrink-0' })
    expect(source).toContain('<CheckIcon className="shrink-0" />Check')
  })
})
