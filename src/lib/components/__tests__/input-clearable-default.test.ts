import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import PasswordInput from '../PasswordInput.svelte'
import SearchInput from '../SearchInput.svelte'
import AutoComplete from '../AutoComplete.svelte'

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
// The visibility toggle on PasswordInput is also a labelled button, so match
// the clear's own accessible name rather than any labelled button.
const clearEl = (): HTMLButtonElement | null => target.querySelector('button[aria-label="Clear"]')

const CASES = [
  { name: 'PasswordInput', component: () => PasswordInput, extra: {} },
  { name: 'SearchInput', component: () => SearchInput, extra: { ariaLabel: 'x' } },
  { name: 'AutoComplete', component: () => AutoComplete, extra: { options: ['a', 'b'], ariaLabel: 'x' } },
] as const

describe.each(CASES)('$name clearable defaultValue', ({ component, extra }) => {
  it('hides the cross while the value matches the default', async () => {
    await remount(component(), { value: 'hi', defaultValue: 'hi', clearable: true, ...extra })
    expect(clearEl()).toBeNull()

    await remount(component(), { value: 'bye', defaultValue: 'hi', clearable: true, ...extra })
    expect(clearEl()).not.toBeNull()
  })

  it('shows the cross for an empty value that differs from the default', async () => {
    await remount(component(), { value: '', defaultValue: 'hi', clearable: true, ...extra })
    expect(clearEl()).not.toBeNull()
  })

  it('resets the bound value to the default and refocuses the field on click', async () => {
    await remount(component(), { value: 'bye', defaultValue: 'hi', clearable: true, ...extra })
    clearEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(inputEl().value).toBe('hi')
    expect(document.activeElement).toBe(inputEl())
    // The cross disappears with the restored default.
    expect(clearEl()).toBeNull()
  })
})
