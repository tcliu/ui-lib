import { describe, expect, it, vi } from 'vitest'
import { createComboboxEntry, type ComboboxEntryConfig } from './combobox-entry'

function key(init: KeyboardEventInit): KeyboardEvent {
  return new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
}

function setup(overrides: Partial<ComboboxEntryConfig> & { open?: boolean } = {}) {
  const { open = false, ...rest } = overrides
  let isOpen = open
  const events: string[] = []
  const entry = createComboboxEntry({
    isOpen: () => isOpen,
    openPanel: () => {
      events.push('open')
      isOpen = true
    },
    move: direction => {
      events.push(`move:${direction}`)
    },
    count: () => 2,
    ...rest,
  })
  return { entry, events, close: () => (isOpen = false) }
}

describe('createComboboxEntry', () => {
  it('opens the panel on focus and on click, never twice', () => {
    const { entry, events, close } = setup()
    entry.handleFocus()
    entry.handleFocus()
    expect(events).toEqual(['open'])
    close()
    entry.handleClick()
    expect(events).toEqual(['open', 'open'])
  })

  it('runs the field input work before reopening a dismissed panel', () => {
    const onInput = vi.fn()
    const { entry, events } = setup({ onInput })
    entry.handleInput()
    expect(events).toEqual(['open'])
    expect(onInput).toHaveBeenCalledTimes(1)
    // While open it only runs the field's own work.
    entry.handleInput()
    expect(events).toEqual(['open'])
    expect(onInput).toHaveBeenCalledTimes(2)
  })

  it('routes the listbox keys and leaves the rest to the caller', () => {
    const onNavigate = vi.fn()
    const { entry, events } = setup({ onNavigate })
    expect(entry.handleKeydown(key({ key: 'ArrowDown' }))).toBe(true)
    expect(events).toEqual(['open'])
    expect(onNavigate).not.toHaveBeenCalled()
    // While open an arrow is an explicit navigation.
    expect(entry.handleKeydown(key({ key: 'ArrowDown' }))).toBe(true)
    expect(events).toEqual(['open', 'move:down'])
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('does not consume Enter or a modified arrow', () => {
    const onInput = vi.fn()
    const { entry, events } = setup({ onInput })
    expect(entry.handleKeydown(key({ key: 'Enter' }))).toBe(false)
    expect(entry.handleKeydown(key({ key: 'ArrowDown', shiftKey: true }))).toBe(false)
    expect(events).toEqual([])
  })
})
