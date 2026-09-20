import { describe, expect, it } from 'vitest'
import { buildIconsSnippet, ICON_NAMES } from './demo-snippet'

describe('buildIconsSnippet', () => {
  it('renders bare icons while unset', () => {
    const source = buildIconsSnippet({ size: '', tint: '', className: '' })
    for (const name of ICON_NAMES) {
      expect(source).toContain(`<${name}Icon />${name}`)
    }
    expect(source).not.toContain('className=')
  })

  it('applies the chosen size and tint', () => {
    const source = buildIconsSnippet({ size: 'lg', tint: 'text-cyan-400', className: '' })
    expect(source).toContain('<CheckIcon size="lg" className="text-cyan-400" />Check')
  })

  it('appends a custom className', () => {
    const source = buildIconsSnippet({ size: '', tint: '', className: 'shrink-0' })
    expect(source).toContain('<CheckIcon className="shrink-0" />Check')
  })
})
