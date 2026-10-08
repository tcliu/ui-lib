import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import SearchInput from '../SearchInput.svelte'

function installDomStubs(): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
  }))
}

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  installDomStubs()
  target = document.createElement('div')
  document.body.appendChild(target)
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  target.remove()
  vi.unstubAllGlobals()
})

const AXIS = { xs: 12, sm: 16, md: 20, lg: 24 } as const
const styleOf = (): string => target.querySelector('.relative')?.getAttribute('style') ?? ''
const num = (style: string, key: string): number => Number(new RegExp(`--search-${key}:\\s*([\\d.]+)`).exec(style)?.[1])

describe('SearchInput dimension ratios', () => {
  it('keeps font, padding, radius, icon, and offset a constant ratio of the size', async () => {
    for (const name of Object.keys(AXIS) as (keyof typeof AXIS)[]) {
      const px = AXIS[name]
      if (instance) {
        await unmount(instance)
        instance = null
      }
      instance = mount(SearchInput, { target, props: { value: '', ariaLabel: 'Search', size: name } })
      flushSync()
      const style = styleOf()
      expect(num(style, 'font') / px).toBeCloseTo(0.8125)
      expect(num(style, 'pad-y') / px).toBeCloseTo(0.375)
      expect(num(style, 'pad-left') / px).toBeCloseTo(1.75)
      expect(num(style, 'pad-right') / px).toBeCloseTo(0.5)
      expect(num(style, 'icon-left') / px).toBeCloseTo(0.5)
      expect(num(style, 'radius') / px).toBeCloseTo(0.375)
      // The icon glyph is the dimension itself.
      expect(Number(target.querySelector('svg')?.getAttribute('width')) / px).toBe(1)
    }
  })
})
