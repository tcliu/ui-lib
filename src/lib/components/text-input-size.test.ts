import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import { INPUT_RATIOS } from './input-chrome'
import TextInput from './TextInput.svelte'
import { TEXT_INPUT_RATIOS } from './text-input-metrics'

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
      expect(num(style, 'font') / px).toBeCloseTo(TEXT_INPUT_RATIOS.font)
      expect(num(style, 'line') / px).toBeCloseTo(INPUT_RATIOS.line)
      expect(num(style, 'pad-x') / px).toBeCloseTo(0.5625)
      expect(num(style, 'pad-y') / px).toBeCloseTo(0.39375)
      expect(num(style, 'radius') / px).toBeCloseTo(0.375)
      expect(target.querySelector('input')?.className).toContain('text-[length:var(--input-font)]')
    }
  })

  it('merges a partial ratios override over the shared defaults', async () => {
    instance = mount(TextInput, {
      target,
      props: { value: '', ariaLabel: 'Name', size: 16, ratios: { font: 0.5, padX: 0.75 } },
    })
    flushSync()
    const style = styleOf()
    expect(num(style, 'font')).toBeCloseTo(8)
    expect(num(style, 'line')).toBeCloseTo(8 * (INPUT_RATIOS.line / INPUT_RATIOS.font))
    expect(num(style, 'pad-x')).toBeCloseTo(12)
    expect(num(style, 'pad-y')).toBeCloseTo(16 * TEXT_INPUT_RATIOS.padY)
  })

  it('carries the line box with an overridden font', async () => {
    instance = mount(TextInput, {
      target,
      props: { value: '', ariaLabel: 'Name', size: 16, ratios: { font: 0.5 } },
    })
    flushSync()
    const style = styleOf()
    // Height follows the font: the leading share is fixed, so the line scales
    // with it instead of staying on the shared default line.
    expect(num(style, 'line') / num(style, 'font')).toBeCloseTo(INPUT_RATIOS.line / INPUT_RATIOS.font)
    expect(num(style, 'line')).not.toBeCloseTo(16 * INPUT_RATIOS.line)
  })

  it('derives the clear inset from an overridden padX', async () => {
    instance = mount(TextInput, {
      target,
      props: {
        value: 'x',
        ariaLabel: 'Name',
        size: 16,
        clearable: true,
        ratios: { padX: 0.75, clearButton: 0.5 },
      },
    })
    flushSync()
    const style = Array.from(target.querySelectorAll('[style]'))
      .map(element => element.getAttribute('style') ?? '')
      .join(';')
    expect(Number(/--clear-inset:\s*([\d.]+)/.exec(style)?.[1])).toBeCloseTo(12)
    expect(Number(/--clear-button:\s*([\d.]+)/.exec(style)?.[1])).toBeCloseTo(8)
  })

  it('lets an inputClass override replace the metrics', async () => {
    instance = mount(TextInput, { target, props: { value: '', ariaLabel: 'Name', size: 14, inputClass: 'w-40 px-1' } })
    flushSync()
    expect(target.querySelector('input')?.className).toContain('w-40 px-1')
    expect(target.querySelector('input')?.className).not.toContain('var(--input-font)')
  })
})

describe('TextInput chrome variants', () => {
  it('keeps the shared chrome by default', async () => {
    instance = mount(TextInput, { target, props: { value: '', ariaLabel: 'Name', size: 14 } })
    flushSync()
    const className = target.querySelector('input')?.className ?? ''
    expect(className).toContain('border-slate-700')
    expect(className).toContain('var(--input-font)')
  })

  it('drops the chrome for a field embedded in another surface', async () => {
    instance = mount(TextInput, { target, props: { value: '', ariaLabel: 'Name', size: 14, variant: 'embedded' } })
    flushSync()
    const className = target.querySelector('input')?.className ?? ''
    expect(className).toContain('bg-transparent')
    expect(className).toContain('outline-none')
    // The container owns the border, the background, and the metrics.
    expect(className).not.toContain('border-slate-700')
    expect(className).not.toContain('var(--input-font)')
  })

  it('drops only the outline while keeping the surface and metrics', async () => {
    instance = mount(TextInput, {
      target,
      props: { value: '', ariaLabel: 'Name', size: 14, hideOutline: true },
    })
    flushSync()
    const className = target.querySelector('input')?.className ?? ''
    expect(className).not.toContain('border-slate-700')
    expect(className).not.toContain('focus:border-cyan-500')
    expect(className).toContain('bg-slate-950')
    expect(className).toContain('var(--input-font)')
  })

  it('appends the caller classes to the embedded base', async () => {
    instance = mount(TextInput, {
      target,
      props: { value: '', ariaLabel: 'Name', size: 14, variant: 'embedded', className: 'font-mono' },
    })
    flushSync()
    const className = target.querySelector('input')?.className ?? ''
    expect(className).toContain('bg-transparent')
    expect(className).toContain('font-mono')
  })
})
