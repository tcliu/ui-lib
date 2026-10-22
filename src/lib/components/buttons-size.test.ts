import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import type { SizeInput } from '$lib/size-scale'
import Buttons from './Buttons.svelte'

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  target = document.createElement('div')
  document.body.appendChild(target)
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  target.remove()
})

const AXIS = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 } as const

// Every --buttons-* metric rides the row's inline style.
const styleOf = (): string => target.firstElementChild?.getAttribute('style') ?? ''
const num = (style: string, key: string): number =>
  Number(new RegExp(`--buttons-${key}:\\s*([\\d.]+)`).exec(style)?.[1])

async function render(size: SizeInput): Promise<string> {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(Buttons, { target, props: { size } })
  flushSync()
  return styleOf()
}

describe('Buttons gap metric', () => {
  it('keeps the gap a constant ratio of the size dimension', async () => {
    for (const name of Object.keys(AXIS) as (keyof typeof AXIS)[]) {
      const px = AXIS[name]
      const style = await render(name)
      expect(num(style, 'gap') / px).toBeCloseTo(0.5)
    }
  })

  it('lands on the gap-2 step (8px) at md', async () => {
    expect(num(await render('md'), 'gap')).toBeCloseTo(8)
  })

  it('scales continuously for a custom numeric size', async () => {
    expect(num(await render(20), 'gap')).toBeCloseTo(10)
  })

  it('falls back to md for non-finite input without emitting undefined', async () => {
    const style = await render(Number.NaN)
    expect(num(style, 'gap')).toBeCloseTo(8)
    expect(style).not.toContain('undefined')
  })

  it('drives the default row gap from the size metric', async () => {
    await render('lg')
    expect(target.firstElementChild?.className).toContain('gap-[var(--buttons-gap)]')
  })
})
