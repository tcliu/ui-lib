import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import TagInput from '../TagInput.svelte'

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
// Every --tag-* metric rides the container's inline style, so read it there.
const styleOf = (): string => target.firstElementChild?.getAttribute('style') ?? ''
const num = (style: string, name: string): number => Number(new RegExp(`--${name}:\\s*([\\d.]+)`).exec(style)?.[1])

describe('TagInput dimension ratios', () => {
  it('keeps font, line, padding, and gap a constant ratio of the size', async () => {
    for (const name of Object.keys(AXIS) as (keyof typeof AXIS)[]) {
      const px = AXIS[name]
      if (instance) {
        await unmount(instance)
        instance = null
      }
      instance = mount(TagInput, { target, props: { value: ['svelte'], options: [], size: name } })
      flushSync()
      const style = styleOf()
      expect(num(style, 'tag-font') / px).toBeCloseTo(0.875)
      expect(num(style, 'tag-line') / px).toBeCloseTo(1.25)
      expect(num(style, 'tag-pad-x') / px).toBeCloseTo(0.625)
      expect(num(style, 'tag-pad-y') / px).toBeCloseTo(0.375)
      expect(num(style, 'tag-gap') / px).toBeCloseTo(0.375)
      expect(num(style, 'tag-input-pad-y') / px).toBeCloseTo(0.125)
      // The built-in chip sizes itself from the same dimension.
      const chip = target.querySelector<HTMLElement>('[style*="--chip-font"]')
      expect(num(chip?.getAttribute('style') ?? '', 'chip-font') / px).toBeCloseTo(0.75)
    }
  })

  it('scales continuously for a custom numeric size', () => {
    instance = mount(TagInput, { target, props: { value: [], options: [], size: 20 } })
    flushSync()
    expect(num(styleOf(), 'tag-font')).toBeCloseTo(17.5)
  })
})
