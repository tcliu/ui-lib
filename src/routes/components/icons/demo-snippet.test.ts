import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildIconsSnippet, ICON_COMPONENTS, ICON_ENTRIES, iconLabel } from './demo-snippet'

describe('buildIconsSnippet', () => {
  it('renders bare icons while unset', () => {
    const source = buildIconsSnippet({ size: '', sizeOn: true, tint: '', className: '', classNameOn: true })
    for (const entry of ICON_ENTRIES) {
      expect(source).toContain(`<${entry.name}Icon />${iconLabel(entry)}`)
    }
    expect(source).not.toContain('className=')
  })

  it('applies the chosen size and tint', () => {
    const source = buildIconsSnippet({ size: 'lg', sizeOn: true, tint: 'text-cyan-400', className: '', classNameOn: true })
    expect(source).toContain('<CheckIcon size="lg" className="text-cyan-400" />Check')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    const numeric = buildIconsSnippet({ size: '14', sizeOn: true, tint: '', className: '', classNameOn: true })
    expect(numeric).toContain('<CheckIcon size={14} />Check')
    const invalid = buildIconsSnippet({ size: 'huge', sizeOn: true, tint: '', className: '', classNameOn: true })
    expect(invalid).not.toContain('size=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildIconsSnippet({ size: 'md', sizeOn: true, tint: '', className: '', classNameOn: true })
    for (const entry of ICON_ENTRIES) {
      expect(source).toContain(`<${entry.name}Icon />${iconLabel(entry)}`)
    }
    expect(source).not.toContain('size=')
  })

  it('appends a custom className', () => {
    const source = buildIconsSnippet({ size: '', sizeOn: true, tint: '', className: 'shrink-0', classNameOn: true })
    expect(source).toContain('<CheckIcon className="shrink-0" />Check')
  })

  it('emits no variant attributes', () => {
    const source = buildIconsSnippet({ size: '', sizeOn: true, tint: '', className: '', classNameOn: true })
    expect(source).not.toContain('variant=')
  })

  it('omits the staged size while its eye is off', () => {
    const source = buildIconsSnippet({ size: 'lg', sizeOn: false, tint: '', className: '', classNameOn: true })
    expect(source).not.toContain('size=')
  })

  it('omits the staged className while its eye is off but keeps the tint', () => {
    const source = buildIconsSnippet({ size: '', sizeOn: true, tint: 'text-cyan-400', className: 'shrink-0', classNameOn: false })
    expect(source).toContain('<CheckIcon className="text-cyan-400" />Check')
    expect(source).not.toContain('shrink-0')
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

describe('icon gallery coverage', () => {
  // The page is the icon set's index, so a glyph file cannot ship without an
  // entry: read the directory instead of trusting the hand-kept list.
  const glyphs = readdirSync(join(process.cwd(), 'src/lib/icons'))
    .filter(name => name.endsWith('Icon.svelte'))
    .map(name => name.replace(/\.svelte$/, ''))

  it('lists an entry for every glyph in src/lib/icons', () => {
    const listed = new Set(ICON_ENTRIES.map(entry => `${entry.name}Icon`))
    expect(glyphs.filter(glyph => !listed.has(glyph))).toEqual([])
  })

  it('lists entries in name order', () => {
    const names = ICON_ENTRIES.map(entry => entry.name)
    expect(names).toEqual([...names].sort())
  })
})
