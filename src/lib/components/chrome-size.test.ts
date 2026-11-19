import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Checkbox from './Checkbox.svelte'
import ChipDropdown from './ChipDropdown.svelte'
import ColumnChooser from './ColumnChooser.svelte'
import Copyable from './Copyable.svelte'
import StructureTreeHarness from './structure-tree.harness.svelte'
import TagInput from './TagInput.svelte'
import Toast from './Toast.svelte'
import { SIZE_ORDER, SIZE_PX } from '#lib/size-scale.js'

// These components mount positioned overlays and observers jsdom does not
// supply; the shared stubs keep the size assertions about metrics only.
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

async function render(component: unknown, props: Record<string, unknown>): Promise<void> {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(component as Parameters<typeof mount>[0], { target, props })
  flushSync()
}

function styleOf(selector: string): string {
  // Positioned surfaces portal to `document.body`, so the lookup is page-wide.
  return document.querySelector(selector)?.getAttribute('style') ?? ''
}

function metric(style: string, key: string): number {
  return Number(new RegExp(`--${key}:\\s*([\\d.]+)`).exec(style)?.[1])
}

// Every component's own chrome must keep a constant metric:size ratio across
// the whole axis, so a `xs` control never renders a `md` radius or gap.
const CASES: {
  name: string
  selector: string
  mount: (size: (typeof SIZE_ORDER)[number]) => Promise<void>
  vars: Record<string, number>
}[] = [
  {
    name: 'Checkbox',
    selector: 'label',
    mount: size => render(Checkbox, { checked: false, size }),
    vars: { 'cbx-gap': 0.75, 'cbx-box': 1.25, 'cbx-font': 0.875, 'cbx-icon': 0.875, 'cbx-radius': 0.375 },
  },
  {
    name: 'Toast',
    selector: '[role="status"]',
    mount: size => render(Toast, { message: 'm', closeLabel: 'c', onClose: () => {}, size }),
    vars: {
      'toast-gap': 0.75,
      'toast-pad-x': 1,
      'toast-pad-y': 0.75,
      'toast-radius': 0.375,
      'toast-action-pad-x': 0.625,
      'toast-action-pad-y': 0.375,
    },
  },
  {
    name: 'TagInput',
    selector: 'div[style*="--tag-font"]',
    mount: size => render(TagInput, { value: [], size }),
    vars: {
      'tag-radius': 0.5,
      'tag-option-gap': 0.5,
      'tag-option-radius': 0.375,
      'tag-remove-pad': 0.125,
      'tag-dot': 0.5,
      'tag-panel-pad': 0.25,
    },
  },
  {
    name: 'Copyable',
    selector: 'div[style*="--copyable-gap"]',
    mount: size => render(Copyable, { text: 'x', size }),
    vars: { 'copyable-gap': 0.25, 'copyable-offset': 0.375 },
  },
  {
    name: 'ColumnChooser',
    selector: 'span[style*="--colchooser-gap"]',
    mount: size =>
      render(ColumnChooser, {
        triggerLabel: 'Columns',
        resetAriaLabel: 'Reset',
        columns: [{ key: 'a', header: 'A', checked: true }],
        onToggle: () => {},
        onReset: () => {},
        size,
      }),
    vars: {
      'colchooser-gap': 0.25,
      'colchooser-min-w': 9,
      'colchooser-panel-radius': 0.5,
      'colchooser-panel-pad': 0.375,
      'colchooser-row-radius': 0.25,
      'colchooser-row-pad-x': 0.375,
      'colchooser-row-pad-y': 0.125,
    },
  },
  {
    name: 'StructureTree',
    selector: 'div[style*="--tree-font"]',
    mount: size => render(StructureTreeHarness, { value: { a: 1 }, editable: false, size }),
    vars: {
      'tree-row-gap': 0.5,
      'tree-leaf-gap': 0.25,
      'tree-row-pad-y': 0.25,
      'tree-row-radius': 0.25,
      'tree-gap-step': 0.25,
      'tree-action-gap': 0.125,
      'tree-action-pad': 0.375,
      'tree-action-radius': 0.25,
      'tree-value-gap': 0.375,
      'tree-key-radius': 0.0625,
      'tree-indent': 0.3,
      'tree-indent-pad': 0.5,
    },
  },
]

describe.each(CASES)('$name — own chrome', ({ selector, mount, vars }) => {
  it('keeps every chrome metric a constant ratio of the size', async () => {
    for (const step of SIZE_ORDER) {
      const px = SIZE_PX[step]
      await mount(step)
      const style = styleOf(selector)
      for (const [key, ratio] of Object.entries(vars)) {
        expect(metric(style, key), `${key} at ${step}`).toBeCloseTo(ratio * px, 5)
      }
    }
  })

  it('reproduces the shipped md chrome', async () => {
    await mount('md')
    const style = styleOf(selector)
    for (const [key, ratio] of Object.entries(vars)) {
      expect(metric(style, key), key).toBeCloseTo(ratio * 16, 5)
    }
  })
})

describe('ChipDropdown — panel chrome', () => {
  it('scales the panel padding and search radius with the chip', async () => {
    await render(ChipDropdown, {
      label: 'All',
      options: ['a', 'b'],
      ariaLabel: 'Filter',
      filterable: true,
      onSelect: () => {},
      size: 'lg',
    })
    const trigger = document.querySelector('button')
    expect(trigger).not.toBeNull()
    trigger!.click()
    flushSync()
    const style = styleOf('div[style*="--chip-panel-pad"]')
    expect(metric(style, 'chip-panel-pad')).toBeCloseTo(4.5, 5)
    expect(metric(style, 'chip-panel-search-radius')).toBeCloseTo(6.75, 5)
    expect(metric(style, 'chip-panel-row-radius')).toBeCloseTo(9, 5)
  })
})
