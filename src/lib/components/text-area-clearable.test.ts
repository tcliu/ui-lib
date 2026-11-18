import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './text-area.harness.svelte'

// The shared Button the clear affordance composes reads matchMedia through the
// tooltip action, so stub it like the other input tests.
function installDomStubs(): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
  }))
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
  instance = mount(Harness, { target, props })
  flushSync()
}

const areaEl = (): HTMLTextAreaElement => target.querySelector('textarea')!
const clearEl = (): HTMLButtonElement | undefined =>
  Array.from(target.querySelectorAll('button')).find(button => button.getAttribute('aria-label'))
const frame = (): HTMLElement => areaEl().parentElement!

describe('TextArea clearable', () => {
  it('renders no clear button while off or empty', async () => {
    await remount({ value: '' })
    expect(clearEl()).toBeUndefined()

    await remount({ value: 'hi' })
    expect(clearEl()).toBeUndefined()

    await remount({ value: '', clearable: true })
    expect(clearEl()).toBeUndefined()
  })

  it('overlays the editor edge, anchored to the first line', async () => {
    await remount({ value: 'hi', clearable: true })
    // Default accessible name comes from the shared dictionary.
    expect(clearEl()?.getAttribute('aria-label')).toBe('Clear')
    // The editor reserves a size-scaled gutter; the frame carries the metrics.
    expect(areaEl().getAttribute('style')).toContain('padding-right: var(--clear-gutter)')
    expect(frame().className).toContain('relative')
    expect(frame().getAttribute('style')).toContain('--clear-inset: 9px')
    expect(frame().getAttribute('style')).toContain('--clear-gutter: 27px')
    expect(frame().contains(clearEl()!)).toBe(true)
    // The overlay tracks the first line's box, not the editor's height.
    const overlay = clearEl()!.closest('span.absolute')!
    expect(overlay.getAttribute('style')).toContain('top: calc(var(--input-pad-y) + 1px)')
    expect(overlay.getAttribute('style')).toContain('height: var(--input-line)')
  })

  it('reserves the gutter whether the editor is empty or filled', async () => {
    await remount({ value: '', clearable: true })
    expect(clearEl()).toBeUndefined()
    expect(areaEl().getAttribute('style')).toContain('padding-right: var(--clear-gutter)')
    const emptyStyle = areaEl().getAttribute('style')

    await remount({ value: 'hi', clearable: true })
    expect(clearEl()).toBeDefined()
    expect(areaEl().getAttribute('style')).toBe(emptyStyle)
  })

  it('scales the clear metrics and rides a trimmed button share of the size', async () => {
    await remount({ value: 'hi', clearable: true, size: 20 })
    expect(frame().getAttribute('style')).toContain('--clear-inset: 11.25px')
    expect(frame().getAttribute('style')).toContain('--clear-gutter: 33.75px')
    // 0.625 × the field dimension: xs 7.5, md 10, xl 12.5.
    for (const [size, icon] of [
      ['xs', '7.5px'],
      ['md', '10px'],
      ['xl', '12.5px'],
    ] as const) {
      await remount({ value: 'hi', clearable: true, size })
      expect(clearEl()!.style.getPropertyValue('--btn-icon'), size).toBe(icon)
    }
  })

  it('moves outside when told to, anchored to the first line', async () => {
    await remount({ value: 'hi', clearable: true, clearPlacement: 'outside' })
    // The button is a sibling of the editor, not inside a frame.
    expect(areaEl().getAttribute('style')).not.toContain('padding-right')
    expect(frame().className).not.toContain('relative')
    const row = target.firstElementChild as HTMLElement
    expect(row.className).toContain('items-start')
    expect(row.contains(clearEl()!)).toBe(true)
    expect(clearEl()!.parentElement!.getAttribute('style')).toContain(
      'margin-top: calc(var(--input-pad-y) + 1px)',
    )
  })

  it('reserves the outside slot whether the editor is empty or filled', async () => {
    await remount({ value: '', clearable: true, clearPlacement: 'outside' })
    const rowEmpty = target.firstElementChild as HTMLElement
    expect(clearEl()).toBeUndefined()
    const spacer = rowEmpty.querySelector('span[aria-hidden="true"]') as HTMLElement | null
    expect(spacer).not.toBeNull()

    await remount({ value: 'hi', clearable: true, clearPlacement: 'outside' })
    const rowFilled = target.firstElementChild as HTMLElement
    expect(clearEl()).toBeDefined()
    expect(rowFilled.children.length).toBe(rowEmpty.children.length)
    expect(spacer!.className).toContain('w-[var(--clear-box)]')
    expect(clearEl()!.className).toContain('size-[var(--clear-box)]')
  })

  it('offers no clear action on a disabled or read-only editor', async () => {
    await remount({ value: 'hi', clearable: true, disabled: true })
    expect(clearEl()).toBeUndefined()

    await remount({ value: 'hi', clearable: true, readonly: true })
    expect(clearEl()).toBeUndefined()
  })

  it('honours a custom clear label', async () => {
    await remount({ value: 'hi', clearable: true, clearLabel: 'Reset notes' })
    expect(clearEl()?.getAttribute('aria-label')).toBe('Reset notes')
  })

  it('clears the bound value and refocuses the editor on click', async () => {
    await remount({ value: 'hi', clearable: true })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(areaEl().value).toBe('')
    expect(document.activeElement).toBe(areaEl())
    // The cross disappears with the emptied value.
    expect(clearEl()).toBeUndefined()
  })

  it('routes the click to onClear when one is provided', async () => {
    const onClear = vi.fn()
    await remount({ value: 'hi', clearable: true, onClear })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(onClear).toHaveBeenCalledOnce()
    // The handler owns the clear, so the value is untouched here.
    expect(areaEl().value).toBe('hi')
  })

  it('hides the cross while the value matches the default', async () => {
    await remount({ value: 'hi', defaultValue: 'hi', clearable: true })
    expect(clearEl()).toBeUndefined()

    await remount({ value: 'bye', defaultValue: 'hi', clearable: true })
    expect(clearEl()).toBeDefined()
  })

  it('resets the bound value to the default and refocuses on click', async () => {
    await remount({ value: 'bye', defaultValue: 'hi', clearable: true })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(areaEl().value).toBe('hi')
    expect(document.activeElement).toBe(areaEl())
    // The cross disappears with the restored default.
    expect(clearEl()).toBeUndefined()
  })
})
