import { flushSync } from 'svelte'

/**
 * True when a navigation key is pressed with a modifier. Such a key belongs to
 * the text field (Shift+Home selects text, Ctrl+Arrow moves by word) rather
 * than the listbox highlight, so the keydown handler must let it through.
 */
export function isModifiedNavKey(event: KeyboardEvent): boolean {
  const navKey = event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End'
  return navKey && (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey)
}

/** A listbox highlight move, as the shared navigation handler issues them. */
export type ListboxMove = 'up' | 'down' | 'first' | 'last'

/**
 * What the navigation keys need from a surface: the caller owns `open`, the
 * filtering, and the highlight (through `useListbox`), so it supplies them
 * instead of the handler reaching into the component.
 */
export interface ListboxNav {
  isOpen: () => boolean
  /** Open the panel; an arrow key calls it when the panel is closed. */
  openPanel: () => void
  /** Move (and reveal) the active row, i.e. `listbox.moveHighlight`. */
  move: (direction: ListboxMove) => void
  /** Visible row count, so Home/End knows whether there is a row to move to. */
  count: () => number
  /** A key actually moved the active row: an explicit navigation. */
  onNavigate?: () => void
}

/**
 * Route the listbox navigation keys (arrows, Home, End) for a listbox surface
 * and report whether the key was the listbox's. An unmodified arrow opens a
 * closed panel — `ArrowUp` straight onto the last row — and moves the highlight
 * while open, while Home/End jump to either end of an open panel. A modified
 * navigation key stays with the text field, so Shift+Arrow and Ctrl+Home keep
 * editing the text instead of moving the highlight.
 *
 * Opening flushes synchronously so a held key paints the list before its next
 * repeat, and `onNavigate` lets a surface that commits on Enter tell an
 * explicit move from a fresh open.
 */
export function handleListboxNavKey(event: KeyboardEvent, nav: ListboxNav): boolean {
  if (isModifiedNavKey(event)) return false
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!nav.isOpen()) {
      flushSync(() => nav.openPanel())
      return true
    }
    nav.move('down')
    nav.onNavigate?.()
    return true
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (!nav.isOpen()) {
      // Open first so the last row exists to move to (and reveal).
      flushSync(() => nav.openPanel())
      nav.move('last')
    } else {
      nav.move('up')
    }
    nav.onNavigate?.()
    return true
  }
  if (event.key === 'Home' || event.key === 'End') {
    if (nav.isOpen() && nav.count() > 0) {
      event.preventDefault()
      nav.move(event.key === 'Home' ? 'first' : 'last')
      nav.onNavigate?.()
    }
    return true
  }
  return false
}
