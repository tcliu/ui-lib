import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount, type ComponentProps } from 'svelte'
import BarChart, { type ChartColumn } from './BarChart.svelte'
import { SIZE_PX } from '#lib/size-scale.js'

// jsdom lacks ResizeObserver (the Tooltip's positionPanel), matchMedia,
// requestAnimationFrame, and scrollIntoView; stub them so mounting is a layout
// no-op and the Tooltip reports a hover-capable device.
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
    matches: true,
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
  }))
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  if (typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = () => {}
  }
}

const COLUMNS: ChartColumn[] = [
  {
    label: 'A',
    segments: [
      { value: 5, label: 'Sessions' },
      { value: 3, label: 'Retries' },
    ],
  },
  { label: 'B', segments: [{ value: 10, label: 'Sessions' }] },
]

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

// Each render starts from a fresh instance, so a test that renders twice reads
// the latest chart rather than the first one still attached to the target.
async function render(props: ComponentProps<typeof BarChart>): Promise<void> {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(BarChart, { target, props })
  flushSync()
}

const root = (): HTMLElement => target.firstElementChild as HTMLElement
const plot = (): HTMLElement => target.querySelector<HTMLElement>('[role="img"]')!
const plotColumns = (): HTMLElement[] => [...plot().querySelectorAll<HTMLElement>(':scope > div')]
const bars = (): HTMLElement[] => plotColumns().map(column => column.lastElementChild as HTMLElement)
// Legend rows are the only flex-inline spans under the root (the axis labels
// are plain spans, and each swatch is an `<i>`).
const legendText = (): string[] =>
  [...target.querySelectorAll<HTMLElement>('span.inline-flex')].map(row =>
    (row.textContent ?? '').replace(/\s+/g, ' ').trim(),
  )

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

describe('BarChart columns', () => {
  it('sizes each column to its total share of the tallest, stacking segments by value', async () => {
    await render({ columns: COLUMNS })
    const heights = bars().map(bar => bar.style.height)
    // Totals 8 and 10, so the tallest column reaches the top of the plot.
    expect(heights).toEqual(['80%', '100%'])
    const stacked = [...bars()[0]!.children] as HTMLElement[]
    expect(stacked.map(segment => segment.style.flexGrow)).toEqual(['5', '3'])
    // Default tones cycle by segment index: cyan then violet.
    expect(stacked[0]!.className).toContain('bg-cyan-500/60')
    expect(stacked[1]!.className).toContain('bg-violet-500/60')
    const plain = [...bars()[1]!.children] as HTMLElement[]
    expect(plain).toHaveLength(1)
    expect(plain[0]!.className).toContain('bg-cyan-500/60')
  })

  it('floors a zero column at 2% so it stays visible', async () => {
    await render({
      columns: [
        { label: 'A', segments: [{ value: 0, label: 'x' }] },
        { label: 'B', segments: [{ value: 4, label: 'x' }] },
      ],
    })
    expect(bars().map(bar => bar.style.height)).toEqual(['2%', '100%'])
  })

  it('honours an explicit segment tone', async () => {
    await render({
      columns: [
        {
          label: 'A',
          segments: [
            { value: 1, tone: 'rose' },
            { value: 1, tone: 'amber', label: 'b' },
          ],
        },
      ],
    })
    const segments = [...bars()[0]!.children] as HTMLElement[]
    expect(segments[0]!.className).toContain('bg-rose-500/60')
    expect(segments[1]!.className).toContain('bg-amber-500/60')
  })

  it('anchors a tooltip only on a column that carries a tip', async () => {
    await render({
      columns: [
        { label: 'A', segments: [{ value: 1, label: 'x' }], tip: 'A — 1' },
        { label: 'B', segments: [{ value: 1, label: 'x' }] },
      ],
    })
    expect(plotColumns()[0]!.querySelector('span.hidden')).not.toBeNull()
    expect(plotColumns()[1]!.querySelector('span.hidden')).toBeNull()
  })

  it('shows a column tip through the shared Tooltip on hover', async () => {
    await render({ columns: [{ label: 'A', segments: [{ value: 1, label: 'x' }], tip: 'A — 1' }] })
    // The tip portals to document.body, so assert page-wide.
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    plotColumns()[0]!.dispatchEvent(new MouseEvent('mouseenter'))
    flushSync()
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('A — 1')
  })
})

describe('BarChart legend', () => {
  it('sums distinct labelled segments in first-seen order', async () => {
    await render({ columns: COLUMNS })
    expect(legendText()).toEqual(['Sessions 15', 'Retries 3'])
  })

  it('hides the legend when disabled or nothing is labelled', async () => {
    await render({ columns: COLUMNS, legend: false })
    expect(legendText()).toEqual([])
    await render({ columns: [{ label: 'A', segments: [{ value: 1 }] }] })
    expect(legendText()).toEqual([])
  })

  it('formats the legend totals through `format`', async () => {
    await render({ columns: COLUMNS, format: (value: number) => `${value}×` })
    expect(legendText()).toEqual(['Sessions 15×', 'Retries 3×'])
  })
})

describe('BarChart size and footprint', () => {
  it('names the image from ariaLabel, falling back to the shared key', async () => {
    await render({ columns: COLUMNS })
    expect(plot().getAttribute('aria-label')).toBe('Chart')
    await render({ columns: COLUMNS, ariaLabel: 'Daily activity' })
    expect(plot().getAttribute('aria-label')).toBe('Daily activity')
  })

  it('scales every metric from the size dimension', async () => {
    await render({ columns: COLUMNS })
    expect(root().style.getPropertyValue('--chart-plot-height')).toBe(`${SIZE_PX.md * 8.75}px`)
    expect(root().style.getPropertyValue('--chart-col-max')).toBe(`${SIZE_PX.md * 3.5}px`)
    await render({ columns: COLUMNS, size: 'lg' })
    expect(root().style.getPropertyValue('--chart-plot-height')).toBe(`${SIZE_PX.lg * 8.75}px`)
    expect(root().style.getPropertyValue('--chart-col-max')).toBe(`${SIZE_PX.lg * 3.5}px`)
    await render({ columns: COLUMNS, size: 20 })
    expect(root().style.getPropertyValue('--chart-plot-height')).toBe(`${20 * 8.75}px`)
  })

  it('overrides only the plot height from a number or string', async () => {
    await render({ columns: COLUMNS, height: 180 })
    expect(root().style.getPropertyValue('--chart-plot-height')).toBe('180px')
    // The size-derived metrics keep scaling while the footprint is overridden.
    expect(root().style.getPropertyValue('--chart-col-max')).toBe(`${SIZE_PX.md * 3.5}px`)
    await render({ columns: COLUMNS, height: '12rem' })
    expect(root().style.getPropertyValue('--chart-plot-height')).toBe('12rem')
  })
})
