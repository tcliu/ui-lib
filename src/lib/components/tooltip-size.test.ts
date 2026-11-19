import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Button from './Button.svelte'
import Chip from './Chip.svelte'
import Harness from './tooltip.harness.svelte'
import { SIZE_PX, type SizeInput } from '#lib/size-scale.js'

// A tooltip renders only after a hover/focus gesture, and it portals to
// document.body, so each case mounts, drives the gesture, then reads the
// portalled box's inline metric set. jsdom lacks matchMedia and rAF.
function installDomStubs(): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
  }))
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
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

async function mountInto(component: unknown, props: Record<string, unknown>, trigger: () => HTMLElement | null) {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(component as Parameters<typeof mount>[0], { target, props })
  flushSync()
  trigger()?.dispatchEvent(new MouseEvent('mouseenter'))
  flushSync()
}

const tipEl = (): HTMLElement | null => document.querySelector('[role="tooltip"]')
const tipStyle = (): string => tipEl()?.getAttribute('style') ?? ''
const metric = (style: string, key: string): number =>
  Number(new RegExp(`--tip-${key}:\\s*([\\d.]+)`).exec(style)?.[1])

describe('Tooltip dimension ratios', () => {
  it('keeps font, line, padding, and radius a constant ratio of the size', async () => {
    for (const [name, px] of Object.entries(SIZE_PX) as [SizeInput, number][]) {
      await mountInto(Harness, { mode: 'explicit', size: name }, () => target.querySelector('button'))
      const style = tipStyle()
      expect(metric(style, 'font') / px).toBeCloseTo(0.75)
      expect(metric(style, 'line') / px).toBeCloseTo(1)
      expect(metric(style, 'pad-x') / px).toBeCloseTo(0.5)
      expect(metric(style, 'pad-y') / px).toBeCloseTo(0.25)
      expect(metric(style, 'radius') / px).toBeCloseTo(0.25)
    }
  })

  it('reproduces the original md box', async () => {
    await mountInto(Harness, { mode: 'explicit' }, () => target.querySelector('button'))
    const style = tipStyle()
    // 12px font on a 16px line, `px-2 py-1` padding, and the `rounded` radius.
    expect(metric(style, 'font')).toBe(12)
    expect(metric(style, 'line')).toBe(16)
    expect(metric(style, 'pad-x')).toBe(8)
    expect(metric(style, 'pad-y')).toBe(4)
    expect(metric(style, 'radius')).toBe(4)
  })

  it('accepts a numeric size', async () => {
    await mountInto(Harness, { mode: 'explicit', size: 22 }, () => target.querySelector('button'))
    expect(metric(tipStyle(), 'font')).toBeCloseTo(16.5)
  })
})

describe('Tooltip scale forwarding', () => {
  it('follows a Button size', async () => {
    await mountInto(Button, { tooltip: 'tip', size: 'lg' }, () => target.querySelector('span.group'))
    expect(metric(tipStyle(), 'font')).toBeCloseTo(SIZE_PX.lg * 0.75)
  })

  it('follows a Chip size', async () => {
    await mountInto(Chip, { label: 'tag', tooltip: 'tip', size: 'lg' }, () => target.firstElementChild as HTMLElement)
    expect(metric(tipStyle(), 'font')).toBeCloseTo(SIZE_PX.lg * 0.75)
  })
})
