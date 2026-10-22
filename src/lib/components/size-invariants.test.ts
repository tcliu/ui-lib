import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import AutoComplete from './AutoComplete.svelte'
import BarChart from './BarChart.svelte'
import Button from './Button.svelte'
import Buttons from './Buttons.svelte'
import Chip from './Chip.svelte'
import DateInput from './DateInput.svelte'
import FormField from './FormField.svelte'
import MenuSizeHarness from './menu-size.harness.svelte'
import NumberInput from './NumberInput.svelte'
import PasswordInput from './PasswordInput.svelte'
import SearchInput from './SearchInput.svelte'
import SelectDropdown from './SelectDropdown.svelte'
import TextInput from './TextInput.svelte'
import TabsHarness from './tabs-size.harness.svelte'
import { dimensionMetrics, resolveSize } from './size-metrics'

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

// Every custom property the element declares, keyed by full name (e.g. `btn-font`).
function styleVars(style: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const m of style.matchAll(/--([\w-]+):\s*(-?[\d.]+)/g)) {
    out[m[1]!] = Number(m[2])
  }
  return out
}

async function renderStyle(component: unknown, props: Record<string, unknown>): Promise<string> {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(component as Parameters<typeof mount>[0], { target, props })
  flushSync()
  // A composed field can carry its base metrics on the inner input and its
  // decoration metrics on a wrapper; collect every inline style so the whole
  // emitted metric set is visible.
  return Array.from(target.querySelectorAll('[style]'))
    .map(el => el.getAttribute('style') ?? '')
    .join(';')
}

const AXIS_SIZES = [12, 14, 16, 18, 20]
const NUMERIC_SIZES = [13, 14, 15, 17, 18, 19, 22, 40]

interface ComponentCase {
  name: string
  // The full set of dimension metrics the component must emit (font, line,
  // padding, gap, icon, radius, min-width); `-weight` is non-length chrome.
  keys: string[]
  render: (size: number) => Promise<string>
}

const CASES: ComponentCase[] = [
  {
    name: 'Button',
    keys: ['btn-font', 'btn-line', 'btn-radius', 'btn-pad-x', 'btn-pad-y', 'btn-icon', 'btn-icon-pad', 'btn-glyph'],
    render: size => renderStyle(Button, { size }),
  },
  {
    name: 'Buttons',
    keys: ['buttons-gap'],
    render: size => renderStyle(Buttons, { size }),
  },
  {
    name: 'Menu',
    keys: ['btn-font', 'btn-line', 'btn-radius', 'btn-pad-x', 'btn-pad-y', 'btn-icon', 'btn-icon-pad', 'btn-glyph'],
    render: size => renderStyle(MenuSizeHarness, { size }),
  },
  {
    name: 'TextInput',
    keys: ['input-font', 'input-line', 'input-radius', 'input-pad-x', 'input-pad-y'],
    render: size => renderStyle(TextInput, { value: '', ariaLabel: 'x', size }),
  },
  {
    name: 'SearchInput',
    keys: [
      'input-font',
      'input-line',
      'input-radius',
      'input-pad-x',
      'input-pad-y',
      'search-pad-left',
      'search-icon-left',
      'search-icon',
    ],
    render: size => renderStyle(SearchInput, { value: '', ariaLabel: 'x', size }),
  },
  {
    name: 'AutoComplete',
    keys: ['input-font', 'input-line', 'input-radius', 'input-pad-x', 'input-pad-y'],
    render: size => renderStyle(AutoComplete, { value: '', options: ['a', 'b'], ariaLabel: 'x', size }),
  },
  {
    name: 'SelectDropdown',
    keys: ['sel-font', 'sel-line', 'sel-pad-x', 'sel-pad-y', 'sel-min-w', 'sel-gap', 'sel-icon'],
    render: size =>
      renderStyle(SelectDropdown, { options: ['a', 'b'], activeValue: 'a', ariaLabel: 'x', onSelect: () => {}, size }),
  },
  {
    name: 'NumberInput',
    keys: [
      'input-font',
      'input-line',
      'input-radius',
      'input-pad-x',
      'input-pad-y',
      'num-icon',
      'num-pad-right',
      'num-radius',
    ],
    render: size => renderStyle(NumberInput, { value: '5', ariaLabel: 'x', size }),
  },
  {
    name: 'PasswordInput',
    keys: ['input-font', 'input-line', 'input-radius', 'input-pad-x', 'input-pad-y', 'pwd-icon', 'pwd-box', 'pwd-inset'],
    render: size => renderStyle(PasswordInput, { value: '', size }),
  },
  {
    name: 'Chip',
    keys: ['chip-font', 'chip-line', 'chip-pad-x', 'chip-pad-y', 'chip-gap', 'chip-icon'],
    render: size => renderStyle(Chip, { label: 'tag', chipClass: 'rounded-full', size }),
  },
  {
    name: 'FormField',
    keys: ['ff-font', 'ff-gap', 'ff-inline-gap', 'ff-inline-col'],
    render: size => renderStyle(FormField, { label: 'label', size }),
  },
  {
    name: 'Tabs',
    keys: ['tabs-font', 'tabs-pad-x', 'tabs-pad-y', 'tabs-radius', 'tabs-nav-pad', 'tabs-nav-radius'],
    render: size => renderStyle(TabsHarness, { size }),
  },
  {
    name: 'DateInput',
    keys: [
      'btn-font',
      'btn-glyph',
      'btn-icon',
      'btn-icon-pad',
      'btn-line',
      'btn-pad-x',
      'btn-pad-y',
      'btn-radius',
      'input-font',
      'input-line',
      'input-pad-x',
      'input-pad-y',
      'input-radius',
      'pick-font',
      'pick-line',
      'pick-radius',
      'pick-pad-x',
      'pick-pad-y',
      'pick-gap',
      'pick-icon',
      'pick-panel-width',
      'pick-panel-radius',
      'pick-panel-pad',
      'pick-block-gap',
      'pick-tight-gap',
      'pick-nav-size',
      'pick-sm-font',
      'pick-head-font',
      'pick-tight-pad-y',
      'pick-cell-size',
    ],
    render: size => renderStyle(DateInput, { value: '', size }),
  },
  {
    name: 'BarChart',
    keys: [
      'chart-plot-height',
      'chart-col-max',
      'chart-col-min',
      'chart-col-gap',
      'chart-axis-font',
      'chart-axis-line',
      'chart-axis-gap',
      'chart-legend-font',
      'chart-legend-line',
      'chart-legend-gap-x',
      'chart-legend-gap-y',
      'chart-legend-gap-top',
      'chart-swatch',
      'chart-swatch-radius',
      'chart-swatch-gap',
      'chart-bar-radius',
    ],
    render: size =>
      renderStyle(BarChart, {
        columns: [
          { label: 'A', segments: [{ value: 4, label: 'x' }, { value: 2, label: 'y' }] },
          { label: 'B', segments: [{ value: 6, label: 'x' }] },
        ],
        size,
      }),
  },
]

describe('custom size invariants — pure', () => {
  it('resolveSize always yields a finite dimension >= 1', () => {
    for (const s of [-5, 0, 0.5, 1, 12, 15, 20, 24, 100, 1000, Number.NaN, Infinity, -Infinity]) {
      const d = resolveSize(s)
      expect(Number.isFinite(d)).toBe(true)
      expect(d).toBeGreaterThanOrEqual(1)
    }
    expect(resolveSize('xs')).toBe(12)
    expect(resolveSize('lg')).toBe(18)
  })

  it('names are aliases for their axis numbers', () => {
    for (const [name, px] of [
      ['xs', 12],
      ['sm', 14],
      ['md', 16],
      ['lg', 18],
      ['xl', 20],
    ] as const) {
      expect(resolveSize(name)).toBe(px)
      expect(dimensionMetrics(name, { font: 0.65 })).toEqual(dimensionMetrics(px, { font: 0.65 }))
    }
  })
})

// For every component, every emitted dimension metric must keep a constant
// metric:dimension ratio across names and arbitrary numbers, be monotonic, and
// never be NaN/undefined.
describe.each(CASES)('$name — all metrics', ({ keys, render }) => {
  it('emits exactly the declared metric set at every size', async () => {
    for (const size of [...AXIS_SIZES, ...NUMERIC_SIZES]) {
      const vars = styleVars(await render(size))
      expect(Object.keys(vars).sort()).toEqual([...keys].sort())
    }
  })

  it('keeps every length metric a constant ratio of the size (no metric drifts)', async () => {
    const lengthKeys = keys.filter(k => !k.endsWith('-weight'))
    // Reference ratio from the first size, then require it everywhere.
    const ref = styleVars(await render(AXIS_SIZES[0]!))
    for (const size of [...AXIS_SIZES, ...NUMERIC_SIZES]) {
      const vars = styleVars(await render(size))
      for (const key of lengthKeys) {
        const value = vars[key]!
        expect(Number.isFinite(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
        // value / size equals the reference ratio (constant across the range).
        expect(value / size).toBeCloseTo(ref[key]! / AXIS_SIZES[0]!, 5)
      }
    }
  })

  it('is monotonic in size and never NaN/undefined', async () => {
    const sizes = [...AXIS_SIZES, ...NUMERIC_SIZES].sort((a, b) => a - b)
    let previous: Record<string, number> = {}
    for (const size of sizes) {
      const style = await render(size)
      expect(style).not.toMatch(/NaN|undefined/)
      const vars = styleVars(style)
      for (const key of keys) {
        if (previous[key] !== undefined && !key.endsWith('-weight')) {
          expect(vars[key]!).toBeGreaterThanOrEqual(previous[key]!)
        }
      }
      previous = vars
    }
  })
})

describe('custom size invariants — edge cases', () => {
  it('non-finite falls back to md, <=0 clamps to 1', async () => {
    const fontAt = async (size: number): Promise<number> => styleVars(await renderStyle(Button, { size }))['btn-font']!
    expect(await fontAt(Number.NaN)).toBeCloseTo(13)
    expect(await fontAt(Infinity)).toBeCloseTo(13)
    expect(await fontAt(-Infinity)).toBeCloseTo(13)
    expect(await fontAt(0)).toBeCloseTo(0.8125)
    expect(await fontAt(-5)).toBeCloseTo(0.8125)
  })
})
