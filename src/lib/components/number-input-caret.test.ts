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
  instance = mount(NumberInput as unknown as Parameters<typeof mount>[0], {
    target,
    props: { ariaLabel: 'qty', ...props },
  })
  flushSync()
  return target.querySelector('input')!
}

// The focus handler defers the caret move one microtask so it lands after the
// browser's own placement.
const settle = () => Promise.resolve()

function click(element: HTMLElement): void {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

describe('NumberInput caret placement', () => {
  it('puts the caret after the value on focus when caretAtEnd is set', async () => {
    const input = await mountInput({ value: '123', caretAtEnd: true })
    input.setSelectionRange(0, 0)
    input.focus()
    await settle()
    expect(input.selectionStart).toBe(3)
    expect(input.selectionEnd).toBe(3)
  })

  it('puts the caret after the value on a click while already focused', async () => {
    const input = await mountInput({ value: '123', caretAtEnd: true })
    input.focus()
    await settle()
    // A click on a focused field fires no focus event; the click path still
    // moves the caret off the clicked position.
    input.setSelectionRange(0, 0)
    click(input)
    expect(input.selectionStart).toBe(3)
    expect(input.selectionEnd).toBe(3)
  })

  it('keeps the caret where the default mode puts it', async () => {
    const input = await mountInput({ value: '123' })
    input.focus()
    await settle()
    // Keyboard focus lands at the end; a click must not re-place it when
    // `caretAtEnd` is off.
    input.setSelectionRange(0, 0)
    click(input)
    expect(input.selectionStart).toBe(0)
  })
})
