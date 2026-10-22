import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Checkbox from './Checkbox.svelte'
import EditableText from './EditableText.svelte'
import Spinner from './Spinner.svelte'
import Toast from './Toast.svelte'
import { SIZE_PX } from '$lib/size-scale'

// jsdom lacks ResizeObserver (positionPanel), matchMedia, and scrollIntoView;
// stub them so mounting is a layout no-op.
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

describe('Checkbox numeric size', () => {
  it('scales every metric by a constant ratio of the size', () => {
    instance = mount(Checkbox, { target, props: { checked: false, label: 'Agree', size: 'sm' } })
    flushSync()
    const label = target.querySelector('label')
    expect(label?.getAttribute('style')).toContain('--cbx-box: 17.5px')
    expect(label?.getAttribute('style')).toContain('--cbx-font: 12.25px')
    // The tick rides a trimmed share of the slot (0.875 × sm), inside the box's
    // own 1.25× padding.
    expect(label?.getAttribute('style')).toContain('--cbx-icon: 12.25px')
  })

  it('passes out-of-scale numbers through continuously', async () => {
    await unmount(instance!)
    instance = mount(Checkbox, { target, props: { checked: false, label: 'Agree', size: 100 } })
    flushSync()
    const label = target.querySelector('label')
    expect(label?.getAttribute('style')).toContain('--cbx-box: 125px')
    expect(label?.getAttribute('style')).toContain('--cbx-font: 87.5px')
  })
})

describe('Toast numeric size', () => {
  it('scales text continuously from the size dimension', async () => {
    // The toast portals to document.body, so assert there and clean it up.
    instance = mount(Toast, { target, props: { message: 'hi', closeLabel: 'Close', onClose: () => {} } })
    flushSync()
    expect(document.body.innerHTML).toContain('--toast-font: 14px')
    await unmount(instance!)
    instance = null
    document.body.querySelectorAll('[role="status"]').forEach(el => el.remove())
    instance = mount(Toast, {
      target,
      props: { message: 'hi', closeLabel: 'Close', size: 100, onClose: () => {} },
    })
    flushSync()
    expect(document.body.innerHTML).toContain('--toast-font: 87.5px')
    document.body.querySelectorAll('[role="status"]').forEach(el => el.remove())
  })
})

describe('Spinner numeric size', () => {
  it('scales the shared axis by the fixed ratio for names and numbers alike', async () => {
    instance = mount(Spinner, { target, props: {} })
    flushSync()
    expect(target.querySelector('svg')?.getAttribute('width')).toBe(`${SIZE_PX.md * 1.5}`)
    await unmount(instance!)
    instance = mount(Spinner, { target, props: { size: 'xs' } })
    flushSync()
    expect(target.querySelector('svg')?.getAttribute('width')).toBe(`${SIZE_PX.xs * 1.5}`)
    await unmount(instance!)
    instance = mount(Spinner, { target, props: { size: 20 } })
    flushSync()
    expect(target.querySelector('svg')?.getAttribute('width')).toBe(`${20 * 1.5}`)
  })
})

describe('EditableText numeric size', () => {
  it('scales the input metrics from names and numbers', async () => {
    instance = mount(EditableText, { target, props: { text: 'hi', onChange: () => {} } })
    flushSync()
    const display = target.querySelector('button')
    expect(display?.className).toContain('var(--input-font)')
    expect(display?.getAttribute('style')).toContain('--input-font: 13px')
    expect(display?.getAttribute('style')).toContain('--input-pad-x: 9px')
    await unmount(instance!)
    instance = mount(EditableText, { target, props: { text: 'hi', size: 14, onChange: () => {} } })
    flushSync()
    const custom = target.querySelector('button')
    expect(custom?.className).toContain('var(--input-font)')
    expect(custom?.getAttribute('style')).toContain('--input-font: 11.375px')
    expect(custom?.getAttribute('style')).toContain('--input-pad-x: 7.875px')
    await unmount(instance!)
    instance = null
    // Non-finite numbers fall back to md, never "undefined".
    instance = mount(EditableText, { target, props: { text: 'hi', size: Number.NaN, onChange: () => {} } })
    flushSync()
    const fallback = target.querySelector('button')
    expect(fallback?.className).toContain('var(--input-font)')
    expect(fallback?.className).not.toContain('undefined')
    expect(fallback?.getAttribute('style')).toContain('--input-font: 13px')
  })
})
