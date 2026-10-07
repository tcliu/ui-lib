import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './select-dropdown-size.harness.svelte'

// Same DOM stubs as the other dropdown tests: jsdom lacks ResizeObserver
// (positionPanel), matchMedia, and scrollIntoView (revealInScrollport).
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

describe('SelectDropdown interpolated size', () => {
  it('carries the interpolated geometry on the trigger and the option rows', () => {
    instance = mount(Harness, { target })
    flushSync()
    const trigger = document.querySelector('button[role=combobox]')
    expect(trigger?.getAttribute('style')).toContain('font-size: 12px')

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    const row = document.querySelector('[role=listbox] [role=option]')
    expect(row?.getAttribute('style')).toContain('font-size: 12px')
    expect(row?.getAttribute('class')).not.toContain('min-w-')
  })

  it('scales the chevron with the numeric size', () => {
    instance = mount(Harness, { target })
    flushSync()
    expect(document.querySelector('.relative svg')?.getAttribute('width')).toBe('14')
  })
})
