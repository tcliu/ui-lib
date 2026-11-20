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

async function mountInput(props: Record<string, unknown>): Promise<HTMLInputElement> {
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

function blur(input: HTMLInputElement): void {
  input.dispatchEvent(new Event('blur', { bubbles: true }))
  flushSync()
}

function stepUp(input: HTMLInputElement): void {
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
  flushSync()
}

// A written value keeps max(dp(step), dp(current value)) decimals.
describe('NumberInput written decimals', () => {
  it('pads a coarser value to the step fraction on blur', async () => {
    const input = await mountInput({ value: '1', step: 0.5 })
    blur(input)
    expect(input.value).toBe('1.0')
  })

  it('keeps digits a finer value already carries when stepping', async () => {
    const input = await mountInput({ value: '1.25', step: 0.5 })
    stepUp(input)
    expect(input.value).toBe('1.75')
  })

  it('keeps the entry fraction when the step snaps it on blur', async () => {
    const input = await mountInput({ value: '1.25', step: 0.5, min: 0 })
    blur(input)
    expect(input.value).toBe('1.50')
  })

  it('pads a clamp to the step fraction', async () => {
    const input = await mountInput({ value: '5', step: 0.5, min: 10 })
    blur(input)
    expect(input.value).toBe('10.0')
  })

  it('keeps a clamped value finer than the step at its own precision', async () => {
    const input = await mountInput({ value: '12.125', step: 0.5, max: 10.25 })
    blur(input)
    expect(input.value).toBe('10.250')
  })

  it('leaves an integer value whole under an integer step', async () => {
    const input = await mountInput({ value: '7', step: 1 })
    blur(input)
    expect(input.value).toBe('7')
  })

  it('steps an empty field onto the step fraction', async () => {
    const input = await mountInput({ value: '', step: 0.5 })
    stepUp(input)
    expect(input.value).toBe('0.5')
  })
})
