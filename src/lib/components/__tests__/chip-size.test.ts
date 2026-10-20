import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Chip from '../Chip.svelte'
import { resolveIconPx } from '$lib/icons/icon-size'

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
// Every --chip-* metric rides the root span's inline style.
const styleOf = (): string => target.firstElementChild?.getAttribute('style') ?? ''
const num = (style: string, key: string): number => Number(new RegExp(`--chip-${key}:\\s*([\\d.]+)`).exec(style)?.[1])

describe('Chip dimension ratios', () => {
  it('keeps font, line, padding, gap, and the remove cross a constant ratio of the size', async () => {
    for (const name of Object.keys(AXIS) as (keyof typeof AXIS)[]) {
      const px = AXIS[name]
      if (instance) {
        await unmount(instance)
        instance = null
      }
      instance = mount(Chip, { target, props: { label: 'tag', chipClass: 'rounded-full', size: name, onRemove: () => {} } })
      flushSync()
      const style = styleOf()
      expect(num(style, 'font') / px).toBeCloseTo(0.75)
      expect(num(style, 'line') / px).toBeCloseTo(1)
      expect(num(style, 'pad-x') / px).toBeCloseTo(0.5)
      expect(num(style, 'pad-y') / px).toBeCloseTo(0.125)
      expect(num(style, 'gap') / px).toBeCloseTo(0.25)
      expect(num(style, 'icon') / px).toBeCloseTo(0.75)
      // The remove cross renders at the shared icon ratio of the chip's slot.
      expect(Number(target.querySelector('svg')?.getAttribute('width'))).toBeCloseTo(resolveIconPx(px * 0.75))
    }
  })

  it('scales continuously for a custom numeric size', () => {
    instance = mount(Chip, { target, props: { label: 'tag', chipClass: 'rounded-full', size: 20 } })
    flushSync()
    expect(num(styleOf(), 'font')).toBeCloseTo(15)
  })

  it('falls back to md for non-finite input without emitting undefined', () => {
    instance = mount(Chip, { target, props: { label: 'tag', chipClass: 'rounded-full', size: Number.NaN } })
    flushSync()
    expect(num(styleOf(), 'font')).toBeCloseTo(12)
    expect(styleOf()).not.toContain('undefined')
  })
})
