import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './select-dropdown-filter.harness.svelte'

// jsdom lacks ResizeObserver (positionPanel), matchMedia, and scrollIntoView
// (revealInScrollport), and may lack requestAnimationFrame (placeCaretAtEnd);
// stub them so opening the panel is a layout no-op.
function installDomStubs(): void {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  )
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
  }))
  if (typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = () => {}
  }
  if (typeof globalThis.requestAnimationFrame !== 'function') {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0))
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
  }
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

function filterInput(): HTMLInputElement {
  const input = document.querySelector('input[role=combobox]')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('filter input not found')
  }
  return input
}

function optionLabels(): string[] {
  return [...document.querySelectorAll('[role=listbox] [role=option]')].map(el => el.textContent?.trim() ?? '')
}

// The emphasized match inside each option label, or null when nothing is
// highlighted.
function optionMatches(): { label: string; match: string | null }[] {
  return [...document.querySelectorAll('[role=listbox] [role=option]')].map(el => ({
    label: el.textContent?.trim() ?? '',
    match: el.querySelector('span.font-semibold')?.textContent ?? null,
  }))
}

// Mounts the harness and focuses the combobox so the panel opens with every
// option (the pre-filled value strips to an empty query).
function openPanel(): void {
  instance = mount(Harness, { target })
  flushSync()
  filterInput().focus()
  flushSync()
}

function setFilter(text: string): void {
  const input = filterInput()
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
}

function pressKey(key: string, modifiers: KeyboardEventInit = {}): boolean {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers })
  filterInput().dispatchEvent(event)
  flushSync()
  return event.defaultPrevented
}

function activeOption(): string | null {
  const id = filterInput().getAttribute('aria-activedescendant')
  if (!id) return null
  return document.getElementById(id)?.textContent?.trim() ?? null
}

describe('SelectDropdown option highlight', () => {
  it('paints the active option instantly so held-key repeat does not lag', () => {
    openPanel()
    const row = document.querySelector('[role=listbox] [role=option]')
    expect(row?.className).toContain('transition-none')
  })
})

describe('SelectDropdown filterable filtering', () => {
  it('shows every option when the query is empty', () => {
    openPanel()
    expect(optionLabels()).toEqual(['One', 'Two', 'Three'])
  })

  it('narrows to an exact match instead of showing every option', () => {
    openPanel()
    setFilter('Three')
    expect(optionLabels()).toEqual(['Three'])
  })

  it('narrows when the query equals the current value instead of stripping it', () => {
    openPanel()
    setFilter('Two')
    expect(optionLabels()).toEqual(['Two'])
  })

  it('filters on text appended to the prefilled value', () => {
    openPanel()
    setFilter('Twoh')
    expect(optionLabels()).toEqual(['Three'])
  })

  it('narrows to the options containing a partial query', () => {
    openPanel()
    setFilter('t')
    expect(optionLabels()).toEqual(['Two', 'Three'])
  })

  it('emphasizes the typed part in every label when several options match', () => {
    openPanel()
    setFilter('o')
    expect(optionLabels()).toEqual(['One', 'Two'])
    expect(optionMatches()).toEqual([
      { label: 'One', match: 'O' },
      { label: 'Two', match: 'o' },
    ])
  })

  it('does not emphasize anything when only one option matches', () => {
    openPanel()
    setFilter('Three')
    expect(optionLabels()).toEqual(['Three'])
    expect(optionMatches()).toEqual([{ label: 'Three', match: null }])
  })

  it('narrows when the query matches an option value', () => {
    openPanel()
    setFilter('one')
    expect(optionLabels()).toEqual(['One'])
  })

  it('falls back to every option when the query matches nothing', () => {
    openPanel()
    setFilter('zzz')
    expect(optionLabels()).toEqual(['One', 'Two', 'Three'])
  })

  it('keeps the confirmed value and filters by it when reopening after Enter', () => {
    openPanel()
    setFilter('T')
    expect(optionLabels()).toEqual(['Two', 'Three'])

    expect(pressKey('Enter')).toBe(true)
    // Panel closed: the input shows the selected value, no options listed.
    expect(filterInput().value).toBe('Two')
    expect(optionLabels()).toEqual([])

    // Reopening filters by the confirmed value, so the input keeps showing it
    // instead of reverting to the typed query it replaced.
    expect(pressKey('Enter')).toBe(true)
    expect(filterInput().value).toBe('Two')
    expect(optionLabels()).toEqual(['Two'])
  })
})

describe('SelectDropdown filterable keyboard text behavior', () => {
  it('moves the highlight on plain Home and End', () => {
    openPanel()
    expect(activeOption()).toBe('Two')
    expect(pressKey('Home')).toBe(true)
    expect(activeOption()).toBe('One')
    expect(pressKey('End')).toBe(true)
    expect(activeOption()).toBe('Three')
  })

  it('Shift+Home selects the whole value and Shift+End collapses it, without moving the highlight', () => {
    openPanel()
    expect(activeOption()).toBe('Two')
    const input = filterInput()
    input.setSelectionRange(3, 3)
    expect(pressKey('Home', { shiftKey: true })).toBe(true)
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 3])
    expect(activeOption()).toBe('Two')
    expect(pressKey('End', { shiftKey: true })).toBe(true)
    expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3])
    expect(activeOption()).toBe('Two')
  })

  it('leaves Shift+Arrow to the input and only plain arrows move the highlight', () => {
    openPanel()
    expect(activeOption()).toBe('Two')
    expect(pressKey('ArrowDown', { shiftKey: true })).toBe(false)
    expect(activeOption()).toBe('Two')
    expect(pressKey('ArrowUp', { shiftKey: true })).toBe(false)
    expect(activeOption()).toBe('Two')
    expect(pressKey('ArrowDown')).toBe(true)
    expect(activeOption()).toBe('Three')
  })
})

describe('SelectDropdown filterable text selection', () => {
  function doubleClick(): void {
    filterInput().dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 }))
    flushSync()
  }

  it('selects the whole value on double-click so the next keystroke replaces it', () => {
    openPanel()
    doubleClick()
    const input = filterInput()
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, input.value.length])
  })

  it('drops a pending caret fix that would collapse the selection', async () => {
    openPanel()
    const input = filterInput()
    // With the whole value already selected, the caret fix a single click
    // schedules would collapse it to the end; the double-click cancels it.
    input.setSelectionRange(0, input.value.length)
    input.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    doubleClick()
    await new Promise(resolve => setTimeout(resolve, 50))
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, input.value.length])
  })
})

describe('SelectDropdown filterable trigger chrome', () => {
  it('renders the chevron as the field trailing adornment', () => {
    instance = mount(Harness, { target })
    flushSync()
    const input = filterInput()
    const label = input.closest('label')
    const frame = input.parentElement
    // The chevron lives inside the field frame (the trailing slot), not beside
    // it as a flex sibling of the label.
    expect(label?.querySelector(':scope > svg')).toBeNull()
    expect(frame?.querySelector(':scope > span.absolute svg')).not.toBeNull()
    // The input reserves the chevron glyph plus the label→chevron gap, and the
    // frame carries those metrics and stretches to the trigger box.
    expect(input.className).toContain(
      'pr-[calc(var(--sel-chevron-glyph)+var(--sel-chevron-text-gap))]',
    )
    expect(frame?.style.flex).toBe('1 1 auto')
    expect(frame?.style.getPropertyValue('min-width')).not.toBe('')
    expect(frame?.style.getPropertyValue('--sel-chevron-glyph')).not.toBe('')
    expect(label?.getAttribute('style')).toContain('--sel-chevron-gap:')
  })
})
