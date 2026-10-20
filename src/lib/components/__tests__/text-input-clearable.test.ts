import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import TextInput from '../TextInput.svelte'
import Harness from './text-input-clearable.harness.svelte'

// Same DOM stub the other input tests install: the shared Button the clear
// affordance composes reads matchMedia through the tooltip action.
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

async function remount(component: unknown, props: Record<string, unknown> = {}): Promise<void> {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(component as Parameters<typeof mount>[0], { target, props })
  flushSync()
}

const inputEl = (): HTMLInputElement => target.querySelector('input')!
const clearEl = (): HTMLButtonElement | undefined =>
  Array.from(target.querySelectorAll('button')).find(button => button.getAttribute('aria-label'))

describe('TextInput clearable', () => {
  it('renders no clear button while off or empty', async () => {
    await remount(TextInput, { value: '', ariaLabel: 'x' })
    expect(clearEl()).toBeUndefined()

    await remount(TextInput, { value: 'hi', ariaLabel: 'x' })
    expect(clearEl()).toBeUndefined()

    await remount(TextInput, { value: '', clearable: true, ariaLabel: 'x' })
    expect(clearEl()).toBeUndefined()
  })

  it('overlays the field edge when no trailing adornment owns it', async () => {
    await remount(TextInput, { value: 'hi', clearable: true, ariaLabel: 'x' })
    // Default accessible name comes from the shared dictionary.
    expect(clearEl()?.getAttribute('aria-label')).toBe('Clear')
    // The input reserves a size-scaled gutter; the frame carries the metrics.
    expect(inputEl().getAttribute('style')).toContain('padding-right: calc(var(--clear-gutter) + var(--input-clear-offset, 0px))')
    const frame = inputEl().parentElement!
    expect(frame.className).toContain('relative')
    expect(frame.getAttribute('style')).toContain('--clear-inset: 9px')
    expect(frame.getAttribute('style')).toContain('--clear-gutter: 27px')
    expect(frame.contains(clearEl()!)).toBe(true)
  })

  it('reserves the gutter whether the field is empty or filled', async () => {
    await remount(TextInput, { value: '', clearable: true, ariaLabel: 'x' })
    // No cross yet, but the text area is already narrowed so typing causes no
    // reflow.
    expect(clearEl()).toBeUndefined()
    expect(inputEl().getAttribute('style')).toContain('padding-right: calc(var(--clear-gutter) + var(--input-clear-offset, 0px))')
    const emptyStyle = inputEl().getAttribute('style')

    await remount(TextInput, { value: 'hi', clearable: true, ariaLabel: 'x' })
    expect(clearEl()).toBeDefined()
    expect(inputEl().getAttribute('style')).toBe(emptyStyle)
  })

  it('scales the clear metrics with the size', async () => {
    await remount(TextInput, { value: 'hi', clearable: true, size: 20, ariaLabel: 'x' })
    const frame = inputEl().parentElement!
    expect(frame.getAttribute('style')).toContain('--clear-inset: 11.25px')
    expect(frame.getAttribute('style')).toContain('--clear-gutter: 33.75px')
  })

  it('rides a trimmed share of the field so the cross scales with it', async () => {
    // 0.625 × the field dimension: xs 7.5, md 10, xl 12.5.
    for (const [size, icon] of [
      ['xs', '7.5px'],
      ['md', '10px'],
      ['xl', '12.5px'],
    ] as const) {
      await remount(TextInput, { value: 'hi', clearable: true, size, ariaLabel: 'x' })
      expect(clearEl()!.style.getPropertyValue('--btn-icon'), size).toBe(icon)
    }
  })

  it('moves outside when a trailing adornment owns the right edge', async () => {
    await remount(Harness, { trailing: true })
    // The button is a sibling of the field, not inside its frame.
    expect(inputEl().getAttribute('style')).not.toContain('padding-right')
    const row = target.querySelector(':scope > span')!
    expect(row.className).toContain('flex')
    // The row hugs the field: as a flex item (e.g. the showcase demo stage)
    // it must keep the field's width, not occupy the whole row.
    expect(row.className).not.toContain('w-full')
    expect(row.getAttribute('style')).toContain('gap: 6px')
    expect(row.contains(clearEl()!)).toBe(true)
    // The trailing adornment stays inside the field.
    expect(target.querySelector('[data-testid=adornment]')).not.toBeNull()
  })

  it('stays inside when told to, even with a trailing adornment', async () => {
    await remount(Harness, { trailing: true, clearPlacement: 'inside' })
    expect(inputEl().getAttribute('style')).toContain('padding-right: calc(var(--clear-gutter) + var(--input-clear-offset, 0px))')
    const frame = inputEl().parentElement!
    expect(frame.contains(clearEl()!)).toBe(true)
  })

  it('shows no outside cross until a value exists', async () => {
    await remount(Harness, { trailing: true, clearable: true, value: '' })
    // The outside row persists (so the input is never recreated) but the cross
    // stays out until there is something to clear.
    expect(clearEl()).toBeUndefined()
    const row = target.querySelector(':scope > span')!
    expect(row.className).toContain('flex')
    expect(target.querySelector('[data-testid=adornment]')).not.toBeNull()
  })

  it('reserves the outside slot whether the field is empty or filled', async () => {
    await remount(Harness, { trailing: true, clearable: true, value: '' })
    const rowEmpty = target.querySelector(':scope > span')!
    // No cross yet, but a spacer holds its slot so the input keeps the same
    // width once a value shows the button.
    expect(clearEl()).toBeUndefined()
    const spacer = rowEmpty.querySelector('span[aria-hidden="true"]') as HTMLElement | null
    expect(spacer).not.toBeNull()

    await remount(Harness, { trailing: true, clearable: true, value: 'hi' })
    const rowFilled = target.querySelector(':scope > span')!
    expect(clearEl()).toBeDefined()
    expect(rowFilled.children.length).toBe(rowEmpty.children.length)
    // The spacer and the cross reserve the same box (`--clear-box`, plus the
    // button's touch floor), which is what keeps the input's width fixed.
    expect(spacer!.className).toContain('w-[var(--clear-box)]')
    expect(spacer!.className).toContain('h-[var(--clear-box)]')
    expect(spacer!.className).toContain('max-phone:w-11')
    expect(clearEl()!.className).toContain('size-[var(--clear-box)]')
    expect(clearEl()!.style.getPropertyValue('--btn-icon')).toBe('10px')
  })

  it('renders a caller trailer outside the field', async () => {
    await remount(Harness, { trailer: true, clearable: false })
    const row = target.querySelector(':scope > span')!
    expect(row.contains(target.querySelector('[data-testid=trailer]')!)).toBe(true)
    // The trailer is outside, so the field keeps its own padding.
    expect(inputEl().getAttribute('style')).not.toContain('padding-right')
  })

  it('offers no clear action on a disabled or read-only field', async () => {
    await remount(TextInput, { value: 'hi', clearable: true, disabled: true, ariaLabel: 'x' })
    expect(clearEl()).toBeUndefined()

    await remount(TextInput, { value: 'hi', clearable: true, readonly: true, ariaLabel: 'x' })
    expect(clearEl()).toBeUndefined()
  })

  it('honours a custom clear label', async () => {
    await remount(TextInput, { value: 'hi', clearable: true, clearLabel: 'Reset field', ariaLabel: 'x' })
    expect(clearEl()?.getAttribute('aria-label')).toBe('Reset field')
  })

  it('clears the bound value and refocuses the field on click', async () => {
    await remount(TextInput, { value: 'hi', clearable: true, ariaLabel: 'x' })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(inputEl().value).toBe('')
    expect(document.activeElement).toBe(inputEl())
    // The cross disappears with the emptied value.
    expect(clearEl()).toBeUndefined()
  })

  it('routes the click to onClear when one is provided', async () => {
    const onClear = vi.fn()
    await remount(TextInput, { value: 'hi', clearable: true, ariaLabel: 'x', onClear })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(onClear).toHaveBeenCalledOnce()
    // The handler owns the clear, so the value is untouched here.
    expect(inputEl().value).toBe('hi')
  })

  it('hides the cross while the value matches the default', async () => {
    await remount(TextInput, { value: 'hi', defaultValue: 'hi', clearable: true, ariaLabel: 'x' })
    expect(clearEl()).toBeUndefined()

    await remount(TextInput, { value: 'bye', defaultValue: 'hi', clearable: true, ariaLabel: 'x' })
    expect(clearEl()).toBeDefined()
  })

  it('shows the cross for an empty value that differs from the default', async () => {
    await remount(TextInput, { value: '', defaultValue: 'hi', clearable: true, ariaLabel: 'x' })
    expect(clearEl()).toBeDefined()
  })

  it('resets the bound value to the default and refocuses the field on click', async () => {
    await remount(TextInput, { value: 'bye', defaultValue: 'hi', clearable: true, ariaLabel: 'x' })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(inputEl().value).toBe('hi')
    expect(document.activeElement).toBe(inputEl())
    // The cross disappears with the restored default.
    expect(clearEl()).toBeUndefined()
  })
})
