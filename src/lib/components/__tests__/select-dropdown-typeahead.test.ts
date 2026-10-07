import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import SelectDropdown from '../SelectDropdown.svelte'

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

const options = [
  { value: 'one', label: 'One' },
  { value: 'four', label: 'Four' },
  { value: 'fourteen', label: 'Fourteen' },
  { value: 'six', label: 'Six' },
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

function mountControl(): void {
  instance = mount(SelectDropdown, {
    target,
    props: {
      buttonLabel: 'One',
      activeValue: 'one',
      ariaLabel: 'test',
      options,
      onSelect: () => {},
    },
  })
  flushSync()
}

function trigger(): HTMLButtonElement {
  const button = document.querySelector('button[role=combobox]')
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('combobox trigger not found')
  }
  return button
}

function press(key: string, modifiers: KeyboardEventInit = {}): void {
  trigger().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers }))
  flushSync()
}

function activeOption(): string | null {
  const id = trigger().getAttribute('aria-activedescendant')
  if (!id) return null
  return document.getElementById(id)?.textContent?.trim() ?? null
}

describe('SelectDropdown non-filterable type-ahead', () => {
  it('steps forward through same-prefix matches on plain letters', () => {
    mountControl()
    press('f')
    expect(activeOption()).toBe('Four')
    press('f')
    expect(activeOption()).toBe('Fourteen')
  })

  it('steps to the previous match when Shift is held', () => {
    mountControl()
    press('f')
    press('f')
    expect(activeOption()).toBe('Fourteen')
    press('f', { shiftKey: true })
    expect(activeOption()).toBe('Four')
    press('f', { shiftKey: true })
    expect(activeOption()).toBe('Fourteen')
  })
})
