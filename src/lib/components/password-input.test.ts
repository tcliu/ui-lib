import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import PasswordInput from './PasswordInput.svelte'

// The toggle restores the selection on the next frame; capture the callbacks
// so the test can run them deterministically.
let frames: FrameRequestCallback[] = []

function installDomStubs(): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
  }))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
}

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  frames = []
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

function remount(props: { value: string }): void {
  instance = mount(PasswordInput, { target, props })
  flushSync()
}

function flushFrames(): void {
  const pending = frames
  frames = []
  for (const callback of pending) callback(0)
  flushSync()
}

const inputEl = (): HTMLInputElement => target.querySelector('input')!

// The shared Button cancels pointerdown's focus move, then the click toggles.
function clickToggle(label: string): HTMLButtonElement {
  const toggle = target.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
  const pointerDown = new MouseEvent('pointerdown', { bubbles: true, cancelable: true })
  toggle.dispatchEvent(pointerDown)
  // The field keeps focus because the button suppresses the browser's
  // pointer-down focus transfer.
  expect(pointerDown.defaultPrevented).toBe(true)
  toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  flushSync()
  flushFrames()
  return toggle
}

describe('PasswordInput visibility toggle', () => {
  it('keeps focus and the caret where they were when switching to plain text', () => {
    remount({ value: 'secret' })
    const input = inputEl()
    input.focus()
    input.setSelectionRange(3, 3)

    clickToggle('Show password')

    expect(input.type).toBe('text')
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(3)
    expect(input.selectionEnd).toBe(3)
  })

  it('keeps focus, a selected range, and its direction when hiding the value again', () => {
    remount({ value: 'secret' })
    const input = inputEl()
    input.focus()
    input.setSelectionRange(1, 5, 'backward')

    clickToggle('Show password')
    clickToggle('Hide password')

    expect(input.type).toBe('password')
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(1)
    expect(input.selectionEnd).toBe(5)
    expect(input.selectionDirection).toBe('backward')
  })

  it('leaves focus on the toggle when the field was not focused', () => {
    remount({ value: 'secret' })
    const input = inputEl()
    input.blur()
    const toggle = target.querySelector<HTMLButtonElement>('button[aria-label="Show password"]')!
    toggle.focus()

    clickToggle('Show password')

    expect(document.activeElement).toBe(toggle)
  })
})
