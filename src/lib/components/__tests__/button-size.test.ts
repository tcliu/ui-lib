import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Button from '../Button.svelte'
import { dimensionMetrics, resolveSize } from '../size-metrics'

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
const num = (style: string, key: string): number => Number(new RegExp(`--btn-${key}:\\s*([\\d.]+)`).exec(style)?.[1])

describe('size-metrics', () => {
  it('resolves names and numbers to the dimension', () => {
    expect(resolveSize('xs')).toBe(12)
    expect(resolveSize('lg')).toBe(18)
    expect(resolveSize(15)).toBe(15)
    expect(resolveSize(0)).toBe(1)
    expect(resolveSize(Number.NaN)).toBe(16)
  })

  it('scales every metric by one constant ratio (no anchor table)', () => {
    expect(dimensionMetrics(20, { font: 0.65, pad: 0.5 })).toEqual({ font: 13, pad: 10 })
    const atLg = dimensionMetrics(24, { font: 0.65, pad: 0.5 })
    expect(atLg.pad).toBe(12)
    expect(atLg.font).toBeCloseTo(15.6)
  })
})

describe('Button dimension ratios', () => {
  it('keeps font, padding, radius, and icon a constant ratio of the size', async () => {
    for (const name of Object.keys(AXIS) as (keyof typeof AXIS)[]) {
      const px = AXIS[name]
      if (instance) {
        await unmount(instance)
        instance = null
      }
      instance = mount(Button, { target, props: { size: name } })
      flushSync()
      const style = target.querySelector('button')?.getAttribute('style') ?? ''
      expect(num(style, 'font') / px).toBeCloseTo(0.8125)
      expect(num(style, 'pad-x') / px).toBeCloseTo(0.75)
      expect(num(style, 'pad-y') / px).toBeCloseTo(0.5)
      expect(num(style, 'radius') / px).toBeCloseTo(0.375)
      expect(num(style, 'icon') / px).toBeCloseTo(1)
      // Icon-only padding keeps its box the text row height: icon + 2·iconPad
      // equals line + 2·padY, so the glyph square is never shorter.
      const icon = num(style, 'icon')
      const line = num(style, 'line')
      const padY = num(style, 'pad-y')
      expect(num(style, 'icon-pad')).toBeCloseTo(padY + (line - icon) / 2)
    }
  })

  it('keeps an interpolated size below the exact step above it', async () => {
    instance = mount(Button, { target, props: { size: 15 } })
    flushSync()
    const s15 = target.querySelector('button')?.getAttribute('style') ?? ''
    await unmount(instance)
    instance = mount(Button, { target, props: { size: 16 } })
    flushSync()
    const s16 = target.querySelector('button')?.getAttribute('style') ?? ''
    expect(num(s15, 'font')).toBe(12.1875)
    expect(num(s16, 'font')).toBe(13)
  })
})
