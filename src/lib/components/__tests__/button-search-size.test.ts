import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Button from '../Button.svelte'
import SearchInput from '../SearchInput.svelte'

// jsdom lacks matchMedia; stub it so mounting is a layout no-op.
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

describe('Button numeric size', () => {
  it('renders named sizes exactly as before', () => {
    instance = mount(Button, { target, props: { size: 'sm' } })
    flushSync()
    expect(target.innerHTML).toContain('px-2.5')
  })

  it('snaps numbers to the nearest step', () => {
    instance = mount(Button, { target, props: { size: 14 } })
    flushSync()
    // 14 resolves to the xs step for the button chrome.
    expect(target.innerHTML).toContain('px-2 ')
    expect(target.innerHTML).not.toContain('px-2.5')
  })
})

describe('SearchInput numeric size', () => {
  it('keeps stepped chrome while the icon scales continuously', () => {
    instance = mount(SearchInput, { target, props: { value: '', ariaLabel: 'Search', size: 14 } })
    flushSync()
    // 14 resolves below sm: sm chrome (pl-7) with a 14px icon.
    expect(target.querySelector('input')?.className).toContain('pl-7')
    expect(target.querySelector('svg')?.getAttribute('width')).toBe('14')
  })
})
