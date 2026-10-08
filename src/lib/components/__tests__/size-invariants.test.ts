import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Button from '../Button.svelte'
import SearchInput from '../SearchInput.svelte'
import SelectDropdown from '../SelectDropdown.svelte'
import TextInput from '../TextInput.svelte'
import { dimensionMetrics, resolveSize } from '../size-metrics'

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

async function renderStyle(component: Parameters<typeof mount>[0], props: Record<string, unknown>): Promise<string> {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(component, { target, props })
  flushSync()
  return (
    target.querySelector('button')?.getAttribute('style') ??
    target.querySelector('input')?.getAttribute('style') ??
    target.querySelector('.relative')?.getAttribute('style') ??
    ''
  )
}

const AXIS_SIZES = [12, 16, 20, 24]
const NUMERIC_SIZES = [13, 14, 15, 17, 18, 19, 22, 40]

interface ComponentCase {
  name: string
  component: Parameters<typeof mount>[0]
  props: Record<string, unknown>
  // The full set of dimension metrics the component must emit (font, line,
  // padding, gap, icon, radius, min-width); `-weight` is non-length chrome.
  keys: string[]
}

const CASES: ComponentCase[] = [
  {
    name: 'Button',
    component: Button,
    props: { size: 16 },
    keys: ['btn-font', 'btn-line', 'btn-radius', 'btn-pad-x', 'btn-pad-y', 'btn-icon', 'btn-icon-pad', 'btn-weight'],
  },
  {
    name: 'TextInput',
    component: TextInput,
    props: { value: '', ariaLabel: 'x' },
    keys: ['input-font', 'input-line', 'input-radius', 'input-pad-x', 'input-pad-y'],
  },
  {
    name: 'SearchInput',
    component: SearchInput,
    props: { value: '', ariaLabel: 'x' },
    keys: [
      'search-font',
      'search-line',
      'search-radius',
      'search-pad-y',
      'search-pad-right',
      'search-pad-left',
      'search-icon-left',
      'search-icon',
    ],
  },
  {
    name: 'SelectDropdown',
    component: SelectDropdown,
    props: { options: ['a', 'b'], activeValue: 'a', ariaLabel: 'x', onSelect: () => {} },
    keys: ['sel-font', 'sel-pad-x', 'sel-pad-y', 'sel-min-w', 'sel-gap', 'sel-icon'],
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
    expect(resolveSize('lg')).toBe(24)
  })

  it('names are aliases for their axis numbers', () => {
    for (const [name, px] of [
      ['xs', 12],
      ['sm', 16],
      ['md', 20],
      ['lg', 24],
    ] as const) {
      expect(resolveSize(name)).toBe(px)
      expect(dimensionMetrics(name, { font: 0.65 })).toEqual(dimensionMetrics(px, { font: 0.65 }))
    }
  })
})

// For every component, every emitted dimension metric must keep a constant
// metric:dimension ratio across names and arbitrary numbers, be monotonic, and
// never be NaN/undefined.
describe.each(CASES)('$name — all metrics', ({ component, props, keys }) => {
  it('emits exactly the declared metric set at every size', async () => {
    for (const size of [...AXIS_SIZES, ...NUMERIC_SIZES]) {
      const vars = styleVars(await renderStyle(component, { ...props, size }))
      expect(Object.keys(vars).sort()).toEqual([...keys].sort())
    }
  })

  it('keeps every length metric a constant ratio of the size (no metric drifts)', async () => {
    const lengthKeys = keys.filter(k => !k.endsWith('-weight'))
    // Reference ratio from the first size, then require it everywhere.
    const ref = styleVars(await renderStyle(component, { ...props, size: AXIS_SIZES[0] }))
    for (const size of [...AXIS_SIZES, ...NUMERIC_SIZES]) {
      const vars = styleVars(await renderStyle(component, { ...props, size }))
      for (const key of lengthKeys) {
        const value = vars[key]!
        expect(Number.isFinite(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
        // value / size equals the reference ratio (constant across the range).
        expect(value / size).toBeCloseTo(ref[key]! / AXIS_SIZES[0], 5)
      }
    }
  })

  it('is monotonic in size and never NaN/undefined', async () => {
    const sizes = [...AXIS_SIZES, ...NUMERIC_SIZES].sort((a, b) => a - b)
    let previous: Record<string, number> = {}
    for (const size of sizes) {
      const style = await renderStyle(component, { ...props, size })
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
  it('non-finite falls back to sm, <=0 clamps to 1', async () => {
    const fontAt = async (size: number): Promise<number> =>
      styleVars(await renderStyle(Button, { size }))['btn-font']!
    expect(await fontAt(Number.NaN)).toBeCloseTo(10.4)
    expect(await fontAt(Infinity)).toBeCloseTo(10.4)
    expect(await fontAt(-Infinity)).toBeCloseTo(10.4)
    expect(await fontAt(0)).toBeCloseTo(0.65)
    expect(await fontAt(-5)).toBeCloseTo(0.65)
  })
})
