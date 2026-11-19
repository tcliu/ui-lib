import { describe, expect, it } from 'vitest'
import { handleListboxNavKey, isModifiedNavKey, type ListboxMove } from './listbox-keynav'

function key(init: KeyboardEventInit): KeyboardEvent {
  return new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
}

// A stand-in surface that records what the handler asked it to do, in order.
function nav(options: { open?: boolean; count?: number } = {}) {
  const events: string[] = []
  return {
    events,
    config: {
      isOpen: () => options.open ?? false,
      openPanel: () => {
        events.push('open')
      },
      move: (direction: ListboxMove) => {
        events.push(`move:${direction}`)
      },
      count: () => options.count ?? 0,
      onNavigate: () => {
        events.push('navigate')
      },
    },
  }
}

describe('handleListboxNavKey', () => {
  it('opens a closed panel on ArrowDown without moving the highlight', () => {
    const { config, events } = nav({ open: false })
    const event = key({ key: 'ArrowDown' })
    expect(handleListboxNavKey(event, config)).toBe(true)
    expect(event.defaultPrevented).toBe(true)
    expect(events).toEqual(['open'])
  })

  it('moves the highlight on ArrowDown while open', () => {
    const { config, events } = nav({ open: true })
    expect(handleListboxNavKey(key({ key: 'ArrowDown' }), config)).toBe(true)
    expect(events).toEqual(['move:down', 'navigate'])
  })

  it('opens onto the last row on ArrowUp while closed', () => {
    const { config, events } = nav({ open: false })
    expect(handleListboxNavKey(key({ key: 'ArrowUp' }), config)).toBe(true)
    // The panel opens first so the last row exists to move to (and reveal).
    expect(events).toEqual(['open', 'move:last', 'navigate'])
  })

  it('moves the highlight up on ArrowUp while open', () => {
    const { config, events } = nav({ open: true })
    expect(handleListboxNavKey(key({ key: 'ArrowUp' }), config)).toBe(true)
    expect(events).toEqual(['move:up', 'navigate'])
  })

  it('jumps to either end on Home and End while open with rows', () => {
    const home = nav({ open: true, count: 3 })
    expect(handleListboxNavKey(key({ key: 'Home' }), home.config)).toBe(true)
    expect(home.events).toEqual(['move:first', 'navigate'])
    const end = nav({ open: true, count: 3 })
    expect(handleListboxNavKey(key({ key: 'End' }), end.config)).toBe(true)
    expect(end.events).toEqual(['move:last', 'navigate'])
  })

  it('leaves Home and End to the field when there is nothing to move to', () => {
    for (const options of [{ open: true, count: 0 }, { open: false, count: 3 }]) {
      const { config, events } = nav(options)
      const event = key({ key: 'Home' })
      expect(handleListboxNavKey(event, config)).toBe(true)
      expect(event.defaultPrevented).toBe(false)
      expect(events).toEqual([])
    }
  })

  it('lets a modified navigation key edit the text instead', () => {
    const { config, events } = nav({ open: true, count: 3 })
    const event = key({ key: 'ArrowDown', shiftKey: true })
    expect(handleListboxNavKey(event, config)).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    expect(events).toEqual([])
  })

  it('ignores keys that are not the listbox’s', () => {
    const { config, events } = nav({ open: true, count: 3 })
    expect(handleListboxNavKey(key({ key: 'a' }), config)).toBe(false)
    expect(events).toEqual([])
  })
})

describe('isModifiedNavKey', () => {
  it('flags navigation keys carrying a modifier', () => {
    expect(isModifiedNavKey(key({ key: 'End', shiftKey: true }))).toBe(true)
    expect(isModifiedNavKey(key({ key: 'ArrowUp', ctrlKey: true }))).toBe(true)
    expect(isModifiedNavKey(key({ key: 'ArrowUp' }))).toBe(false)
    // A modified non-navigation key is not a navigation key.
    expect(isModifiedNavKey(key({ key: 'a', shiftKey: true }))).toBe(false)
  })
})
