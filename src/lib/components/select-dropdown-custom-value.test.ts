import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import CustomHarness from './select-dropdown-custom-value.harness.svelte'
import DefaultHarness from './select-dropdown-filter.harness.svelte'

// Same DOM stubs as the filter tests: jsdom lacks ResizeObserver
// (positionPanel), matchMedia, and scrollIntoView (revealInScrollport), and
// may lack requestAnimationFrame (placeCaretAtEnd).
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

function openPanel(Harness: typeof CustomHarness): void {
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

function pressEnter(): void {
  filterInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  flushSync()
}

function panelOpen(): boolean {
  return document.querySelector('[role=listbox]') !== null
}

describe('SelectDropdown free entry', () => {
  it('commits typed text that matches no option and keeps it in the input', () => {
    openPanel(CustomHarness)
    setFilter('Fourteen')
    pressEnter()
    expect(panelOpen()).toBe(false)
    // Custom path keeps the typed text; the option path would have replaced
    // it with the highlighted row's label ('Two').
    expect(filterInput().value).toBe('Fourteen')
  })

  it('selects the option when the typed text exactly matches its value', () => {
    openPanel(CustomHarness)
    // 'one' matches the option value while its label is 'One': the option
    // path replaces the text with the label, the custom path would keep it.
    setFilter('one')
    pressEnter()
    expect(panelOpen()).toBe(false)
    expect(filterInput().value).toBe('One')
  })

  it('selects the option on a case-insensitive exact match', () => {
    openPanel(CustomHarness)
    setFilter('TWO')
    pressEnter()
    expect(panelOpen()).toBe(false)
    expect(filterInput().value).toBe('Two')
  })

  it('never commits pristine text: Enter on a fresh panel keeps the committed option', () => {
    openPanel(CustomHarness)
    pressEnter()
    expect(panelOpen()).toBe(false)
    expect(filterInput().value).toBe('Two')
  })

  it('falls back to the highlighted row when the prop is off', () => {
    openPanel(DefaultHarness)
    setFilter('zzz')
    pressEnter()
    expect(panelOpen()).toBe(false)
    // Old behavior: no match falls back to the full list with the highlight
    // still on the committed row, so Enter takes 'Two' — never the typed text.
    expect(filterInput().value).toBe('Two')
  })
})
