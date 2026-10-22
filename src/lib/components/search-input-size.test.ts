import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import SearchInput from './SearchInput.svelte'

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

const AXIS = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 } as const
// The input box rides TextInput's shared `--input-*` metrics; the wrapper adds
// the search icon's gutter metrics, so read both.
const styleOf = (): string =>
  `${target.querySelector('input')?.getAttribute('style') ?? ''};${target.querySelector('.relative')?.getAttribute('style') ?? ''}`
const num = (style: string, name: string): number => Number(new RegExp(`--${name}:\\s*([\\d.]+)`).exec(style)?.[1])

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
      expect(num(style, 'input-font') / px).toBeCloseTo(0.8125)
      expect(num(style, 'input-pad-y') / px).toBeCloseTo(0.39375)
      expect(num(style, 'input-pad-x') / px).toBeCloseTo(0.5625)
      expect(num(style, 'input-radius') / px).toBeCloseTo(0.375)
      expect(num(style, 'search-pad-left') / px).toBeCloseTo(1.8)
      expect(num(style, 'search-icon-left') / px).toBeCloseTo(0.6)
      // The search icon trims the icon slot, so its glyph rides 0.9× the
      // shared icon ratio of the dimension.
      expect(Number(target.querySelector('svg')?.getAttribute('width')) / px).toBeCloseTo(0.73125)
    }
  })
})
