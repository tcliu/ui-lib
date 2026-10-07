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

// The colour class of each rendered chip (the Chip's inner span).
function chipClasses(): string[] {
  return [...target.querySelectorAll('span')]
    .filter(el => el.className.includes('rounded-full'))
    .map(el => el.className)
}

describe('TagInput suggestions', () => {
  it('offers available tags excluding the selected ones', () => {
    render({ value: ['svelte'], availableTags: ['svelte', 'kit', 'icons'] })
    openPanel()
    expect(optionLabels()).toEqual(['kit', 'icons'])
  })

  it('filters suggestions by the typed query', () => {
    render({ value: [], availableTags: ['svelte', 'kit', 'icons'] })
    openPanel()
    type('k')
    expect(optionLabels()).toEqual(['kit'])
  })

  it('dedupes suggestions case-insensitively against the selected tags', () => {
    render({ value: ['Svelte'], availableTags: ['svelte', 'kit'] })
    openPanel()
    expect(optionLabels()).toEqual(['kit'])
  })
})

describe('TagInput editing', () => {
  it('commits a comma-separated draft as several tags', () => {
    const onChange = vi.fn()
    render({ value: ['svelte'], availableTags: [], onChange })
    type('kit, icons')
    pressKey('Enter')
    expect(onChange).toHaveBeenCalledWith(['svelte', 'kit', 'icons'])
  })

  it('skips tags already present, case-insensitively', () => {
    const onChange = vi.fn()
    render({ value: ['svelte'], availableTags: [], onChange })
    type('Svelte, kit')
    pressKey('Enter')
    expect(onChange).toHaveBeenCalledWith(['svelte', 'kit'])
  })

  it('reports the draft through onQueryChange on every keystroke', () => {
    const onQueryChange = vi.fn()
    render({ value: [], availableTags: [], onQueryChange })
    type('ki')
    expect(onQueryChange).toHaveBeenLastCalledWith('ki')
  })

  it('removes a tag when its chip close button is clicked', () => {
    const onChange = vi.fn()
    render({ value: ['svelte', 'kit'], availableTags: [], onChange })
    const remove = target.querySelector('button[aria-label="Remove svelte"]')
    if (!(remove instanceof HTMLButtonElement)) {
      throw new Error('remove button not found')
    }
    remove.click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith(['kit'])
  })

  it('disables the input when disabled', () => {
    render({ value: [], availableTags: [], disabled: true })
    expect(input().disabled).toBe(true)
  })
})

describe('TagInput keyboard', () => {
  it('moves the active option on ArrowDown with an instant highlight', () => {
    render({ value: [], availableTags: ['svelte', 'kit', 'icons'] })
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
    render({ value: [], availableTags: [], onQueryChange })
    type('kit')
    pressKey('Enter')
    expect(onQueryChange).toHaveBeenLastCalledWith('')
  })

  it('clears the draft and reports it on Escape while open', () => {
    const onQueryChange = vi.fn()
    render({ value: [], availableTags: [], onQueryChange })
    openPanel()
    type('ki')
    onQueryChange.mockClear()
    pressKey('Escape')
    expect(onQueryChange).toHaveBeenCalledWith('')
  })
})

describe('TagInput chip colours', () => {
  it('colours different tags differently by default', () => {
    render({ value: ['svelte', 'kit'], availableTags: [] })
    const classes = chipClasses()
    expect(classes).toHaveLength(2)
    expect(classes[0]).not.toBe(classes[1])
  })

  it('replaces the default palette through the palette prop', () => {
    render({ value: ['svelte', 'kit'], availableTags: [], palette: ['border-fuchsia-700'] })
    for (const className of chipClasses()) {
      expect(className).toContain('border-fuchsia-700')
    }
  })

  it('lets chipClassFor override the palette per tag', () => {
    render({ value: ['svelte'], availableTags: [], chipClassFor: () => 'text-amber-200' })
    expect(chipClasses()[0]).toContain('text-amber-200')
  })
})
