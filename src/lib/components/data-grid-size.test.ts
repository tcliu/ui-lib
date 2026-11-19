import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './data-grid-size.harness.svelte'
import { SIZE_ORDER, SIZE_PX } from '#lib/size-scale.js'

// DataGrid mounts the toolbar's Button/SelectDropdown and a ResizeObserver, none
// of which jsdom supplies.
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

function mountGrid(props: Record<string, unknown> = {}): void {
  if (instance) {
    unmount(instance)
    instance = null
  }
  instance = mount(Harness as Parameters<typeof mount>[0], { target, props })
  flushSync()
}

const root = (): HTMLElement | null => target.querySelector('[data-testid="data-grid"]')
const rootStyle = (): string => root()?.getAttribute('style') ?? ''
const metric = (style: string, key: string): number =>
  Number(new RegExp(`--grid-${key}:\\s*([\\d.]+)`).exec(style)?.[1])
const toolbarMetric = (style: string, key: string): number =>
  Number(new RegExp(`--gtb-${key}:\\s*([\\d.]+)`).exec(style)?.[1])
const bodyTable = (): HTMLElement | null => target.querySelectorAll('table')[1] ?? null

// The shell chrome added beside the cell metrics: the grid's padding and gap,
// its frame radius, the sort stack, the resize rail, and the empty-state gap.
const CHROME_RATIOS: Record<string, number> = {
  'shell-gap': 0.5,
  'shell-pad': 0.5,
  'root-radius': 0.375,
  'sort-gap': 0.25,
  'action-radius': 0.25,
  'resize-w': 0.375,
  'empty-gap': 0.75,
}
const cellInput = (): HTMLElement | null => target.querySelector('tbody textarea')

describe('DataGrid cell ratios', () => {
  it('keeps text, padding, and the own geometry a constant ratio of the size', () => {
    for (const step of SIZE_ORDER) {
      const px = SIZE_PX[step]
      mountGrid({ size: step })
      const style = rootStyle()
      expect(metric(style, 'font') / px).toBeCloseTo(0.875)
      expect(metric(style, 'line') / px).toBeCloseTo(1.25)
      expect(metric(style, 'pad-x') / px).toBeCloseTo(0.5)
      expect(metric(style, 'pad-y') / px).toBeCloseTo(0.25)
      expect(metric(style, 'selector-font') / px).toBeCloseTo(0.75)
      expect(metric(style, 'selector-pad-x') / px).toBeCloseTo(0.375)
      expect(metric(style, 'row-number-w') / px).toBeCloseTo(2.25)
      expect(metric(style, 'label-row-h') / px).toBeCloseTo(1.5)
      expect(metric(style, 'min-col') / px).toBeCloseTo(8)
      expect(metric(style, 'column-floor') / px).toBeCloseTo(3.75)
      expect(metric(style, 'label-gap') / px).toBeCloseTo(0.375)
      for (const [key, ratio] of Object.entries(CHROME_RATIOS)) {
        expect(metric(style, key) / px, key).toBeCloseTo(ratio)
      }
    }
  })

  it('reproduces the shipped md grid', () => {
    mountGrid()
    const style = rootStyle()
    // 14px font on a 20px line, `px-2 py-1` cell padding, 12px selector text,
    // a 36px row handle, a 24px label row, a 128px column box, and the 60px
    // width-engine floor.
    expect(metric(style, 'font')).toBe(14)
    expect(metric(style, 'line')).toBe(20)
    expect(metric(style, 'pad-x')).toBe(8)
    expect(metric(style, 'pad-y')).toBe(4)
    expect(metric(style, 'selector-font')).toBe(12)
    expect(metric(style, 'row-number-w')).toBe(36)
    expect(metric(style, 'label-row-h')).toBe(24)
    expect(metric(style, 'min-col')).toBe(128)
    expect(metric(style, 'column-floor')).toBe(60)
    for (const [key, ratio] of Object.entries(CHROME_RATIOS)) {
      expect(metric(style, key), key).toBeCloseTo(ratio * 16)
    }
    expect(cellInput()?.className).toContain('px-[var(--grid-pad-x)]')
    expect(cellInput()?.className).toContain('py-[var(--grid-pad-y)]')
    expect(bodyTable()?.className).toContain('text-[length:var(--grid-font)]')
  })

  it('accepts a numeric size', () => {
    mountGrid({ size: 22 })
    expect(metric(rootStyle(), 'font')).toBeCloseTo(19.25)
  })

  it('drives the row-number column template and the select-all cell together', () => {
    mountGrid()
    expect(target.querySelector('colgroup col')?.getAttribute('style')).toBe('width: 36px;')
    const selectAll = target.querySelector('[data-select-all]')
    expect(selectAll?.className).toContain('w-[var(--grid-row-number-w)]')
    expect(selectAll?.getAttribute('style')).toContain('min-width: 36px; max-width: 36px;')
    mountGrid({ size: 'lg' })
    expect(target.querySelector('colgroup col')?.getAttribute('style')).toBe('width: 40.5px;')
  })

  it('scales the toolbar chrome with the grid', () => {
    mountGrid()
    const toolbar = root()?.firstElementChild
    const style = toolbar?.getAttribute('style') ?? ''
    expect(toolbarMetric(style, 'outer-gap')).toBe(12)
    expect(toolbarMetric(style, 'group-gap')).toBe(4)
    expect(toolbarMetric(style, 'count-font')).toBe(12)
    mountGrid({ size: 'lg' })
    const large = root()?.firstElementChild?.getAttribute('style') ?? ''
    expect(toolbarMetric(large, 'count-font')).toBeCloseTo(13.5, 5)
  })

  it('puts selector text and the label row on their own metrics', () => {
    mountGrid()
    expect(target.querySelector('[data-row-selector="1"] span')?.className).toContain(
      'text-[length:var(--grid-selector-font)]',
    )
    expect(target.querySelector('[data-col-selector="0"]')?.className).toContain(
      'h-[var(--grid-label-row-h)]',
    )
  })
})

describe('DataGrid width engine floors', () => {
  it('scales the minimum and default column widths with the size', () => {
    // jsdom reports a zero-width container, so the trailing column resolves to
    // the engine's own floor — 60px at md, 67.5px at lg — and total = row
    // handle + leading column + that floor: 36 + 120 + 60, then
    // 40.5 + 120 + 67.5.
    mountGrid()
    expect(target.querySelector('table')?.getAttribute('style')).toContain('width: 216px;')
    mountGrid({ size: 'lg' })
    expect(target.querySelector('table')?.getAttribute('style')).toContain('width: 228px;')
  })
})
