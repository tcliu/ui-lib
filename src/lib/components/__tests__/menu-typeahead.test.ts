import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, tick, unmount } from 'svelte'
import Harness from './menu-typeahead.harness.svelte'

// jsdom lacks ResizeObserver (positionPanel) and matchMedia (Menu's viewport
// and motion queries); stub them so opening the panel is a layout no-op.
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
}

interface Item {
  id: string
  label: string
  disabled?: boolean
}

const items: Item[] = [
  { id: 'one', label: 'One' },
  { id: 'four', label: 'Four' },
  { id: 'fourteen', label: 'Fourteen' },
  { id: 'six', label: 'Six' },
]

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

function mountMenu(list: Item[] = items, searchable = true): void {
  instance = mount(Harness, { target, props: { items: list, onSelect: () => {}, searchable } })
  flushSync()
}

function trigger(): HTMLButtonElement {
  const button = document.querySelector('button[aria-haspopup=menu]')
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('menu trigger not found')
  }
  return button
}

function press(key: string, modifiers: KeyboardEventInit = {}): void {
  // While the panel is open the active item holds focus, and its keydown
  // bubbles to the panel handler; dispatch there so the panel's type-ahead
  // branch is what gets exercised.
  const target = panelOpen() && document.activeElement instanceof HTMLElement ? document.activeElement : trigger()
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers }))
  flushSync()
}

function panelOpen(): boolean {
  return document.querySelector('[role=menu]') !== null
}

function focusedItemLabel(): string | null {
  const active = document.activeElement
  if (!(active instanceof HTMLElement) || active.getAttribute('role') !== 'menuitem') {
    return null
  }
  return active.textContent?.trim() ?? null
}

describe('Menu type-ahead', () => {
  it('opens on a printable key and focuses the first matching item', async () => {
    mountMenu()
    press('f')
    await tick()
    expect(panelOpen()).toBe(true)
    expect(focusedItemLabel()).toBe('Four')
  })

  it('cycles same-prefix matches and reverses on Shift', async () => {
    mountMenu()
    press('f')
    await tick()
    press('f')
    expect(focusedItemLabel()).toBe('Fourteen')
    press('f', { shiftKey: true })
    expect(focusedItemLabel()).toBe('Four')
  })

  it('skips disabled items', async () => {
    mountMenu(items.map(entry => (entry.id === 'four' ? { ...entry, disabled: true } : entry)))
    press('f')
    await tick()
    expect(focusedItemLabel()).toBe('Fourteen')
  })

  it('does nothing when no itemLabel is provided', async () => {
    mountMenu(items, false)
    press('f')
    await tick()
    expect(panelOpen()).toBe(false)
    expect(focusedItemLabel()).toBeNull()
  })
})
