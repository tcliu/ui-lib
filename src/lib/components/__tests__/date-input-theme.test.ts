import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import DateInput from '../DateInput.svelte'

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

// A range pair renders two fields, so this also covers the themed pair: the
// theme reaches every field's panel.
function open(theme: Record<string, string> = {}) {
  instance = mount(DateInput, {
    target,
    props: { range: true, from: '', to: '', onFrom: () => {}, onTo: () => {}, theme },
  })
  flushSync()
  const trigger = target.querySelector('button') as HTMLButtonElement
  trigger.click()
  flushSync()
  return { trigger, panel: () => document.querySelector('[role="dialog"]') as HTMLElement }
}

function byLabel(label: string): HTMLElement {
  const element = document.querySelector(`[aria-label="${label}"]`)
  if (!(element instanceof HTMLElement)) throw new Error(`no element labelled ${label}`)
  return element
}

describe('DateInput theme', () => {
  it('leaves every part on its default palette without a theme', () => {
    open()
    expect(byLabel('Previous month').className).toContain('text-slate-400')
    expect(document.querySelector('[role="columnheader"]')?.className).toContain('text-slate-500')
    expect(document.querySelector('button[aria-current="date"]')?.className).toContain('text-cyan-300')
  })

  it('applies each theme override and drops the default for that part', () => {
    open({
      navButton: 'text-fuchsia-400',
      columnHeader: 'text-fuchsia-400',
      today: 'text-fuchsia-400',
      metaText: 'text-fuchsia-400',
    })

    const prev = byLabel('Previous month')
    expect(prev.className).toContain('text-fuchsia-400')
    expect(prev.className).not.toContain('text-slate-400')

    const columnHeader = document.querySelector('[role="columnheader"]') as HTMLElement
    expect(columnHeader.className).toContain('text-fuchsia-400')

    const today = document.querySelector('button[aria-current="date"]') as HTMLElement
    expect(today.className).toContain('text-fuchsia-400')

    const clear = document.querySelector('button[aria-label="Clear date"]') as HTMLElement
    // The clear affordance is an icon-only Button now, so the per-part color
    // reaches the summary text and not the button's own ghost palette.
    expect(clear.className).not.toContain('text-fuchsia-400')
    const summary = [...document.querySelectorAll('[role="dialog"] span')].find(span => span.textContent?.trim() === 'From')
    expect(summary?.className).toContain('text-fuchsia-400')
  })
})
