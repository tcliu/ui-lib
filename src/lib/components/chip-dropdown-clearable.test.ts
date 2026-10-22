import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, tick, unmount } from 'svelte'
import ChipDropdown from './ChipDropdown.svelte'

// jsdom lacks ResizeObserver (positionPanel), matchMedia, and scrollIntoView
// (revealInScrollport); stub them so mounting is a layout no-op.
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
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
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

async function remount(props: Record<string, unknown> = {}): Promise<void> {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(ChipDropdown, {
    target,
    props: { label: 'Active', ariaLabel: 'Status', options, onSelect: () => {}, ...props },
  })
  flushSync()
}

const clearEl = (): HTMLButtonElement | null => target.querySelector('button[aria-label="Clear"]')
const triggerEl = (): HTMLElement | null => target.querySelector('button[role=combobox]')
// The clear slot is always rendered while `clearable`; the cross itself toggles
// with the value, and the slot goes `invisible` (keeping its box) when hidden.
const clearSlotEl = (): HTMLElement | null => target.querySelector('[data-clear-slot]')
const labelEl = (): HTMLElement | null => target.querySelector('button[role=combobox] > span')

describe('ChipDropdown clearable defaultValue', () => {
  it('reserves no clear slot while clearable is off', async () => {
    await remount({ activeValue: 'active' })
    expect(clearSlotEl()).toBeNull()
    expect(clearEl()).toBeNull()
  })

  it('reserves the clear slot but hides the cross for an empty value', async () => {
    await remount({ activeValue: '', clearable: true })
    expect(clearSlotEl()).not.toBeNull()
    expect(clearSlotEl()!.classList.contains('invisible')).toBe(true)
    expect(clearEl()).toBeNull()
  })

  it('hides the cross while the value matches the default', async () => {
    await remount({ activeValue: 'active', defaultValue: 'active', clearable: true })
    expect(clearSlotEl()!.classList.contains('invisible')).toBe(true)
    expect(clearEl()).toBeNull()

    await remount({ activeValue: 'paused', defaultValue: 'active', clearable: true })
    expect(clearSlotEl()!.classList.contains('invisible')).toBe(false)
    expect(clearEl()).not.toBeNull()
  })

  it('shows the cross for an empty value that differs from the default', async () => {
    await remount({ activeValue: '', defaultValue: 'active', clearable: true })
    expect(clearEl()).not.toBeNull()
  })

  it('compares against the raw option value, not its label', async () => {
    const labelled = [{ value: 'active', label: 'Active' }]
    await remount({ options: labelled, label: 'Active', activeValue: 'active', defaultValue: 'Active', clearable: true })
    expect(clearEl()).not.toBeNull()

    await remount({ options: labelled, label: 'Active', activeValue: 'active', defaultValue: 'active', clearable: true })
    expect(clearEl()).toBeNull()
  })

  it('offers no clear while disabled', async () => {
    await remount({ activeValue: 'paused', defaultValue: 'active', clearable: true, disabled: true })
    expect(clearEl()).toBeNull()
    // The slot stays reserved so the chip does not resize when re-enabled.
    expect(clearSlotEl()!.classList.contains('invisible')).toBe(true)
  })

  it('sizes the pill to its label, not the option list', async () => {
    const longOptions = [
      { value: 'active', label: 'Active' },
      { value: 'wide', label: 'A very long option label that must not widen a short chip' },
    ]
    await remount({ options: longOptions, label: 'Active', activeValue: 'active', clearable: true })
    // The pill sizes to its own label: no width reserve derived from the options.
    expect(labelEl()!.getAttribute('style')).toBeNull()
    // The height floor is kept regardless, so an emptied label cannot collapse it.
    expect(labelEl()!.classList.contains('min-h-[var(--chip-line)]')).toBe(true)
  })

  it('selects the default and refocuses the trigger on click', async () => {
    const onSelect = vi.fn()
    await remount({ activeValue: 'paused', defaultValue: 'active', clearable: true, onSelect })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    await tick()
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('active')
    expect(document.activeElement).toBe(triggerEl())
  })

  it('routes the click to onClear when one is provided', async () => {
    const onClear = vi.fn()
    const onSelect = vi.fn()
    await remount({ activeValue: 'paused', defaultValue: 'active', clearable: true, onSelect, onClear })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(onClear).toHaveBeenCalledOnce()
    // The handler owns the clear, so no value is selected here.
    expect(onSelect).not.toHaveBeenCalled()
  })
})
