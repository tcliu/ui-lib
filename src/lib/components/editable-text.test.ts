import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import EditableText from './EditableText.svelte'

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  target = document.createElement('div')
  document.body.appendChild(target)
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  target.remove()
})

// Double-clicking the display text opens the edit field.
function enterEditMode(): HTMLInputElement {
  instance = mount(EditableText, { target, props: { text: 'hi', onChange: () => {} } })
  flushSync()
  const display = target.querySelector('button')
  if (!(display instanceof HTMLButtonElement)) throw new Error('display button not found')
  display.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
  flushSync()
  const input = target.querySelector('input')
  if (!(input instanceof HTMLInputElement)) throw new Error('edit field not found')
  return input
}

describe('EditableText edit field', () => {
  it('rides TextInput and keeps its own chrome', () => {
    const input = enterEditMode()
    // The shared metrics still drive the field's font and padding.
    expect(input.className).toContain('var(--input-font)')
    // The field keeps EditableText's own skin — an outline ring standing in
    // for the text — rather than the shared border.
    expect(input.className).toContain('outline-slate-700')
    expect(input.className).not.toContain('border-slate-700')
  })

  it('keeps the escape-capture marker so an open dialog can claim the key', () => {
    const input = enterEditMode()
    expect(input.getAttribute('data-escape-capture')).not.toBeNull()
  })
})
