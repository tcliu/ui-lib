import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCaretAtEnd } from './use-caret-at-end.svelte'

let frames: FrameRequestCallback[] = []

function flushFrames() {
  const queued = frames
  frames = []
  for (const callback of queued) callback(0)
}

function setup(options: { focused?: boolean; type?: string; value?: string } = {}) {
  const field = document.createElement('input')
  field.type = options.type ?? 'text'
  field.value = options.value ?? 'hello'
  document.body.appendChild(field)
  field.focus()
  let focused = options.focused ?? true
  const caret = useCaretAtEnd({
    element: () => field,
    focused: () => focused,
  })
  return { field, caret, setFocused: (next: boolean) => (focused = next) }
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
})

describe('useCaretAtEnd', () => {
  it('places the caret at the end of the value', () => {
    const { field, caret } = setup()
    field.setSelectionRange(2, 2)
    caret.placeCaretAtEnd()
    flushFrames()
    expect(field.selectionStart).toBe(field.value.length)
  })

  it('collapses a whole-value selection to the end', () => {
    const { field, caret } = setup()
    field.setSelectionRange(0, field.value.length)
    caret.placeCaretAtEnd()
    flushFrames()
    expect(field.selectionStart).toBe(field.value.length)
  })

  it('leaves a partial selection alone', () => {
    const { field, caret } = setup()
    field.setSelectionRange(1, 3)
    caret.placeCaretAtEnd()
    flushFrames()
    expect(field.selectionStart).toBe(1)
    expect(field.selectionEnd).toBe(3)
  })

  it('backs off when the selection changed before the frame landed', () => {
    const { field, caret } = setup()
    field.setSelectionRange(5, 5)
    caret.placeCaretAtEnd()
    field.setSelectionRange(0, 3)
    flushFrames()
    expect(field.selectionStart).toBe(0)
    expect(field.selectionEnd).toBe(3)
  })

  it('backs off when the control lost focus', () => {
    const { field, caret, setFocused } = setup()
    field.setSelectionRange(2, 2)
    caret.placeCaretAtEnd()
    setFocused(false)
    flushFrames()
    expect(field.selectionStart).toBe(2)
  })

  it('drops a pending fix on cancel', () => {
    const { field, caret } = setup()
    field.setSelectionRange(2, 2)
    caret.placeCaretAtEnd()
    caret.cancel()
    flushFrames()
    expect(field.selectionStart).toBe(2)
  })

  it('skips an input type that cannot hold a selection', () => {
    const { field, caret } = setup({ type: 'email', value: 'a@b.c' })
    expect(() => {
      caret.placeCaretAtEnd()
      flushFrames()
    }).not.toThrow()
    expect(field.selectionStart).toBeNull()
  })
})
