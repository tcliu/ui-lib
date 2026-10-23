import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import ChipDropdown from './ChipDropdown.svelte'

// jsdom lacks ResizeObserver (positionPanel), matchMedia, and scrollIntoView
// (revealInScrollport); stub them so mounting is a layout no-op.
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

const options = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
]

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

function mountChip(props: Record<string, unknown> = {}): void {
  instance = mount(ChipDropdown, {
    target,
    props: { label: 'Active', ariaLabel: 'Status', options, onSelect: () => {}, ...props },
  })
  flushSync()
}

const rootStyle = (): string => target.querySelector('div.relative')?.getAttribute('style') ?? ''

describe('ChipDropdown size', () => {
  it('defaults to md: original chip metrics with the select-size chevron', () => {
    mountChip({ clearable: true, activeValue: 'paused' })
    expect(rootStyle()).toContain('--chip-font: 12px')
    expect(rootStyle()).toContain('--chip-line: 16px')
    expect(rootStyle()).toContain('--chip-pad-x: 8px')
    expect(rootStyle()).toContain('--chip-gap: 4px')
    // Chevron rides SelectDropdown's 0.625 share: 0.625 * 16 = 10 → 10 *
    // ICON_RATIO. The clear cross takes the same share, forwarded to the inner
    // Button, whose own box sizes the glyph.
    expect(target.querySelector('svg')?.getAttribute('width')).toBe('8.125')
    expect(target.querySelector('button[aria-label="Clear"]')?.getAttribute('style')).toContain('--btn-icon: 10px')
    // The marker uses the select trigger's neutral treatment, not the chip's
    // variant-tinted inherited color.
    expect(target.querySelector('svg')?.getAttribute('class')).toBe('shrink-0 text-slate-400')
  })

  it('scales every metric from a numeric size, including the clear cross', () => {
    mountChip({ size: 20, clearable: true, activeValue: 'paused' })
    expect(rootStyle()).toContain('--chip-font: 15px')
    expect(rootStyle()).toContain('--chip-pad-x: 10px')
    expect(rootStyle()).toContain('--chip-gap: 5px')
    // Chevron 0.625 * 20 = 12.5 → 12.5 * ICON_RATIO.
    expect(target.querySelector('svg')?.getAttribute('width')).toBe('10.15625')
    // The clear cross takes the same 0.625 share, forwarded to the inner
    // Button, which sizes the glyph from its own box.
    expect(target.querySelector('button[aria-label="Clear"]')?.getAttribute('style')).toContain('--btn-icon: 12.5px')
  })

  it('accepts a named step', () => {
    mountChip({ size: 'lg' })
    // lg = 18 → font 0.75 * 18.
    expect(rootStyle()).toContain('--chip-font: 13.5px')
  })

  it('scales the option panel rows with the size, like SelectDropdown', () => {
    mountChip({ size: 20, clearable: true, activeValue: 'paused' })
    target.querySelector('button[role=combobox]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    const row = document.querySelector<HTMLElement>('[role=listbox] [role=option]')
    // Row font 0.75 * 20; the size-scaled min-width floors the fit panel.
    expect(row?.getAttribute('style')).toContain('--chip-panel-font: 15px')
    expect(row?.getAttribute('class')).toContain('min-w-[var(--chip-panel-min-w)]')
    expect(document.querySelector('[role=listbox]')?.getAttribute('class')).toContain('w-max max-w-xs')
  })
})
