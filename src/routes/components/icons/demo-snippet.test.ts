import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { VARIANT_LADDERS } from '$lib/icons/icon-variants'
import {
  ALL_VARIANTS,
  buildIconsSnippet,
  ICON_COMPONENTS,
  ICON_ENTRIES,
  iconLabel,
  iconTakesVariant,
  variantFor,
  variantsFor,
} from './demo-snippet'

const BARE = { size: '', sizeOn: true, tint: '', className: '', classNameOn: true, variant: '', variantOn: false }

describe('buildIconsSnippet', () => {
  it('renders bare icons while unset', () => {
    const source = buildIconsSnippet(BARE)
    for (const entry of ICON_ENTRIES) {
      expect(source).toContain(`<${entry.name}Icon />${iconLabel(entry)}`)
    }
    expect(source).not.toContain('className=')
  })

  it('applies the chosen size and tint', () => {
    const source = buildIconsSnippet({ ...BARE, size: 'lg', tint: 'text-cyan-400' })
    expect(source).toContain('<CheckIcon size="lg" className="text-cyan-400" />Check')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    const numeric = buildIconsSnippet({ ...BARE, size: '14' })
    expect(numeric).toContain('<CheckIcon size={14} />Check')
    const invalid = buildIconsSnippet({ ...BARE, size: 'huge' })
    expect(invalid).not.toContain('size=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildIconsSnippet({ ...BARE, size: 'md' })
    for (const entry of ICON_ENTRIES) {
      expect(source).toContain(`<${entry.name}Icon />${iconLabel(entry)}`)
    }
    expect(source).not.toContain('size=')
  })

  it('appends a custom className', () => {
    const source = buildIconsSnippet({ ...BARE, className: 'shrink-0' })
    expect(source).toContain('<CheckIcon className="shrink-0" />Check')
  })

  it('applies the variant to the glyphs that carry it', () => {
    const source = buildIconsSnippet({ ...BARE, variant: 'bold', variantOn: true })
    expect(source).toContain('<ChevronUpIcon variant="bold" />ChevronUp')
    expect(source).toContain('<DoubleChevronLeftIcon variant="bold" />DoubleChevronLeft')
    expect(source).toContain('<CheckIcon />Check')
    expect(source).not.toContain('<CheckIcon variant=')
    expect(source).not.toContain('<CopyIcon variant=')
  })

  it('applies each registered variant to the glyphs that carry it', () => {
    const heavy = buildIconsSnippet({ ...BARE, variant: 'heavy', variantOn: true })
    expect(heavy).toContain('<DoubleChevronLeftIcon variant="heavy" />DoubleChevronLeft')
    expect(heavy).not.toContain('<ChevronUpIcon variant="heavy" />ChevronUp')

    const compact = buildIconsSnippet({ ...BARE, variant: 'compact', variantOn: true })
    expect(compact).toContain('<CopyIcon variant="compact" />Copy')
    expect(compact).not.toContain('<ChevronUpIcon variant="compact" />ChevronUp')

    const solid = buildIconsSnippet({ ...BARE, variant: 'solid', variantOn: true })
    expect(solid).toContain('<EditIcon variant="solid" />Edit')
    expect(solid).not.toContain('<ChevronUpIcon variant="solid" />ChevronUp')
  })

  it('offers every registered variant in the playground', () => {
    const registered = [...new Set(Object.values(VARIANT_LADDERS).flatMap(ladder => [...ladder.variants]))]
    expect(ALL_VARIANTS).toEqual(registered)
  })

  it('omits the variant while its eye is off', () => {
    const off = buildIconsSnippet({ ...BARE, variant: 'bold', variantOn: false })
    expect(off).not.toContain('variant=')
  })

  it('omits the staged size while its eye is off', () => {
    const source = buildIconsSnippet({ ...BARE, size: 'lg', sizeOn: false })
    expect(source).not.toContain('size=')
  })

  it('omits the staged className while its eye is off but keeps the tint', () => {
    const source = buildIconsSnippet({ ...BARE, tint: 'text-cyan-400', className: 'shrink-0', classNameOn: false })
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

  it('treats exactly the registered glyphs as variant-capable', () => {
    expect(ICON_ENTRIES.map(entry => entry.name).filter(iconTakesVariant)).toEqual([
      'ChevronDown',
      'ChevronLeft',
      'ChevronRight',
      'ChevronUp',
      'Copy',
      'DoubleChevronDown',
      'DoubleChevronLeft',
      'DoubleChevronRight',
      'DoubleChevronUp',
      'Edit',
    ])
  })

  it('gives a glyph the variant only when it carries it', () => {
    for (const entry of ICON_ENTRIES) {
      const variants = variantsFor(entry.name)
      for (const variant of ALL_VARIANTS) {
        const expected = variants.includes(variant) ? { variant } : {}
        expect(variantFor(entry.name, variant), `${entry.name} ${variant}`).toEqual(expected)
      }
      expect(variantFor(entry.name, undefined), entry.name).toEqual({})
    }
  })
})
