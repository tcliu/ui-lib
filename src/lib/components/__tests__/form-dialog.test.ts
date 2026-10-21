import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import FormDialog from '../FormDialog.svelte'
import Harness from './form-dialog.harness.svelte'

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

// The dialog portals into `document.body`, so the queries are page-wide; each
// open replaces the previous mount so a leftover dialog never answers them.
async function open(props: Record<string, unknown> = {}) {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(FormDialog, {
    target,
    props: {
      title: 'Edit record',
      closeLabel: 'Close',
      saveLabel: 'Save',
      resetLabel: 'Reset',
      discardTitle: 'Discard unsaved changes?',
      discardMessage: 'Your changes will be lost.',
      discardLabel: 'Discard',
      dirty: true,
      onSave: () => {},
      onReset: () => {},
      onClose: () => {},
      ...props,
    },
  })
  flushSync()
  return {
    // The dialog portals into `document.body`, so the queries are page-wide;
    // each open replaces the previous mount so a leftover dialog never
    // answers them. A panel holds its own close icon, while the overlay's
    // dismiss button sits outside it.
    panels: () => [...document.querySelectorAll('[role="dialog"]')],
    closeIcon: (index = 0) =>
      [...(document.querySelectorAll('[role="dialog"]')[index]?.querySelectorAll('button') ?? [])].find(
        button => button.getAttribute('aria-label') === 'Close',
      ) as HTMLButtonElement | undefined,
    button: (label: string) =>
      [...document.querySelectorAll('button')].find(button => button.textContent?.trim() === label) as
        | HTMLButtonElement
        | undefined,
    overlay: () => document.querySelector('[data-testid="dialog-overlay"]') as HTMLElement,
    form: () => document.querySelector('form') as HTMLFormElement,
  }
}

describe('FormDialog footer', () => {
  it('disables the save button while the draft is clean', async () => {
    const ui = await open({ dirty: false })
    expect(ui.button('Save')?.disabled).toBe(true)
  })

  it('enables the save button once the draft is dirty', async () => {
    const ui = await open()
    expect(ui.button('Save')?.disabled).toBe(false)
  })

  it('disables the save button when the caller reports an invalid draft', async () => {
    const ui = await open({ saveDisabled: true })
    expect(ui.button('Save')?.disabled).toBe(true)
  })

  it('disables the reset button while the draft is clean', async () => {
    const ui = await open({ dirty: false })
    expect(ui.button('Reset')?.disabled).toBe(true)
  })

  it('resets the draft when the draft is dirty', async () => {
    const onReset = vi.fn()
    const ui = await open({ onReset })
    expect(ui.button('Reset')?.disabled).toBe(false)
    ui.button('Reset')?.click()
    flushSync()
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('omits the reset button when no reset label is given', async () => {
    const ui = await open({ resetLabel: undefined })
    expect(ui.button('Reset')).toBeUndefined()
    expect(ui.button('Save')).toBeTruthy()
  })

  it('disables both footer buttons while pending', async () => {
    const ui = await open({ pending: true })
    expect(ui.button('Save')?.disabled).toBe(true)
    expect(ui.button('Reset')?.disabled).toBe(true)
  })

  it('saves through the form submit path', async () => {
    const onSave = vi.fn()
    const ui = await open({ onSave })
    ui.form().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    flushSync()
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('ignores a submit while the draft is clean', async () => {
    const onSave = vi.fn()
    const ui = await open({ dirty: false, onSave })
    ui.form().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    flushSync()
    expect(onSave).not.toHaveBeenCalled()
  })
})

describe('FormDialog custom footer', () => {
  it('replaces the built-in row with the caller footer', async () => {
    if (instance) {
      await unmount(instance)
      instance = null
    }
    instance = mount(Harness, { target, props: { customFooter: true } })
    flushSync()
    const buttons = [...document.querySelectorAll('button')].map(button => button.textContent?.trim())
    expect(buttons).toContain('Custom save')
    expect(buttons).not.toContain('Save')
    expect(buttons).not.toContain('Reset')
  })

  it('lets a caller footer submit the form', async () => {
    const onSave = vi.fn()
    if (instance) {
      await unmount(instance)
      instance = null
    }
    instance = mount(Harness, { target, props: { customFooter: true, onSave } })
    flushSync()
    const custom = document.querySelector('[data-testid="custom-save"]') as HTMLButtonElement
    custom.click()
    flushSync()
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})

describe('FormDialog discard prompt', () => {
  it('closes directly when a clean draft is dismissed', async () => {
    const onClose = vi.fn()
    const ui = await open({ dirty: false, onClose })
    ui.closeIcon()?.click()
    flushSync()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(ui.panels()).toHaveLength(1)
  })

  it('asks before discarding a dirty draft', async () => {
    const onClose = vi.fn()
    const ui = await open({ onClose })
    ui.closeIcon()?.click()
    flushSync()
    expect(onClose).not.toHaveBeenCalled()
    expect(ui.panels()).toHaveLength(2)
    expect(ui.button('Discard')).toBeTruthy()
  })

  it('discards the draft when the confirm is confirmed', async () => {
    const onClose = vi.fn()
    const ui = await open({ onClose })
    ui.closeIcon()?.click()
    flushSync()
    ui.button('Discard')?.click()
    flushSync()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('returns to the form when the confirm is dismissed', async () => {
    const onClose = vi.fn()
    const ui = await open({ onClose })
    ui.closeIcon()?.click()
    flushSync()
    // The confirm's own close icon: the default keeps the draft.
    ui.closeIcon(1)?.click()
    flushSync()
    expect(onClose).not.toHaveBeenCalled()
    expect(ui.panels()).toHaveLength(1)
  })

  it('discards the draft when the confirm is dismissed under confirmOnDismiss', async () => {
    const onClose = vi.fn()
    const ui = await open({ onClose, confirmOnDismiss: true })
    ui.closeIcon()?.click()
    flushSync()
    ui.closeIcon(1)?.click()
    flushSync()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('blocks the dismissal while pending', async () => {
    const onClose = vi.fn()
    const ui = await open({ onClose, pending: true })
    ui.closeIcon()?.click()
    flushSync()
    ui.overlay().click()
    flushSync()
    expect(onClose).not.toHaveBeenCalled()
    expect(ui.panels()).toHaveLength(1)
  })
})
