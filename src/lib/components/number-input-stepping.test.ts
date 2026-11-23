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

function press(
  input: HTMLInputElement,
  key: string,
  init: Pick<KeyboardEventInit, 'altKey' | 'shiftKey'> = {},
): void {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }))
  flushSync()
}

function clickStepper(direction: 'up' | 'down', init: MouseEventInit = {}): void {
  const label = direction === 'up' ? 'Increment' : 'Decrement'
  const button = target.querySelector(`button[aria-label="${label}"]`)!
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }))
  flushSync()
}

function wheel(input: HTMLInputElement, deltaY: number, init: WheelEventInit = {}): void {
  input.focus()
  flushSync()
  input.dispatchEvent(
    new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true, ...init }),
  )
  flushSync()
}

describe('NumberInput accelerated stepping', () => {
  it('steps one step without the modifier', async () => {
    const input = await mountInput({ value: '5' })
    press(input, 'ArrowUp')
    expect(input.value).toBe('6')
    press(input, 'ArrowDown')
    expect(input.value).toBe('5')
  })

  it('steps ten steps on Alt or Shift+ArrowUp/Down', async () => {
    const input = await mountInput({ value: '5' })
    press(input, 'ArrowUp', { altKey: true })
    expect(input.value).toBe('15')
    press(input, 'ArrowDown', { shiftKey: true })
    expect(input.value).toBe('5')
  })

  it('steps a hundred steps when both modifiers are held', async () => {
    const input = await mountInput({ value: '5' })
    press(input, 'ArrowUp', { altKey: true, shiftKey: true })
    expect(input.value).toBe('105')
    press(input, 'ArrowDown', { altKey: true, shiftKey: true })
    expect(input.value).toBe('5')
  })

  it('clamps an accelerated step to max and min', async () => {
    const input = await mountInput({ value: '95', min: 0, max: 100 })
    press(input, 'ArrowUp', { altKey: true })
    expect(input.value).toBe('100')
    press(input, 'ArrowDown', { altKey: true })
    expect(input.value).toBe('90')
  })

  it('keeps the step fraction on an accelerated step', async () => {
    const input = await mountInput({ value: '1', step: 0.5 })
    press(input, 'ArrowUp', { altKey: true })
    expect(input.value).toBe('6.0')
  })

  it('steps one step from a plain stepper click', async () => {
    await mountInput({ value: '5' })
    clickStepper('up')
    expect(target.querySelector('input')!.value).toBe('6')
    clickStepper('down')
    expect(target.querySelector('input')!.value).toBe('5')
  })

  it('steps a grouped value from its full amount instead of its leading digits', async () => {
    await mountInput({ value: '25,291.00', step: 1 })
    clickStepper('up')
    expect(target.querySelector('input')!.value).toBe('25292.00')
    clickStepper('down')
    expect(target.querySelector('input')!.value).toBe('25291.00')
  })

  it('keeps a grouped value on blur instead of truncating at the comma', async () => {
    const input = await mountInput({ value: '25,291.00', step: 1 })
    input.dispatchEvent(new Event('blur', { bubbles: true }))
    flushSync()
    expect(input.value).toBe('25291.00')
  })

  it('steps ten steps from a modified stepper click', async () => {
    await mountInput({ value: '5' })
    clickStepper('up', { shiftKey: true })
    expect(target.querySelector('input')!.value).toBe('15')
    clickStepper('down', { altKey: true })
    expect(target.querySelector('input')!.value).toBe('5')
  })

  it('steps a hundred steps from a both-modifier stepper click', async () => {
    await mountInput({ value: '5' })
    clickStepper('up', { altKey: true, shiftKey: true })
    expect(target.querySelector('input')!.value).toBe('105')
  })

  it('steps one notch of the wheel without the modifier', async () => {
    const input = await mountInput({ value: '5' })
    wheel(input, -100)
    expect(input.value).toBe('6')
  })

  it('steps ten steps on an Alt wheel notch', async () => {
    const input = await mountInput({ value: '5' })
    wheel(input, -100, { altKey: true })
    expect(input.value).toBe('15')
    wheel(input, 100, { altKey: true })
    expect(input.value).toBe('5')
  })

  it('reads the horizontal delta a Shift wheel reports', async () => {
    const input = await mountInput({ value: '5' })
    wheel(input, 0, { deltaX: -100, shiftKey: true })
    expect(input.value).toBe('15')
    wheel(input, 0, { deltaX: 100, shiftKey: true })
    expect(input.value).toBe('5')
  })

  it('steps a hundred steps on an Alt+Shift wheel notch', async () => {
    const input = await mountInput({ value: '5' })
    wheel(input, 0, { deltaX: -100, altKey: true, shiftKey: true })
    expect(input.value).toBe('105')
  })

  it('leaves an unmodified horizontal wheel to the browser', async () => {
    const input = await mountInput({ value: '5' })
    wheel(input, 0, { deltaX: -100 })
    expect(input.value).toBe('5')
  })
})
