import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import ClearButton from './ClearButton.svelte'
import { TEXT_INPUT_RATIOS, resolveClearMetrics } from './text-input-metrics'

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

const metric = (style: string, name: string): number =>
  Number(new RegExp(`--${name}:\\s*([\\d.]+)`).exec(style)?.[1])

describe('ClearButton', () => {
  it('matches the clearable field cross at every size step', async () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      if (instance) {
        await unmount(instance)
        instance = null
      }
      instance = mount(ClearButton, { target, props: { size, onClick: () => {} } })
      flushSync()
      const wrapper = target.querySelector('span')!
      const style = wrapper.getAttribute('style') ?? ''
      const expected = resolveClearMetrics(size, TEXT_INPUT_RATIOS.padX, TEXT_INPUT_RATIOS)
      expect(metric(style, 'clear-box')).toBe(expected.box)
      expect(metric(style, 'clear-gutter')).toBe(expected.gutter)
      const button = target.querySelector('button')!
      expect(button.className).toContain('size-[var(--clear-box)]')
      expect(metric(button.getAttribute('style') ?? '', 'btn-glyph')).toBeCloseTo(expected.button * 0.8125)
    }
  })

  it('defaults its accessible name to the shared clear label', async () => {
    instance = mount(ClearButton, { target, props: { onClick: () => {} } })
    flushSync()
    expect(target.querySelector('button')?.getAttribute('aria-label')).toBe('Clear')
  })

  it('uses a caller label and honors disabled', async () => {
    instance = mount(ClearButton, {
      target,
      props: { ariaLabel: 'Clear tag filters', disabled: true, onClick: () => {} },
    })
    flushSync()
    const button = target.querySelector('button')!
    expect(button.getAttribute('aria-label')).toBe('Clear tag filters')
    expect(button.disabled).toBe(true)
  })
})
