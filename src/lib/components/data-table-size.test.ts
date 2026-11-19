import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './data-table-size.harness.svelte'
import { SIZE_ORDER, SIZE_PX, type SizeInput } from '#lib/size-scale.js'

// DataTable mounts SearchInput and Checkbox, which reach for browser APIs jsdom
// lacks.
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

function mountTable(props: Record<string, unknown> = {}): void {
  if (instance) {
    unmount(instance)
    instance = null
  }
  instance = mount(Harness as Parameters<typeof mount>[0], { target, props })
  flushSync()
}

const rootStyle = (): string => target.firstElementChild?.getAttribute('style') ?? ''
const metric = (style: string, key: string): number =>
  Number(new RegExp(`--table-${key}:\\s*([\\d.]+)`).exec(style)?.[1])
const bodyCells = (): HTMLElement[] => Array.from(target.querySelectorAll('tbody td'))

// The shell and header chrome added beside the cell metrics: the root gap, the
// toolbar box, the filter row, the empty cell, the header label row, the sort
// stack, and the resize rail.
const CHROME_RATIOS: Record<string, number> = {
  'shell-gap': 0.5,
  'toolbar-min-h': 2,
  'toolbar-gap': 0.375,
  'filter-gap': 0.5,
  'empty-pad-y': 2.5,
  'header-gap': 0.5,
  'header-pad-x': 0.25,
  'sort-gap': 0.25,
  'sort-radius': 0.25,
  'resize-w': 0.375,
}

describe('DataTable cell ratios', () => {
  it('keeps font, line, padding, and the own floors a constant ratio of the size', () => {
    for (const step of SIZE_ORDER) {
      const px = SIZE_PX[step]
      mountTable({ size: step })
      const style = rootStyle()
      expect(metric(style, 'font') / px).toBeCloseTo(0.875)
      expect(metric(style, 'line') / px).toBeCloseTo(1.25)
      expect(metric(style, 'pad-x') / px).toBeCloseTo(0.75)
      expect(metric(style, 'pad-y') / px).toBeCloseTo(0.5)
      expect(metric(style, 'meta-font') / px).toBeCloseTo(0.75)
      expect(metric(style, 'select-col') / px).toBeCloseTo(2.5)
      expect(metric(style, 'min-col') / px).toBeCloseTo(3.75)
      for (const [key, ratio] of Object.entries(CHROME_RATIOS)) {
        expect(metric(style, key) / px, key).toBeCloseTo(ratio)
      }
    }
  })

  it('reproduces the shipped md cells', () => {
    mountTable()
    const style = rootStyle()
    // 14px font on a 20px line, `px-3 py-2` padding, 12px selection count,
    // and the 40/60px floors.
    expect(metric(style, 'font')).toBe(14)
    expect(metric(style, 'line')).toBe(20)
    expect(metric(style, 'pad-x')).toBe(12)
    expect(metric(style, 'pad-y')).toBe(8)
    expect(metric(style, 'meta-font')).toBe(12)
    expect(metric(style, 'select-col')).toBe(40)
    expect(metric(style, 'min-col')).toBe(60)
    for (const [key, ratio] of Object.entries(CHROME_RATIOS)) {
      expect(metric(style, key), key).toBeCloseTo(ratio * 16)
    }
    const first = bodyCells()[0]
    expect(first?.className).toContain('px-[var(--table-pad-x)]')
    expect(first?.className).toContain('py-[var(--table-pad-y)]')
  })

  it('accepts a numeric size', () => {
    mountTable({ size: 22 })
    expect(metric(rootStyle(), 'font')).toBeCloseTo(19.25)
  })

  it('drives the shell and filter row through vars', () => {
    mountTable({ showSearch: true })
    expect(target.firstElementChild?.className).toContain('gap-[var(--table-shell-gap)]')
    const classes = Array.from(target.querySelectorAll('div')).map(el => el.className)
    expect(classes.some(name => name.includes('--table-filter-gap'))).toBe(true)
  })

  it('hands the selection column its floor through the metric var', () => {
    mountTable({ selectable: true })
    const selectHeader = target.querySelector('thead th')
    expect(selectHeader?.className).toContain('w-[var(--table-select-col)]')
  })
})

describe('DataTable dense cells', () => {
  it('applies its own ratio set instead of literal pixels', () => {
    mountTable({ dense: true })
    // 12px font with 8/4px padding, while the base line stays on the table.
    expect(bodyCells()[0]?.getAttribute('style')).toBe('padding: 4px 8px; font-size: 12px;')
  })

  it('scales dense text and padding with the size', () => {
    mountTable({ dense: true, size: 'lg' })
    expect(bodyCells()[0]?.getAttribute('style')).toBe('padding: 4.5px 9px; font-size: 13.5px;')
  })
})
