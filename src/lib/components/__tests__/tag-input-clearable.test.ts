import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import TagInput from '../TagInput.svelte'

// jsdom lacks ResizeObserver (positionPanel), matchMedia (tooltip), and
// scrollIntoView (revealInScrollport); stub them so mounting is a layout
// no-op.
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
  instance = mount(TagInput, { target, props })
  flushSync()
}

const clearEl = (): HTMLButtonElement | null => target.querySelector('button[aria-label="Clear"]')
const inputEl = (): HTMLInputElement => target.querySelector('input[role=combobox]')!
const chipLabels = (): string[] =>
  [...target.querySelectorAll('[aria-label^="Remove "]')].map(el => el.getAttribute('aria-label')!.replace(/^Remove /, ''))

describe('TagInput clearable defaultValue', () => {
  it('renders no clear button while off or at the default', async () => {
    await remount({ value: ['a'] })
    expect(clearEl()).toBeNull()

    // Empty matches the unset (empty) default.
    await remount({ value: [], clearable: true })
    expect(clearEl()).toBeNull()

    await remount({ value: ['a'], defaultValue: ['a'], clearable: true })
    expect(clearEl()).toBeNull()
  })

  it('shows the cross for any addition, removal, reorder, or edit', async () => {
    await remount({ value: ['a', 'b'], defaultValue: ['a'], clearable: true })
    expect(clearEl()).not.toBeNull()

    await remount({ value: [], defaultValue: ['a'], clearable: true })
    expect(clearEl()).not.toBeNull()

    // Same set in a different order still differs.
    await remount({ value: ['b', 'a'], defaultValue: ['a', 'b'], clearable: true })
    expect(clearEl()).not.toBeNull()

    // Comparison is case-sensitive.
    await remount({ value: ['A'], defaultValue: ['a'], clearable: true })
    expect(clearEl()).not.toBeNull()
  })

  it('offers no clear while disabled', async () => {
    await remount({ value: ['b'], defaultValue: ['a'], clearable: true, disabled: true })
    expect(clearEl()).toBeNull()
  })

  it('resets to a copy of the default, emits, and refocuses on click', async () => {
    const onChange = vi.fn()
    const defaults = ['a']
    await remount({ value: ['b'], defaultValue: defaults, clearable: true, onChange })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(chipLabels()).toEqual(['a'])
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(['a'])
    // The emitted list is a copy, never the prop array itself.
    expect(onChange.mock.calls[0]![0]).not.toBe(defaults)
    expect(document.activeElement).toBe(inputEl())
    // The cross disappears with the restored default.
    expect(clearEl()).toBeNull()
  })

  it('routes the click to onClear when one is provided', async () => {
    const onClear = vi.fn()
    const onChange = vi.fn()
    await remount({ value: ['b'], defaultValue: ['a'], clearable: true, onChange, onClear })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(onClear).toHaveBeenCalledOnce()
    // The handler owns the clear, so the list is untouched here.
    expect(chipLabels()).toEqual(['b'])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('resolves auto to the inside overlay', async () => {
    await remount({ value: ['b'], defaultValue: ['a'], clearable: true })
    expect(clearEl()!.closest('div.rounded-lg')).not.toBeNull()
    expect(clearEl()!.closest('span.absolute')?.className).toContain('top-1/2')
  })

  it('centers the outside clear against the box', async () => {
    await remount({ value: ['b'], defaultValue: ['a'], clearable: true, clearPlacement: 'outside' })
    expect(clearEl()!.closest('div.rounded-lg')).toBeNull()
    expect(clearEl()!.parentElement!.className).toContain('items-center')
  })

  it('overlays the box edge and reserves a gutter while inside', async () => {
    await remount({ value: ['b'], defaultValue: ['a'], clearable: true, clearPlacement: 'inside' })
    // No sibling row: the cross rides inside the box itself, vertically centered.
    expect(clearEl()!.closest('div.rounded-lg')).not.toBeNull()
    const overlay = clearEl()!.closest('span.absolute')
    expect(overlay?.className).toContain('top-1/2')
    // Chips never run under the overlay, even while the cross is hidden.
    await remount({ value: ['a'], defaultValue: ['a'], clearable: true, clearPlacement: 'inside' })
    expect(clearEl()).toBeNull()
    expect(target.querySelector('[style*="padding-right: var(--clear-gutter)"]')).not.toBeNull()
  })
})
