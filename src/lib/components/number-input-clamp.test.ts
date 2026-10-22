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

// jsdom has no user agent typing: set the field and fire the input event the
// component listens on, which is what one keystroke produces.
function type(input: HTMLInputElement, text: string): void {
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
}

function blur(input: HTMLInputElement): void {
  input.dispatchEvent(new Event('blur', { bubbles: true }))
  flushSync()
}

describe('NumberInput typing clamp', () => {
  it('clamps an entry that goes past the max', async () => {
    const input = await mountInput({ value: '', max: 10 })
    type(input, '2')
    expect(input.value).toBe('2')
    type(input, '25')
    expect(input.value).toBe('10')
  })

  it('clamps a negative entry that goes below the min', async () => {
    const input = await mountInput({ value: '', min: -3 })
    type(input, '-5')
    expect(input.value).toBe('-3')
  })

  it('leaves a positive prefix under the min while a longer entry could still fit', async () => {
    const input = await mountInput({ value: '', min: 10 })
    // `50` is a valid continuation, so the entry is untouched while typing and
    // the clamp lands on blur.
    type(input, '5')
    expect(input.value).toBe('5')
    blur(input)
    expect(input.value).toBe('10')
  })

  it('clamps a positive entry under the min once the next digit must overshoot the max', async () => {
    const input = await mountInput({ value: '', min: 5, max: 10 })
    // The entry can never come back into range, so it clamps as it is typed.
    type(input, '2')
    expect(input.value).toBe('5')
  })

  it('keeps an in-range entry untouched', async () => {
    const input = await mountInput({ value: '', min: 0, max: 10 })
    type(input, '7')
    expect(input.value).toBe('7')
  })

  it('clamps a decimal entry against a fractional max', async () => {
    const input = await mountInput({ value: '', max: 10.5, step: 0.5 })
    type(input, '11')
    expect(input.value).toBe('10.5')
  })
})
