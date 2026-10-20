import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import ConfirmDialog from '../ConfirmDialog.svelte'

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
  instance = mount(ConfirmDialog, {
    target,
    props: { title: 'Delete item', message: 'This cannot be undone.', confirmLabel: 'Delete', onConfirm: () => {}, ...props },
  })
  flushSync()
  return {
    dialog: () => document.querySelector('[role="dialog"]') as HTMLElement,
    confirm: () =>
      [...document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Delete') as HTMLButtonElement,
    overlay: () => document.querySelector('[data-testid="dialog-overlay"]') as HTMLElement,
    closeIcon: () => [...document.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === 'Close dialog') as HTMLButtonElement,
  }
}

function pressEscape(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  flushSync()
}

describe('ConfirmDialog dismiss routing', () => {
  it('routes Escape to onCancel when one is provided', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    open({ onConfirm, onCancel })
    pressEscape()
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('falls back to onConfirm for Escape when no onCancel is passed', () => {
    const onConfirm = vi.fn()
    open({ onConfirm })
    pressEscape()
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('routes Escape, overlay, and the close icon to the confirm under confirmOnDismiss', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const ui = open({ onConfirm, onCancel, confirmOnDismiss: true })

    pressEscape()
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()

    ui.overlay().click()
    flushSync()
    expect(onConfirm).toHaveBeenCalledTimes(2)

    ui.closeIcon().click()
    flushSync()
    expect(onConfirm).toHaveBeenCalledTimes(3)
  })

  it('keeps the safe cancel on overlay and close without confirmOnDismiss', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const ui = open({ onConfirm, onCancel })
    ui.overlay().click()
    flushSync()
    ui.closeIcon().click()
    flushSync()
    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

describe('ConfirmDialog props', () => {
  it('honors the confirm button size and accent', () => {
    const ui = open({ buttonSize: 'xl', accent: 'emerald' })
    expect(ui.confirm().getAttribute('style')).toContain('--btn-font: 16.25px')
    expect(ui.confirm().className).toContain('bg-emerald-500')
  })

  it('defaults the confirm button to md and the rose accent', () => {
    const ui = open()
    expect(ui.confirm().getAttribute('style')).toContain('--btn-font: 13px')
    expect(ui.confirm().className).toContain('bg-rose-500')
  })

  it('honors the width and height variants on the panel', () => {
    const ui = open({ widthVariant: 'xl', heightVariant: 'md' })
    expect(ui.dialog().className).toContain('max-w-xl')
    expect(ui.dialog().className).toContain('h-112')
  })

  it('applies the size shorthand to both panel axes', () => {
    const ui = open({ size: 'lg' })
    expect(ui.dialog().className).toContain('max-w-lg')
    expect(ui.dialog().className).toContain('h-128')
  })

  it('lets an explicit variant win over the size shorthand', () => {
    const ui = open({ size: 'lg', widthVariant: 'xl' })
    expect(ui.dialog().className).toContain('max-w-xl')
    expect(ui.dialog().className).toContain('h-128')
  })
})

describe('ConfirmDialog pending dismissal', () => {
  it('blocks Escape, overlay, and the close icon while pending', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const ui = open({ onConfirm, onCancel, confirmOnDismiss: true, pending: true })

    pressEscape()
    ui.overlay().click()
    flushSync()
    ui.closeIcon().click()
    flushSync()

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
    expect(ui.confirm().disabled).toBe(true)
  })
})
