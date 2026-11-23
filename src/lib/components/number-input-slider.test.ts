import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import NumberInput from './NumberInput.svelte'

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

async function mountInput(props: Record<string, unknown> = {}): Promise<HTMLInputElement> {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(NumberInput as unknown as Parameters<typeof mount>[0], {
    target,
    props: { ariaLabel: 'qty', ...props },
  })
  flushSync()
  return target.querySelector('input')!
}

function range(): HTMLInputElement {
  return target.querySelector<HTMLInputElement>('input[type="range"]')!
}

function dragTo(value: number): void {
  const slider = range()
  slider.value = String(value)
  slider.dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
}

describe('NumberInput slider', () => {
  it('renders only when enabled and labels the range after the field', async () => {
    await mountInput({ value: '5' })
    expect(target.querySelector('input[type="range"]')).toBeNull()

    await mountInput({ value: '5', slider: true })
    expect(range().getAttribute('aria-label')).toBe('qty slider')
  })

  it('doubles the track from the current value', async () => {
    const input = await mountInput({ value: '100', min: 0, step: 1, slider: true })
    expect(Number(range().min)).toBe(0)
    expect(Number(range().max)).toBe(200)
    expect(input.value).toBe('100')
  })

  it('keeps the configured ceiling on the track', async () => {
    await mountInput({ value: '100', max: 150, slider: true })
    expect(Number(range().max)).toBe(150)
  })

  it('writes the dragged value back and reports it through oninput', async () => {
    const oninput = vi.fn()
    const input = await mountInput({ value: '100', min: 0, step: 1, slider: true, oninput })
    dragTo(150)
    expect(input.value).toBe('150')
    expect(oninput).toHaveBeenCalledTimes(1)
  })

  it('freezes the track for the whole drag so the mapping stays linear', async () => {
    const input = await mountInput({ value: '100', min: 0, step: 1, slider: true })
    const slider = range()
    slider.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    flushSync()

    dragTo(150)
    expect(input.value).toBe('150')
    expect(Number(range().max)).toBe(200)

    slider.dispatchEvent(new Event('pointerup', { bubbles: true }))
    flushSync()
    expect(Number(range().max)).toBe(300)
  })

  it('freezes the track while the range is keyboard-focused', async () => {
    const input = await mountInput({ value: '100', min: 0, step: 1, slider: true })
    const slider = range()
    slider.dispatchEvent(new Event('focus', { bubbles: true }))
    flushSync()

    dragTo(150)
    expect(input.value).toBe('150')
    expect(Number(range().max)).toBe(200)

    slider.dispatchEvent(new Event('blur', { bubbles: true }))
    flushSync()
    expect(Number(range().max)).toBe(300)
  })
})
