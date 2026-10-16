import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import SelectDropdown from '../SelectDropdown.svelte'
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

describe('SelectDropdown numeric size', () => {
  it('carries the resolved metrics on the trigger and the option rows', () => {
    instance = mount(Harness, { target })
    flushSync()
    // size 14 → font 0.8125 * 14.
    const trigger = document.querySelector('button[role=combobox]')
    expect(trigger?.getAttribute('style')).toContain('--sel-font: 11.375px')

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    const row = document.querySelector('[role=listbox] [role=option]')
    expect(row?.getAttribute('style')).toContain('--sel-font: 11.375px')
    // The row references the min-width var rather than a literal class.
    expect(row?.getAttribute('class')).toContain('min-w-[var(--sel-min-w)]')
  })

  it('scales the chevron with the numeric size', () => {
    instance = mount(Harness, { target })
    flushSync()
    // The chevron rides 0.625 × the slot (14) → 8.75 × ICON_RATIO.
    expect(document.querySelector('.relative svg')?.getAttribute('width')).toBe('7.109375')
  })
})

describe('SelectDropdown clearable sizing', () => {
  it('scales the gap and the clear icon with the size', () => {
    instance = mount(SelectDropdown, {
      target,
      props: { options: ['a', 'b'], activeValue: 'a', ariaLabel: 'Pick', clearable: true, size: 18, onSelect: () => {} },
    })
    flushSync()
    // gap 0.375 * 18, and the clear cross rides 0.625 × the dimension.
    const wrapper = target.querySelector('div.relative > span.inline-flex')
    expect(wrapper?.getAttribute('style')).toContain('gap: 6.75px')
    const clear = target.querySelector('button[aria-label="Clear"]')
    expect(clear?.getAttribute('style')).toContain('--btn-icon: 11.25px')
    expect(clear?.innerHTML).toContain('h-[var(--btn-icon)]')
  })
})
