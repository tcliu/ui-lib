import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './tag-input.harness.svelte'

// jsdom lacks ResizeObserver (positionPanel) and scrollIntoView
// (revealInScrollport), so opening the panel is a layout no-op.
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

function render(props: Record<string, unknown> = {}): void {
  instance = mount(Harness, { target, props })
  flushSync()
}

function input(): HTMLInputElement {
  const el = target.querySelector('input[role=combobox]')
  if (!(el instanceof HTMLInputElement)) {
    throw new Error('tag input not found')
  }
  return el
}

// The panel is portalled to `document.body`, so query it off the document.
function optionLabels(): string[] {
  return [...document.querySelectorAll('[role=listbox] [role=option]')].map(el => el.textContent?.trim() ?? '')
}

function type(text: string): void {
  const el = input()
  el.value = text
  el.dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
}

function pressKey(key: string): void {
  input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  flushSync()
}

function openPanel(): void {
  input().focus()
  flushSync()
}

// The chip's inner span, the parent of its remove button.
function chipSpans(): HTMLElement[] {
  return [...target.querySelectorAll('button[aria-label^="Remove "]')].map(
    el => el.parentElement as HTMLElement,
  )
}

// The colour class of each rendered chip (the Chip's inner span).
function chipClasses(): string[] {
  return chipSpans().map(el => el.className)
}

// The inline style of each rendered chip.
function chipStyles(): string[] {
  return chipSpans().map(el => el.getAttribute('style') ?? '')
}

describe('TagInput suggestions', () => {
  it('offers available tags excluding the selected ones', () => {
    render({ value: ['svelte'], options: ['svelte', 'kit', 'icons'] })
    openPanel()
    expect(optionLabels()).toEqual(['kit', 'icons'])
  })

  it('filters suggestions by the typed query', () => {
    render({ value: [], options: ['svelte', 'kit', 'icons'] })
    openPanel()
    type('k')
    expect(optionLabels()).toEqual(['kit'])
  })

  it('dedupes suggestions case-insensitively against the selected tags', () => {
    render({ value: ['Svelte'], options: ['svelte', 'kit'] })
    openPanel()
    expect(optionLabels()).toEqual(['kit'])
  })

  it('renders plain text rows instead of chips', () => {
    render({ value: [], options: ['svelte', 'kit'] })
    openPanel()
    const rows = [...document.querySelectorAll('[role=listbox] [role=option]')]
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(row.querySelector('.rounded-full')).toBeNull()
    }
  })

  it('emphasizes the matched span while the query is ambiguous', () => {
    render({ value: [], options: ['forms', 'forums', 'tables'] })
    openPanel()
    type('for')
    const rows = [...document.querySelectorAll('[role=listbox] [role=option]')]
    expect(rows.map(row => row.textContent?.trim())).toEqual(['forms', 'forums'])
    for (const row of rows) {
      expect(row.querySelector('span.font-semibold')?.textContent).toBe('for')
    }
  })

  it('skips the emphasis for an unambiguous single match', () => {
    render({ value: [], options: ['svelte', 'kit'] })
    openPanel()
    type('kit')
    const rows = [...document.querySelectorAll('[role=listbox] [role=option]')]
    expect(rows.map(row => row.textContent?.trim())).toEqual(['kit'])
    expect(rows[0]!.querySelector('span.font-semibold')).toBeNull()
  })
})

describe('TagInput editing', () => {
  it('commits a comma-separated draft as several tags', () => {
    const onChange = vi.fn()
    render({ value: ['svelte'], options: [], onChange })
    type('kit, icons')
    pressKey('Enter')
    expect(onChange).toHaveBeenCalledWith(['svelte', 'kit', 'icons'])
  })

  it('skips tags already present, case-insensitively', () => {
    const onChange = vi.fn()
    render({ value: ['svelte'], options: [], onChange })
    type('Svelte, kit')
    pressKey('Enter')
    expect(onChange).toHaveBeenCalledWith(['svelte', 'kit'])
  })

  it('reports the draft through onQueryChange on every keystroke', () => {
    const onQueryChange = vi.fn()
    render({ value: [], options: [], onQueryChange })
    type('ki')
    expect(onQueryChange).toHaveBeenLastCalledWith('ki')
  })

  it('removes a tag when its chip close button is clicked', () => {
    const onChange = vi.fn()
    render({ value: ['svelte', 'kit'], options: [], onChange })
    const remove = target.querySelector('button[aria-label="Remove svelte"]')
    if (!(remove instanceof HTMLButtonElement)) {
      throw new Error('remove button not found')
    }
    remove.click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith(['kit'])
  })

  it('disables the input when disabled', () => {
    render({ value: [], options: [], disabled: true })
    expect(input().disabled).toBe(true)
  })
})

describe('TagInput keyboard', () => {
  it('moves the active option on ArrowDown with an instant highlight', () => {
    render({ value: [], options: ['svelte', 'kit', 'icons'] })
    openPanel()
    pressKey('ArrowDown')
    const activeId = input().getAttribute('aria-activedescendant')
    const row = activeId ? document.getElementById(activeId) : null
    expect(row?.textContent?.trim()).toBe('kit')
    // No transition: the highlight must paint instantly on held-key repeat.
    expect(row?.className).toContain('transition-none')
  })

  it('reports an empty query when a committed draft clears the field', () => {
    const onQueryChange = vi.fn()
    render({ value: [], options: [], onQueryChange })
    type('kit')
    pressKey('Enter')
    expect(onQueryChange).toHaveBeenLastCalledWith('')
  })

  it('clears the draft and reports it on Escape while open', () => {
    const onQueryChange = vi.fn()
    render({ value: [], options: [], onQueryChange })
    openPanel()
    type('ki')
    onQueryChange.mockClear()
    pressKey('Escape')
    expect(onQueryChange).toHaveBeenCalledWith('')
  })

  it('adds the active suggestion on Enter with an empty draft and no prior navigation', () => {
    const onChange = vi.fn()
    render({ value: ['svelte'], options: ['svelte', 'kit', 'icons'], onChange })
    openPanel()
    pressKey('Enter')
    expect(onChange).toHaveBeenCalledWith(['svelte', 'kit'])
  })
})

describe('TagInput chip colours', () => {
  it('colours different tags differently by default', () => {
    render({ value: ['svelte', 'kit'], options: [] })
    const classes = chipClasses()
    expect(classes).toHaveLength(2)
    expect(classes[0]).not.toBe(classes[1])
  })

  it('builds the default palette from the shared chip tokens', () => {
    render({ value: ['svelte', 'kit'], options: [] })
    for (const className of chipClasses()) {
      expect(className).toContain('rounded-full')
      expect(className).toMatch(/text-(cyan|sky|violet|amber|fuchsia|emerald|rose|slate)-200/)
    }
  })

  it('replaces the default palette through the palette prop', () => {
    render({ value: ['svelte', 'kit'], options: [], palette: ['border-fuchsia-700'] })
    for (const className of chipClasses()) {
      expect(className).toContain('border-fuchsia-700')
    }
  })

  it('lets a function chipClass override the palette per tag', () => {
    render({ value: ['svelte'], options: [], chipClass: () => 'text-amber-200' })
    expect(chipClasses()[0]).toContain('text-amber-200')
  })

  it('lets a caller chipClass own the whole chip class string', () => {
    render({ value: ['svelte'], options: [], chipClass: 'rounded-md border' })
    expect(chipClasses()[0]).toContain('rounded-md')
    expect(chipClasses()[0]).not.toContain('rounded-full')
  })

  it('applies the caller chip style to the chip', () => {
    render({ value: ['svelte'], options: [], chipStyle: () => 'color: rgb(1, 2, 3)' })
    expect(chipStyles()[0]).toContain('color: rgb(1, 2, 3)')
  })

  it('renders the caller dot style before the option label', () => {
    render({ value: [], options: ['svelte'], optionDotStyle: () => 'background-color: rgb(1, 2, 3)' })
    openPanel()
    const row = document.querySelector('[role=listbox] [role=option]')
    const dot = row?.querySelector('span.rounded-full')
    expect(dot?.getAttribute('style')).toContain('background-color: rgb(1, 2, 3)')
    // The label keeps the row's own text, so the dot never replaces it.
    expect(row?.textContent?.trim()).toBe('svelte')
  })
})
