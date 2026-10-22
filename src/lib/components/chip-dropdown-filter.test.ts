import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import ChipDropdown from './ChipDropdown.svelte'

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

// The filterable trigger carries no `role`, so it is the only role-less button.
function trigger(): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find(el => !el.hasAttribute('role'))
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('chip trigger not found')
  }
  return button
}

function openPanel(): void {
  instance = mount(ChipDropdown, {
    target,
    props: { label: 'Set status', ariaLabel: 'Status', options, filterable: true, onSelect: () => {} },
  })
  flushSync()
  trigger().click()
  flushSync()
}

function setFilter(text: string): void {
  const input = document.querySelector('input[role=combobox]')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('filter input not found')
  }
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
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

describe('ChipDropdown filterable match highlight', () => {
  it('emphasizes the typed part in every label when several options match', () => {
    openPanel()
    setFilter('ou')
    expect(optionLabels()).toEqual(['Four', 'Fourteen'])
    expect(optionMatches()).toEqual([
      { label: 'Four', match: 'ou' },
      { label: 'Fourteen', match: 'ou' },
    ])
  })

  it('does not emphasize anything when only one option matches', () => {
    openPanel()
    setFilter('Fourteen')
    expect(optionLabels()).toEqual(['Fourteen'])
    expect(optionMatches()).toEqual([{ label: 'Fourteen', match: null }])
  })
})
