import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { caretAtEndOnKeyboardFocus } from './caret-at-end-on-keyboard-focus'

let frames: FrameRequestCallback[] = []

// The caret fix is deferred one frame; run the queued callbacks on demand so a
// test asserts the settled state instead of racing the browser's clock.
function flushFrames() {
  const queued = frames
  frames = []
  for (const callback of queued) callback(0)
}

beforeEach(() => {
  frames = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames[id - 1] = () => {}
  })
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function setup(tag: 'input' | 'textarea' = 'input', value = 'hello') {
  const container = document.createElement('div')
  const field = document.createElement(tag)
  field.value = value
  container.appendChild(field)
  document.body.appendChild(container)
  const action = caretAtEndOnKeyboardFocus(container)
  return { container, field, destroy: action.destroy }
}

describe('caretAtEndOnKeyboardFocus', () => {
  it('places the caret at the end of the value on keyboard focus', () => {
    const { field, destroy } = setup()
    field.setSelectionRange(2, 2)
    field.focus()
    flushFrames()
    expect(field.selectionStart).toBe(field.value.length)
    expect(field.selectionEnd).toBe(field.value.length)
    destroy()
  })

  it('collapses a whole-value selection to the end', () => {
    const { field, destroy } = setup()
    field.setSelectionRange(0, field.value.length)
    field.focus()
    flushFrames()
    expect(field.selectionStart).toBe(field.value.length)
    destroy()
  })

  it('leaves a partial selection alone', () => {
    const { field, destroy } = setup()
    field.setSelectionRange(1, 3)
    field.focus()
    flushFrames()
    expect(field.selectionStart).toBe(1)
    expect(field.selectionEnd).toBe(3)
    destroy()
  })

  it('keeps the natural caret placement when focused by pointer', () => {
    const { container, field, destroy } = setup()
    field.setSelectionRange(0, 0)
    container.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    field.focus()
    flushFrames()
    expect(field.selectionStart).toBe(0)
    expect(field.selectionEnd).toBe(0)
    destroy()
  })

  it('keeps the tap caret when a touch focuses the field after the press', () => {
    let now = 1000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const { container, field, destroy } = setup()
    field.setSelectionRange(2, 2)
    container.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    // Touch focus lands after `touchend`, in a later task than the press.
    now += 250
    field.focus()
    flushFrames()
    expect(field.selectionStart).toBe(2)
    destroy()
  })

  it('treats a focus long after a press as keyboard focus', () => {
    let now = 1000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const { container, field, destroy } = setup()
    field.setSelectionRange(2, 2)
    container.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    now += 2000
    field.focus()
    flushFrames()
    expect(field.selectionStart).toBe(field.value.length)
    destroy()
  })

  it('covers a textarea as well as an input', () => {
    const { field, destroy } = setup('textarea')
    field.setSelectionRange(0, 0)
    field.focus()
    flushFrames()
    expect(field.selectionStart).toBe(field.value.length)
    destroy()
  })

  it('ignores a disabled field', () => {
    const { field, destroy } = setup()
    field.disabled = true
    field.setSelectionRange(0, 0)
    field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    flushFrames()
    expect(field.selectionStart).toBe(0)
    destroy()
  })

  it('stops placing the caret after the action is destroyed', () => {
    const { field, destroy } = setup()
    destroy()
    field.setSelectionRange(0, 0)
    field.focus()
    flushFrames()
    expect(field.selectionStart).toBe(0)
    expect(field.selectionEnd).toBe(0)
  })
})

describe('caretAtEndOnKeyboardFocus without selection support', () => {
  it('does not throw for an input type that cannot hold a selection', () => {
    const container = document.createElement('div')
    const field = document.createElement('input')
    field.type = 'email'
    field.value = 'a@b.c'
    container.appendChild(field)
    document.body.appendChild(container)
    const action = caretAtEndOnKeyboardFocus(container)
    expect(() => {
      field.focus()
      flushFrames()
    }).not.toThrow()
    action.destroy()
  })
})
