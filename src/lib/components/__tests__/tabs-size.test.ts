import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './tabs-size.harness.svelte'

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
// Every --tabs-* metric rides the root div's inline style.
const styleOf = (): string => target.firstElementChild?.getAttribute('style') ?? ''
const num = (style: string, key: string): number => Number(new RegExp(`--tabs-${key}:\\s*([\\d.]+)`).exec(style)?.[1])

describe('Tabs dimension ratios', () => {
  it('keeps font, tab padding/radius, and nav chrome a constant ratio of the size', async () => {
    for (const name of Object.keys(AXIS) as (keyof typeof AXIS)[]) {
      const px = AXIS[name]
      if (instance) {
        await unmount(instance)
        instance = null
      }
      instance = mount(Harness, { target, props: { size: name } })
      flushSync()
      const style = styleOf()
      expect(num(style, 'font') / px).toBeCloseTo(0.875)
      expect(num(style, 'pad-x') / px).toBeCloseTo(0.75)
      expect(num(style, 'pad-y') / px).toBeCloseTo(0.5)
      expect(num(style, 'radius') / px).toBeCloseTo(0.5)
      expect(num(style, 'nav-pad') / px).toBeCloseTo(0.25)
      expect(num(style, 'nav-radius') / px).toBeCloseTo(0.75)
    }
  })

  it('scales continuously for a custom numeric size', () => {
    instance = mount(Harness, { target, props: { size: 20 } })
    flushSync()
    expect(num(styleOf(), 'font')).toBeCloseTo(17.5)
  })
})
