import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import DateRangePicker from '../DateRangePicker.svelte'

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

function open(theme: Record<string, string> = {}) {
  instance = mount(DateRangePicker, {
    target,
    props: { from: '', to: '', onFrom: () => {}, onTo: () => {}, theme },
  })
  flushSync()
  const trigger = target.querySelector('button[aria-haspopup="dialog"]') as HTMLButtonElement
  trigger.click()
  flushSync()
  return {
    trigger,
    panel: () => document.querySelector('[role="dialog"]') as HTMLElement,
  }
}

function byLabel(label: string): HTMLElement {
  const element = document.querySelector(`[aria-label="${label}"]`)
  if (!(element instanceof HTMLElement)) throw new Error(`no element labelled ${label}`)
  return element
}

describe('DateRangePicker theme', () => {
  it('leaves every part on its default palette without a theme', () => {
    const { trigger } = open()
    expect(trigger.className).toContain('text-slate-500!')
    expect(byLabel('Previous month').className).toContain('text-slate-400')
    expect(document.querySelector('[role="columnheader"]')?.className).toContain('text-slate-500')
    expect(document.querySelector('button[aria-current="date"]')?.className).toContain('text-cyan-300')
  })

  it('applies each theme override and drops the default for that part', () => {
    const { trigger } = open({
      unsetText: 'text-fuchsia-400!',
      navButton: 'text-fuchsia-400',
      columnHeader: 'text-fuchsia-400',
      today: 'text-fuchsia-400',
      metaText: 'text-fuchsia-400',
    })

    expect(trigger.className).toContain('text-fuchsia-400!')
    expect(trigger.className).not.toContain('text-slate-500!')

    const prev = byLabel('Previous month')
    expect(prev.className).toContain('text-fuchsia-400')
    expect(prev.className).not.toContain('text-slate-400')

    const columnHeader = document.querySelector('[role="columnheader"]') as HTMLElement
    expect(columnHeader.className).toContain('text-fuchsia-400')

    const today = document.querySelector('button[aria-current="date"]') as HTMLElement
    expect(today.className).toContain('text-fuchsia-400')

    const clear = [...document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Clear dates') as HTMLElement
    expect(clear.className).toContain('text-fuchsia-400')
  })
})
