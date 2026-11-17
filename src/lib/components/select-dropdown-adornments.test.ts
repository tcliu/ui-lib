import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './select-dropdown-adornments.harness.svelte'

// jsdom lacks the browser APIs the dropdown's positioning and listbox helpers
// read on mount.
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

function mountHarness(props: Record<string, unknown> = {}): void {
  instance = mount(Harness, { target, props })
  flushSync()
}

describe('SelectDropdown leading/trailer adornments', () => {
  it('renders a leading block inside the button trigger and a trailer outside it', () => {
    mountHarness({ filterable: false })
    const trigger = target.querySelector('button[role="combobox"]')
    const leading = target.querySelector('[data-adornment="leading"]')
    const trailer = target.querySelector('[data-adornment="trailer"]')
    expect(leading).not.toBeNull()
    expect(trigger?.contains(leading)).toBe(true)
    expect(trailer).not.toBeNull()
    expect(trigger?.contains(trailer)).toBe(false)
    // The built-in chevron still owns the trigger's trailing edge.
    expect(trigger?.querySelector('svg')).not.toBeNull()
  })

  it('renders a leading block inside the filterable trigger and a trailer outside it', () => {
    mountHarness({ filterable: true })
    const label = target.querySelector('label')
    const input = target.querySelector('input[role="combobox"]')
    const leading = target.querySelector('[data-adornment="leading"]')
    const trailer = target.querySelector('[data-adornment="trailer"]')
    expect(leading?.parentElement).toBe(label)
    expect(label?.contains(input)).toBe(true)
    expect(trailer).not.toBeNull()
    expect(label?.contains(trailer)).toBe(false)
    // The chevron rides the field's own trailing slot, inside the label.
    expect(label?.querySelector('svg')).not.toBeNull()
  })
})
