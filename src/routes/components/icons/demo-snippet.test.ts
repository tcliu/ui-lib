import { describe, expect, it } from 'vitest'
import { buildIconsSnippet, ICON_COMPONENTS, ICON_ENTRIES, iconLabel } from './demo-snippet'

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

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    const numeric = buildIconsSnippet({ size: '14', tint: '', className: '' })
    expect(numeric).toContain('<CheckIcon size={14} />Check')
    const invalid = buildIconsSnippet({ size: 'huge', tint: '', className: '' })
    expect(invalid).not.toContain('size=')
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

describe('ICON_COMPONENTS parity', () => {
  it('maps a component for every ICON_ENTRIES name', () => {
    const missing = [...new Set(ICON_ENTRIES.map(entry => entry.name))].filter(name => !ICON_COMPONENTS[name])
    expect(missing).toEqual([])
  })

  it('carries no component for a name outside ICON_ENTRIES', () => {
    const known = new Set(ICON_ENTRIES.map(entry => entry.name))
    const extra = Object.keys(ICON_COMPONENTS).filter(name => !known.has(name))
    expect(extra).toEqual([])
  })
})
