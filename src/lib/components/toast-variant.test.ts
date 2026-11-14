import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Toast from './Toast.svelte'

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

let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  installDomStubs()
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  vi.unstubAllGlobals()
})

function toastClass(props: Record<string, unknown> = {}): string {
  instance = mount(Toast, {
    target: document.body,
    props: { message: 'Saved', closeLabel: 'Close', onClose: () => {}, ...props },
  })
  flushSync()
  return document.body.querySelector('[role="status"]')?.className ?? ''
}

describe('Toast presentation variants', () => {
  it('soft is the default: tinted surface with a thick left bar', () => {
    const classes = toastClass({ type: 'success' })
    expect(classes).toContain('bg-[var(--toast-success-bg)]')
    expect(classes).toContain('border-l-[var(--toast-success-border)]')
  })

  it('solid fills the surface with the type background and foreground', () => {
    const classes = toastClass({ type: 'error', variant: 'solid' })
    expect(classes).toContain('bg-[var(--toast-error-bg)]')
    expect(classes).toContain('text-[var(--toast-error-fg)]')
    expect(classes).not.toContain('border-l-[var(--toast-error-border)]')
  })

  it('outline keeps the page surface with a type-colored frame', () => {
    const classes = toastClass({ type: 'warning', variant: 'outline' })
    expect(classes).toContain('border-[var(--toast-warning-border)]')
    expect(classes).toContain('bg-slate-950/95')
    expect(classes).toContain('text-slate-100')
  })
})
