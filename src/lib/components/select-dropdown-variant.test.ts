import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import SelectDropdown from './SelectDropdown.svelte'

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

function triggerClass(props: Record<string, unknown> = {}): string {
  instance = mount(SelectDropdown, {
    target,
    props: {
      options: [{ value: 'one' }],
      ariaLabel: 'Pick',
      onSelect: () => {},
      ...props,
    },
  })
  flushSync()
  return target.querySelector('button[role="combobox"]')?.className ?? ''
}

describe('SelectDropdown chrome variants', () => {
  it('draws the bordered trigger by default', () => {
    const classes = triggerClass()
    expect(classes).toContain('border-slate-700')
    expect(classes).toContain('bg-slate-950')
    expect(classes).toContain('focus-visible:ring-2')
  })

  it('drops the border, surface, and focus ring when embedded', () => {
    const classes = triggerClass({ variant: 'embedded' })
    expect(classes).toContain('bg-transparent')
    expect(classes).not.toContain('border-slate-700')
    expect(classes).not.toContain('bg-slate-950')
    expect(classes).not.toContain('focus-visible:ring-2')
  })

  it('keeps the surface but drops the outline with hideOutline', () => {
    const classes = triggerClass({ hideOutline: true })
    expect(classes).toContain('bg-slate-950')
    expect(classes).not.toContain('border-slate-700')
    expect(classes).not.toContain('focus-visible:ring-2')
  })

  it('lets buttonClass own the trigger', () => {
    const classes = triggerClass({ buttonClass: 'custom-trigger', variant: 'embedded' })
    expect(classes).toBe('custom-trigger')
  })
})
