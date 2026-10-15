import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import TextInput from '../TextInput.svelte'

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
const styleOf = (): string => target.querySelector('input')?.getAttribute('style') ?? ''
const num = (style: string, key: string): number => Number(new RegExp(`--input-${key}:\\s*([\\d.]+)`).exec(style)?.[1])

describe('TextInput dimension ratios', () => {
  it('keeps font, padding, and radius a constant ratio of the size', async () => {
    for (const name of Object.keys(AXIS) as (keyof typeof AXIS)[]) {
      const px = AXIS[name]
      if (instance) {
        await unmount(instance)
        instance = null
      }
      instance = mount(TextInput, { target, props: { value: '', ariaLabel: 'Name', size: name } })
      flushSync()
      const style = styleOf()
      expect(num(style, 'font') / px).toBeCloseTo(0.8125)
      expect(num(style, 'pad-x') / px).toBeCloseTo(0.625)
      expect(num(style, 'pad-y') / px).toBeCloseTo(0.4375)
      expect(num(style, 'radius') / px).toBeCloseTo(0.375)
      expect(target.querySelector('input')?.className).toContain('text-[length:var(--input-font)]')
    }
  })

  it('lets an inputClass override replace the metrics', async () => {
    instance = mount(TextInput, { target, props: { value: '', ariaLabel: 'Name', size: 14, inputClass: 'w-40 px-1' } })
    flushSync()
    expect(target.querySelector('input')?.className).toContain('w-40 px-1')
    expect(target.querySelector('input')?.className).not.toContain('var(--input-font)')
  })
})
