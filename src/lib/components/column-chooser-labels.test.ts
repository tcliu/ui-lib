import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import ColumnChooser from './ColumnChooser.svelte'

// jsdom lacks ResizeObserver (positionPanel) and matchMedia.
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

// The rename the task tracks: `triggerLabel`/`resetAriaLabel` replaced the
// former `label`/`resetLabel` props.
function render(props: Record<string, unknown> = {}) {
  const onReset = vi.fn()
  instance = mount(ColumnChooser, {
    target,
    props: {
      triggerLabel: 'Choose columns',
      resetAriaLabel: 'Reset columns',
      columns: [{ key: 'name', header: 'Name', checked: true }],
      onToggle: () => {},
      onReset,
      ...props,
    },
  })
  flushSync()
  return { onReset, trigger: () => target.querySelector('button[aria-label="Choose columns"]') as HTMLButtonElement, reset: () => target.querySelector('button[aria-label="Reset columns"]') as HTMLButtonElement }
}

describe('ColumnChooser labels', () => {
  it('names the trigger and reset button from triggerLabel/resetAriaLabel', () => {
    const ui = render()
    expect(ui.trigger()).not.toBeNull()
    expect(ui.reset()).not.toBeNull()
  })

  it('honors custom label strings', () => {
    const ui = render({ triggerLabel: 'Team columns', resetAriaLabel: 'Show all' })
    expect(target.querySelector('button[aria-label="Team columns"]')).not.toBeNull()
    expect(target.querySelector('button[aria-label="Show all"]')).not.toBeNull()
  })

  it('opens the panel under the trigger label', () => {
    render({ triggerLabel: 'Team columns' })
    ;(target.querySelector('button[aria-label="Team columns"]') as HTMLButtonElement).click()
    flushSync()
    const panel = document.querySelector('[role="group"]')
    expect(panel?.getAttribute('aria-label')).toBe('Team columns')
  })

  it('fires onReset from the reset button', () => {
    const ui = render()
    ui.reset().click()
    flushSync()
    expect(ui.onReset).toHaveBeenCalledTimes(1)
  })
})
