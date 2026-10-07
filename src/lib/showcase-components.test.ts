import { describe, expect, it } from 'vitest'
import { getRelatedComponents, SHOWCASE_COMPONENT_GROUPS, SHOWCASE_COMPONENTS } from './showcase-components'

const registrySlugs = new Set(SHOWCASE_COMPONENTS.map(component => component.slug))

describe('SHOWCASE_COMPONENT_GROUPS', () => {
  it('only names components that exist in the registry', () => {
    for (const members of Object.values(SHOWCASE_COMPONENT_GROUPS)) {
      for (const member of members) {
        expect(registrySlugs.has(member)).toBe(true)
      }
    }
  })

  it('covers every registry component', () => {
    const grouped = new Set(Object.values(SHOWCASE_COMPONENT_GROUPS).flat())
    for (const component of SHOWCASE_COMPONENTS) {
      expect(grouped.has(component.slug)).toBe(true)
    }
  })
})

describe('getRelatedComponents', () => {
  it('returns the components sharing any of the slug groups', () => {
    const slugs = getRelatedComponents('select-dropdown').map(component => component.slug)
    expect(slugs).toContain('menu')
    expect(slugs).toContain('combobox')
    expect(slugs).not.toContain('select-dropdown')
  })

  it('includes unions across several groups without duplicates', () => {
    // chip-dropdown sits in both `selectors` and `tags`.
    const slugs = getRelatedComponents('chip-dropdown').map(component => component.slug)
    expect(slugs).toEqual(expect.arrayContaining(['select-dropdown', 'chip', 'tag-input']))
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('links the typing-to-filter surfaces through the textFilter group', () => {
    const selectSlugs = getRelatedComponents('select-dropdown').map(component => component.slug)
    expect(selectSlugs).toContain('tag-input')
    const tagSlugs = getRelatedComponents('tag-input').map(component => component.slug)
    expect(tagSlugs).toEqual(expect.arrayContaining(['select-dropdown', 'combobox']))
  })

  it('is symmetric for every component', () => {
    for (const component of SHOWCASE_COMPONENTS) {
      for (const related of getRelatedComponents(component.slug)) {
        const reverse = getRelatedComponents(related.slug).map(entry => entry.slug)
        expect(reverse).toContain(component.slug)
      }
    }
  })

  it('orders results by the registry, not by group membership', () => {
    const order = SHOWCASE_COMPONENTS.map(component => component.slug)
    const slugs = getRelatedComponents('chip-dropdown').map(component => component.slug)
    const sorted = [...slugs].sort((a, b) => order.indexOf(a) - order.indexOf(b))
    expect(slugs).toEqual(sorted)
  })

  it('gives every registry component at least one related component', () => {
    for (const component of SHOWCASE_COMPONENTS) {
      expect(getRelatedComponents(component.slug).length).toBeGreaterThan(0)
    }
  })

  it('returns an empty list for an unknown slug', () => {
    expect(getRelatedComponents('does-not-exist')).toEqual([])
  })
})
