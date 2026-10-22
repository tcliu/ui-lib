import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import BaseDialog from './BaseDialog.svelte'

// jsdom lacks ResizeObserver (positionPanel), matchMedia, and scrollIntoView.
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

function open(props: Record<string, unknown> = {}) {
  instance = mount(BaseDialog, {
    target,
    props: { onCancel: () => {}, ...props },
  })
  flushSync()
  return document.querySelector('[role="dialog"]') as HTMLElement
}

describe('BaseDialog accessible name', () => {
  it('labels the dialog from its title', () => {
    const dialog = open({ title: 'Edit item' })
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
    expect(dialog.hasAttribute('aria-label')).toBe(false)
  })

  it('falls back to a generic name when neither title nor header is set', () => {
    const dialog = open()
    expect(dialog.hasAttribute('aria-labelledby')).toBe(false)
    expect(dialog.getAttribute('aria-label')).toBe('Dialog')
  })

  it('prefers a caller ariaLabel over the generic fallback', () => {
    const dialog = open({ ariaLabel: 'Settings' })
    expect(dialog.getAttribute('aria-label')).toBe('Settings')
  })
})

describe('BaseDialog title id', () => {
  it('never reuses a title id across mounts', async () => {
    const first = open({ title: 'First' }).getAttribute('aria-labelledby')
    await unmount(instance!)
    instance = null
    flushSync()
    const second = open({ title: 'Second' }).getAttribute('aria-labelledby')
    expect(second).toBeTruthy()
    expect(second).not.toBe(first)
  })
})

describe('BaseDialog dismissDisabled', () => {
  it('blocks Escape dismissal while disabled', () => {
    const onCancel = vi.fn()
    open({ title: 'Working', onCancel, dismissDisabled: true })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    flushSync()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('allows Escape dismissal when enabled', () => {
    const onCancel = vi.fn()
    open({ title: 'Working', onCancel })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    flushSync()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
