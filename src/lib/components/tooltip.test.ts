import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './tooltip.harness.svelte'

// Tooltip attaches hover/focus listeners only when the device reports hover.
// jsdom lacks matchMedia and requestAnimationFrame.
function installDomStubs(): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
  }))
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
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

function render(mode: 'explicit' | 'anchor' = 'explicit'): HTMLElement {
  instance = mount(Harness, { target, props: { mode } })
  flushSync()
  const trigger = target.querySelector('button') ?? target.querySelector('#anchor-parent')
  if (!(trigger instanceof HTMLElement)) throw new Error('trigger not found')
  return trigger
}

const tip = (): HTMLElement | null => document.querySelector('[role="tooltip"]')

async function settle(): Promise<void> {
  await Promise.resolve()
  flushSync()
}

describe('Tooltip lifecycle', () => {
  it('shows on pointer enter and hides on pointer leave', async () => {
    const trigger = render()
    expect(tip()).toBeNull()

    trigger.dispatchEvent(new MouseEvent('mouseenter'))
    flushSync()
    expect(tip()?.textContent).toBe('tip-text')

    trigger.dispatchEvent(new MouseEvent('mouseleave'))
    await settle()
    expect(tip()).toBeNull()
  })

  it('shows on keyboard focus and hides on blur', async () => {
    const trigger = render()

    trigger.dispatchEvent(new FocusEvent('focusin'))
    flushSync()
    expect(tip()?.textContent).toBe('tip-text')

    trigger.dispatchEvent(new FocusEvent('focusout'))
    await settle()
    expect(tip()).toBeNull()
  })

  it('falls back to the anchor parent as the trigger', () => {
    const anchorParent = render('anchor')
    anchorParent.dispatchEvent(new MouseEvent('mouseenter'))
    flushSync()
    expect(tip()?.textContent).toBe('tip-text')
  })

  it('tears the tooltip down with the component', async () => {
    const trigger = render()
    trigger.dispatchEvent(new MouseEvent('mouseenter'))
    flushSync()
    expect(tip()).not.toBeNull()

    await unmount(instance!)
    instance = null
    expect(tip()).toBeNull()
  })
})
