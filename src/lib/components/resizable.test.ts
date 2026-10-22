import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './resizable.harness.svelte'

// jsdom has no pointer-capture APIs at all, so `vi.spyOn` cannot attach;
// assign and restore the stubs directly.
const pointerStubs: Record<string, (this: Element, ...args: never[]) => unknown> = {
  setPointerCapture() {},
  hasPointerCapture() {
    return true
  },
  releasePointerCapture() {},
}
const originalPointerApis = new Map<string, unknown>()

function elementPrototype(): Record<string, unknown> {
  return Element.prototype as unknown as Record<string, unknown>
}

function installPointerStubs(): void {
  for (const [name, stub] of Object.entries(pointerStubs)) {
    if (!originalPointerApis.has(name)) {
      originalPointerApis.set(name, elementPrototype()[name])
    }
    elementPrototype()[name] = stub
  }
}

function removePointerStubs(): void {
  for (const [name, original] of originalPointerApis) {
    elementPrototype()[name] = original
  }
  originalPointerApis.clear()
}

function pointer(target: Element, type: string, x: number, y: number): void {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }))
  flushSync()
}

function key(target: Element, name: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: name }))
  flushSync()
}

function handles(target: HTMLElement): Record<'width' | 'height' | 'both', HTMLElement> {
  const separators = [...target.querySelectorAll('[role="separator"]')] as HTMLElement[]
  expect(separators).toHaveLength(3)
  const byLabel = (name: string) => {
    const handle = separators.find(separator => separator.getAttribute('aria-label') === name)
    expect(handle).toBeDefined()
    return handle as HTMLElement
  }
  return { width: byLabel('Resize width'), height: byLabel('Resize height'), both: byLabel('Resize width and height') }
}

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  installPointerStubs()
  target = document.createElement('div')
  document.body.appendChild(target)
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  target.remove()
  removePointerStubs()
})

describe('Resizable', () => {
  it('renders three cursor-only handles around a normally-sized container', () => {
    instance = mount(Harness, { target, props: {} })
    flushSync()
    const container = target.firstElementChild as HTMLElement
    expect(container.style.width).toBe('200px')
    expect(container.style.height).toBe('150px')
    expect(container.classList.contains('group')).toBe(false)
    // No bound is expressed in CSS until one is set to `'parent'`.
    expect(container.classList.contains('max-w-full')).toBe(false)
    const cursors = { width: 'e-resize', height: 's-resize', both: 'nwse-resize' } as const
    for (const [axis, handle] of Object.entries(handles(target)) as ['width' | 'height' | 'both', HTMLElement][]) {
      expect(handle.getAttribute('tabindex')).toBe('0')
      // No visible grip: the handle is an invisible hit area showing only its
      // resize cursor.
      expect(handle.querySelector('span')).toBeNull()
      expect(handle.classList.contains(`cursor-${cursors[axis]}`)).toBe(true)
    }
  })

  it('drags the right edge to widen without changing the height', () => {
    const onResize = vi.fn()
    instance = mount(Harness, { target, props: { onResize } })
    flushSync()
    const { width } = handles(target)
    pointer(width, 'pointerdown', 100, 50)
    pointer(width, 'pointermove', 150, 90)
    expect(onResize).toHaveBeenLastCalledWith(250, 150)
    pointer(width, 'pointerup', 150, 90)
    expect((target.firstElementChild as HTMLElement).style.width).toBe('250px')
  })

  it('rounds fractional drag deltas to whole pixels', () => {
    const onResize = vi.fn()
    instance = mount(Harness, { target, props: { onResize } })
    flushSync()
    const { both } = handles(target)
    pointer(both, 'pointerdown', 100, 100)
    pointer(both, 'pointermove', 130.7, 70.4)
    expect(onResize).toHaveBeenLastCalledWith(231, 120)
  })

  it('clamps the drag to the configured bounds', () => {
    const onResize = vi.fn()
    instance = mount(Harness, { target, props: { minWidth: 180, maxWidth: 220, onResize } })
    flushSync()
    const { width } = handles(target)
    pointer(width, 'pointerdown', 100, 50)
    pointer(width, 'pointermove', 400, 50)
    expect(onResize).toHaveBeenLastCalledWith(220, 150)
    pointer(width, 'pointermove', 0, 50)
    expect(onResize).toHaveBeenLastCalledWith(180, 150)
  })

  it('drags the corner to resize both axes at once', () => {
    const onResize = vi.fn()
    instance = mount(Harness, { target, props: { onResize } })
    flushSync()
    const { both } = handles(target)
    pointer(both, 'pointerdown', 100, 100)
    pointer(both, 'pointermove', 130, 70)
    expect(onResize).toHaveBeenLastCalledWith(230, 120)
  })

  it('supports arrow keys and Home on the focused handles', () => {
    const sizes: [number, number][] = []
    instance = mount(Harness, {
      target,
      props: {
        onResize: (nextWidth, nextHeight) => sizes.push([nextWidth, nextHeight]),
      },
    })
    flushSync()
    const { width, height } = handles(target)
    key(width, 'ArrowRight')
    expect(sizes.at(-1)).toEqual([216, 150])
    key(height, 'ArrowDown')
    // Each keyed handle reports the latest rendered size, so the height nudge
    // builds on the widened width.
    expect(sizes.at(-1)).toEqual([216, 166])
    // An arrow the handle's axis does not own is ignored.
    key(width, 'ArrowUp')
    expect(sizes.at(-1)).toEqual([216, 166])
    key(width, 'Home')
    expect(sizes.at(-1)).toEqual([0, 166])
  })

  it('exposes complete separator ARIA on every handle', () => {
    instance = mount(Harness, { target, props: { minWidth: 100, minHeight: 80, maxWidth: 500, maxHeight: 400 } })
    flushSync()
    const { width, height, both } = handles(target)
    for (const handle of [width, height, both]) {
      expect(handle.getAttribute('role')).toBe('separator')
      expect(handle.getAttribute('aria-valuenow')).not.toBeNull()
      expect(handle.getAttribute('aria-valuemin')).not.toBeNull()
      expect(handle.getAttribute('aria-valuemax')).not.toBeNull()
      expect(handle.getAttribute('aria-orientation')).toMatch(/^(horizontal|vertical)$/)
      expect(handle.getAttribute('tabindex')).toBe('0')
    }
    expect(width.getAttribute('aria-valuenow')).toBe('200')
    expect(height.getAttribute('aria-valuenow')).toBe('150')
    // The corner reports the width axis plus the full size description.
    expect(both.getAttribute('aria-valuenow')).toBe('200')
    expect(both.getAttribute('aria-valuetext')).toBe('200 by 150 pixels')
  })

  it('jumps to the configured bounds with Home and End', () => {
    const onResize = vi.fn()
    instance = mount(Harness, { target, props: { minWidth: 120, maxWidth: 400, onResize } })
    flushSync()
    const { width } = handles(target)
    key(width, 'End')
    expect(onResize).toHaveBeenLastCalledWith(400, 150)
    key(width, 'Home')
    expect(onResize).toHaveBeenLastCalledWith(120, 150)
  })

  it('keeps the size on End when the maximum is unbounded', () => {
    const onResize = vi.fn()
    instance = mount(Harness, { target, props: { onResize } })
    flushSync()
    key(handles(target).width, 'End')
    expect(onResize).toHaveBeenLastCalledWith(200, 150)
  })

  it('clamps keyboard nudges at the bounds', () => {
    const onResize = vi.fn()
    instance = mount(Harness, { target, props: { minWidth: 200, maxWidth: 200, onResize } })
    flushSync()
    const { width } = handles(target)
    key(width, 'ArrowRight')
    expect(onResize).toHaveBeenLastCalledWith(200, 150)
    key(width, 'ArrowLeft')
    expect(onResize).toHaveBeenLastCalledWith(200, 150)
  })

  it('stops resizing once pointer capture is lost', () => {
    const onResize = vi.fn()
    instance = mount(Harness, { target, props: { onResize } })
    flushSync()
    const { width } = handles(target)
    pointer(width, 'pointerdown', 100, 50)
    pointer(width, 'pointermove', 150, 50)
    expect(onResize).toHaveBeenCalledTimes(1)
    pointer(width, 'lostpointercapture', 150, 50)
    // A later button-less move over the handle must not resize.
    pointer(width, 'pointermove', 250, 50)
    expect(onResize).toHaveBeenCalledTimes(1)
  })

  it('clamps a "parent" bound to the parent box and caps the rendered size', () => {
    const onResize = vi.fn()
    // The mount target is the frame's parent; jsdom has no layout, so stub it.
    Object.defineProperty(target, 'clientWidth', { configurable: true, get: () => 360 })
    Object.defineProperty(target, 'clientHeight', { configurable: true, get: () => 300 })
    instance = mount(Harness, { target, props: { maxWidth: 'parent', maxHeight: 'parent', onResize } })
    flushSync()
    const container = target.firstElementChild as HTMLElement
    // The cap is expressed in CSS too, so the box can never overflow the host.
    expect(container.classList.contains('max-w-full')).toBe(true)
    expect(container.classList.contains('max-h-full')).toBe(true)
    const { width, height, both } = handles(target)

    pointer(width, 'pointerdown', 0, 0)
    pointer(width, 'pointermove', 999, 0)
    expect(onResize).toHaveBeenLastCalledWith(360, 150)

    pointer(height, 'pointerdown', 0, 0)
    pointer(height, 'pointermove', 0, 999)
    expect(onResize).toHaveBeenLastCalledWith(360, 300)

    // The corner clamps both axes to the same box.
    pointer(both, 'pointerdown', 0, 0)
    pointer(both, 'pointermove', 999, 999)
    expect(onResize).toHaveBeenLastCalledWith(360, 300)

    // Keyboard nudges clamp against the parent too.
    key(width, 'ArrowRight')
    expect(onResize).toHaveBeenLastCalledWith(360, 300)
  })

  it('keeps a pointer-only frame out of the tab order', () => {
    instance = mount(Harness, { target, props: { pointerOnlyHandles: true } })
    flushSync()
    const container = target.firstElementChild as HTMLElement
    const { width, height, both } = handles(target)
    expect([width, height, both].map(handle => handle.getAttribute('tabindex'))).toEqual([
      '-1',
      '-1',
      '-1',
    ])

    // The stops never open, however focus moves through the frame: a frame that
    // is page chrome stays pointer-only.
    container.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    flushSync()
    expect([width, height, both].map(handle => handle.getAttribute('tabindex'))).toEqual([
      '-1',
      '-1',
      '-1',
    ])

    // The handles stay usable by pointer and by programmatic focus.
    pointer(width, 'pointerdown', 100, 50)
    pointer(width, 'pointermove', 150, 50)
    expect((target.firstElementChild as HTMLElement).style.width).toBe('250px')
    width.focus()
    expect(document.activeElement).toBe(width)
  })
})
