import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './autocomplete.harness.svelte'

// jsdom lacks ResizeObserver (positionPanel), matchMedia, and scrollIntoView
// (revealInScrollport); stub them so opening the panel is a layout no-op.
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

function combobox(): HTMLInputElement {
  const input = document.querySelector('input[role=combobox]')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('combobox input not found')
  }
  return input
}

function optionLabels(): string[] {
  return [...document.querySelectorAll('[role=listbox] [role=option]')].map(el => el.textContent?.trim() ?? '')
}

function optionMatches(): { label: string; match: string | null }[] {
  return [...document.querySelectorAll('[role=listbox] [role=option]')].map(el => ({
    label: el.textContent?.trim() ?? '',
    match: el.querySelector('span.font-semibold')?.textContent ?? null,
  }))
}

function text(testid: string): string {
  return document.querySelector(`[data-testid=${testid}]`)?.textContent?.trim() ?? ''
}

function openPanel(): void {
  instance = mount(Harness, { target })
  flushSync()
  combobox().focus()
  flushSync()
}

function type(value: string): void {
  const input = combobox()
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
}

function pressKey(key: string, modifiers: KeyboardEventInit = {}): boolean {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers })
  combobox().dispatchEvent(event)
  flushSync()
  return event.defaultPrevented
}

function activeOption(): string | null {
  const id = combobox().getAttribute('aria-activedescendant')
  if (!id) return null
  return document.getElementById(id)?.textContent?.trim() ?? null
}

describe('AutoComplete suggestions', () => {
  it('opens on focus showing every option when the field is empty', () => {
    openPanel()
    expect(optionLabels()).toEqual(['United States', 'United Kingdom', 'Canada'])
  })

  it('filters as you type', () => {
    openPanel()
    type('united')
    expect(optionLabels()).toEqual(['United States', 'United Kingdom'])
  })

  it('filters on the option value as well as the label', () => {
    openPanel()
    type('ca')
    expect(optionLabels()).toEqual(['Canada'])
  })

  it('emphasizes the typed part when several options match', () => {
    openPanel()
    type('united')
    expect(optionMatches()).toEqual([
      { label: 'United States', match: 'United' },
      { label: 'United Kingdom', match: 'United' },
    ])
  })

  it('hides the panel when nothing matches', () => {
    openPanel()
    type('zzz')
    expect(optionLabels()).toEqual([])
    expect(document.querySelector('[role=listbox]')).toBeNull()
    expect(combobox().getAttribute('aria-expanded')).toBe('false')
  })
})

describe('AutoComplete value model', () => {
  it('keeps free-typed text as the value', () => {
    openPanel()
    type('Atlantis')
    expect(text('value')).toBe('Atlantis')
    expect(text('picked')).toBe('')
  })

  it('accepts the active option on Enter: value is the label, onSelect gets the value', () => {
    openPanel()
    expect(pressKey('Enter')).toBe(true)
    expect(text('value')).toBe('United States')
    expect(text('picked')).toBe('us')
    // Panel closed after accepting.
    expect(optionLabels()).toEqual([])
  })

  it('accepts the highlighted option after arrowing down', () => {
    openPanel()
    expect(activeOption()).toBe('United States')
    expect(pressKey('ArrowDown')).toBe(true)
    expect(activeOption()).toBe('United Kingdom')
    expect(pressKey('Enter')).toBe(true)
    expect(text('value')).toBe('United Kingdom')
    expect(text('picked')).toBe('uk')
  })
})

describe('AutoComplete keyboard behavior', () => {
  it('closes the panel on Escape without clearing the value', () => {
    openPanel()
    type('Canada')
    expect(pressKey('Escape')).toBe(true)
    expect(optionLabels()).toEqual([])
    expect(text('value')).toBe('Canada')
  })

  it('leaves modified navigation keys to the text field', () => {
    openPanel()
    expect(pressKey('ArrowDown', { shiftKey: true })).toBe(false)
    expect(activeOption()).toBe('United States')
  })
})
