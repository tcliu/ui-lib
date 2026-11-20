import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRawSnippet, flushSync, mount, unmount } from 'svelte'
import Button, { BUTTON_METRICS, BUTTON_RATIOS } from './Button.svelte'
import { ICON_RATIO } from '#lib/size-scale.js'
import { INPUT_RATIOS } from './input-chrome'
import { dimensionMetrics, iconPadRatio, resolveSize } from './size-metrics'

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

  it('derives the icon-only padding from the row geometry', () => {
    expect(iconPadRatio({ padY: 0.5, line: 1.1607, icon: 1 })).toBeCloseTo(0.58035)
    expect(iconPadRatio({ padY: 0.45, line: 1.1607, icon: 1 })).toBeCloseTo(0.53035)
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
      expect(num(style, 'font') / px).toBeCloseTo(BUTTON_RATIOS.font)
      expect(num(style, 'pad-x') / px).toBeCloseTo(0.65)
      expect(num(style, 'pad-y') / px).toBeCloseTo(0.45)
      expect(num(style, 'radius') / px).toBeCloseTo(0.375)
      // The padded box equals the text field's row box.
      expect(num(style, 'line') + 2 * num(style, 'pad-y')).toBeCloseTo(px * (INPUT_RATIOS.line + 2 * INPUT_RATIOS.padY))
      expect(num(style, 'icon') / px).toBeCloseTo(1)
      // Icon-only padding keeps its box the text row height: icon + 2·iconPad
      // equals line + 2·padY, so the glyph square is never shorter.
      const icon = num(style, 'icon')
      const line = num(style, 'line')
      const padY = num(style, 'pad-y')
      expect(num(style, 'icon-pad')).toBeCloseTo(padY + (line - icon) / 2)
    }
  })

  it('pins the padded box to the text field row box', () => {
    // Both boxes carry the same 1px border, so equal line + padding is equal
    // height beside a TextInput at every size.
    expect(BUTTON_RATIOS.line + 2 * BUTTON_RATIOS.padY).toBeCloseTo(INPUT_RATIOS.line + 2 * INPUT_RATIOS.padY)
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


describe('Button label optical alignment', () => {
  const icon = createRawSnippet(() => ({ render: () => '<span data-icon></span>' }))
  const label = createRawSnippet(() => ({ render: () => '<span>Apply</span>' }))

  it('shifts the label row by the nudge and counter-shifts the icon', () => {
    instance = mount(Button, { target, props: { icon, children: label } })
    flushSync()
    const button = target.querySelector('button')!
    const style = button.getAttribute('style') ?? ''
    expect(num(style, 'label-nudge')).toBeCloseTo(BUTTON_RATIOS.labelNudge * 16)
    const row = button.querySelector(':scope > span')!
    expect(row.className).toContain('translate-y-[var(--btn-label-nudge)]')
    const iconBox = row.querySelector(':scope > span')!
    expect(iconBox.className).toContain('-translate-y-[var(--btn-label-nudge)]')
  })

  it('shifts a text-only label by the same nudge', () => {
    if (instance) {
      unmount(instance)
      instance = null
    }
    instance = mount(Button, { target, props: { children: label } })
    flushSync()
    const wrapper = target.querySelector('button > span')!
    expect(wrapper.className).toContain('translate-y-[var(--btn-label-nudge)]')
  })
})


describe('Button icon-only glyph', () => {
  const icon = createRawSnippet(() => ({ render: () => '<span data-icon></span>' }))
  const label = createRawSnippet(() => ({ render: () => '<span>Apply</span>' }))

  it('renders 15% larger than the shared glyph ratio', () => {
    expect(BUTTON_METRICS.iconOnlyGlyph).toBeCloseTo(ICON_RATIO * 1.15)
    instance = mount(Button, { target, props: { icon, size: 'md' } })
    flushSync()
    const style = target.querySelector('button')?.getAttribute('style') ?? ''
    expect(num(style, 'glyph')).toBeCloseTo(ICON_RATIO * 16)
    expect(num(style, 'icon-only-glyph')).toBeCloseTo(ICON_RATIO * 1.15 * 16)
    // The slot is unchanged, so the button box is untouched.
    expect(num(style, 'icon')).toBe(16)
  })

  it('uses the icon-only glyph only when no label is present', () => {
    instance = mount(Button, { target, props: { icon, size: 'md' } })
    flushSync()
    expect(target.querySelector('button span')?.className).toContain('--btn-icon-only-glyph')

    if (instance) {
      unmount(instance)
      instance = null
    }
    instance = mount(Button, { target, props: { icon, children: label } })
    flushSync()
    const row = target.querySelector('button > span')!
    const iconBox = row.querySelector(':scope > span')!
    expect(iconBox.className).toContain('--btn-glyph')
    expect(iconBox.className).not.toContain('--btn-icon-only-glyph')
  })
})
