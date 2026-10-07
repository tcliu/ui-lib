import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Checkbox from '../Checkbox.svelte'
import EditableText from '../EditableText.svelte'
import Spinner from '../Spinner.svelte'
import Toast from '../Toast.svelte'

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
  it('renders named tiers exactly as before and settles numbers on tiers', () => {
    instance = mount(Checkbox, { target, props: { checked: false, label: 'Agree', size: 'sm' } })
    flushSync()
    expect(target.innerHTML).toContain('h-4 w-4')
    expect(target.innerHTML).toContain('text-xs')
  })

  it('settles out-of-scale numbers on the nearest tier', async () => {
    await unmount(instance!)
    instance = mount(Checkbox, { target, props: { checked: false, label: 'Agree', size: 100 } })
    flushSync()
    expect(target.innerHTML).toContain('h-5 w-5')
    expect(target.innerHTML).toContain('text-sm')
  })
})

describe('Toast numeric size', () => {
  it('renders named tiers exactly as before and settles numbers on tiers', async () => {
    // The toast portals to document.body, so assert there and clean it up.
    instance = mount(Toast, { target, props: { message: 'hi', closeLabel: 'Close', onClose: () => {} } })
    flushSync()
    expect(document.body.innerHTML).toContain('text-sm')
    await unmount(instance!)
    instance = null
    document.body.querySelectorAll('[role="status"]').forEach(el => el.remove())
    instance = mount(Toast, {
      target,
      props: { message: 'hi', closeLabel: 'Close', size: 100, onClose: () => {} },
    })
    flushSync()
    expect(document.body.innerHTML).toContain('text-base')
    document.body.querySelectorAll('[role="status"]').forEach(el => el.remove())
  })
})

describe('Spinner numeric size', () => {
  it('maps names to its own axis and passes numbers through', async () => {
    instance = mount(Spinner, { target, props: {} })
    flushSync()
    expect(target.querySelector('svg')?.getAttribute('width')).toBe('16')
    await unmount(instance!)
    instance = mount(Spinner, { target, props: { size: 20 } })
    flushSync()
    expect(target.querySelector('svg')?.getAttribute('width')).toBe('20')
  })
})

describe('EditableText numeric size', () => {
  it('renders names through classes and numbers through inline font', async () => {
    instance = mount(EditableText, { target, props: { text: 'hi', onChange: () => {} } })
    flushSync()
    const display = target.querySelector('button')
    expect(display?.className).toContain('text-md')
    expect(display?.getAttribute('style')).toBeNull()
    await unmount(instance!)
    instance = mount(EditableText, { target, props: { text: 'hi', size: 14, onChange: () => {} } })
    flushSync()
    const custom = target.querySelector('button')
    expect(custom?.className).not.toContain('text-md')
    expect(custom?.getAttribute('style')).toContain('font-size: 12px')
    await unmount(instance!)
    instance = null
    // Non-finite numbers fall back to the default class, never "undefined".
    instance = mount(EditableText, { target, props: { text: 'hi', size: Number.NaN, onChange: () => {} } })
    flushSync()
    const fallback = target.querySelector('button')
    expect(fallback?.className).toContain('text-md')
    expect(fallback?.className).not.toContain('undefined')
  })
})
