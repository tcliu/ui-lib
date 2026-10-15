import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, tick, unmount } from 'svelte'
import SelectDropdown from '../SelectDropdown.svelte'

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

async function remount(props: Record<string, unknown> = {}): Promise<void> {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(SelectDropdown, {
    target,
    props: { options: ['a', 'b'], ariaLabel: 'Pick', onSelect: () => {}, ...props },
  })
  flushSync()
}

const clearEl = (): HTMLButtonElement | null => target.querySelector('button[aria-label="Clear"]')
const triggerEl = (): HTMLElement | null => target.querySelector('[role=combobox]')

describe('SelectDropdown clearable defaultValue', () => {
  it('renders no clear button while off or empty', async () => {
    await remount({ activeValue: 'a' })
    expect(clearEl()).toBeNull()

    await remount({ activeValue: '', clearable: true })
    expect(clearEl()).toBeNull()
  })

  it('hides the cross while the value matches the default', async () => {
    await remount({ activeValue: 'a', defaultValue: 'a', clearable: true })
    expect(clearEl()).toBeNull()

    await remount({ activeValue: 'b', defaultValue: 'a', clearable: true })
    expect(clearEl()).not.toBeNull()
  })

  it('shows the cross for an empty value that differs from the default', async () => {
    await remount({ activeValue: '', defaultValue: 'a', clearable: true })
    expect(clearEl()).not.toBeNull()
  })

  it('compares against the raw option value, not its label', async () => {
    const options = [{ value: 'eleven', label: 'Eleven' }]
    await remount({ options, activeValue: 'eleven', defaultValue: 'Eleven', clearable: true })
    expect(clearEl()).not.toBeNull()

    await remount({ options, activeValue: 'eleven', defaultValue: 'eleven', clearable: true })
    expect(clearEl()).toBeNull()
  })

  it('selects the default and refocuses the trigger on click', async () => {
    const onSelect = vi.fn()
    await remount({ activeValue: 'b', defaultValue: 'a', clearable: true, onSelect })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    await tick()
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('a')
    expect(document.activeElement).toBe(triggerEl())
  })

  it('routes the click to onClear when one is provided', async () => {
    const onClear = vi.fn()
    const onSelect = vi.fn()
    await remount({ activeValue: 'b', defaultValue: 'a', clearable: true, onSelect, onClear })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(onClear).toHaveBeenCalledOnce()
    // The handler owns the clear, so no value is selected here.
    expect(onSelect).not.toHaveBeenCalled()
  })
})
