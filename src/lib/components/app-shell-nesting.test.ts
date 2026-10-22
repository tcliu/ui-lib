import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './app-shell-nesting.harness.svelte'

// jsdom provides neither ResizeObserver nor matchMedia; AppShell's onMount
// registers both.
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

describe('AppShell nesting', () => {
  it('suppresses a nested floating pane while an ancestor overlay is open', () => {
    instance = mount(Harness, { target, props: { outerOpen: true } })
    flushSync()
    const suppressed = target.querySelector('[data-suppressed]')
    expect(suppressed).not.toBeNull()
    expect(suppressed?.getAttribute('aria-hidden')).toBe('true')
    expect((suppressed as HTMLElement).style.visibility).toBe('hidden')
    // The ancestor's own floating pane stays visible.
    const outerWrapper = target.querySelector('[data-drawer-presentation="floating"]')
    expect(outerWrapper?.hasAttribute('data-suppressed')).toBe(false)
  })

  it('restores the nested pane once the ancestor overlay closes', () => {
    instance = mount(Harness, { target, props: { outerOpen: false } })
    flushSync()
    expect(target.querySelector('[data-suppressed]')).toBeNull()
    expect(target.querySelectorAll('[data-drawer-presentation="floating"]').length).toBeGreaterThan(0)
  })
})
