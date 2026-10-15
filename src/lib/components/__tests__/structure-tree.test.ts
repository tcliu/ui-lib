import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './structure-tree.harness.svelte'

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  target = document.createElement('div')
  document.body.appendChild(target)
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  target.remove()
})

function render(value: unknown, props: Record<string, unknown> = {}): HTMLElement {
  instance = mount(Harness, { target, props: { value, ...props } })
  flushSync()
  return target.firstElementChild as HTMLElement
}

function buttonByName(root: ParentNode, pattern: RegExp): HTMLButtonElement {
  const found = [...root.querySelectorAll('button')].find(button =>
    pattern.test(button.getAttribute('aria-label') ?? button.textContent ?? ''),
  )
  if (!(found instanceof HTMLButtonElement)) throw new Error(`button ${pattern} not found`)
  return found
}

function setInputValue(input: HTMLInputElement, value: string): void {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
}

function keydown(input: HTMLInputElement, key: string): void {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  flushSync()
}

describe('StructureTree', () => {
  it('renders a container tree with the root expanded', () => {
    const root = render({ nested: { a: 1 } })
    expect(root.textContent).toContain('object{1}')
    expect(root.textContent).toContain('nested')
    buttonByName(root, /expand nested/i).click()
    flushSync()
    expect(root.textContent).toContain('1')
  })

  it('renders arrays with an array label', () => {
    const root = render([1, 2])
    expect(root.textContent).toContain('array[2]')
    expect(root.textContent).toContain('0')
    expect(root.textContent).toContain('2')
  })

  it('renders scalar values directly', () => {
    const root = render(42)
    expect(root.textContent).toContain('42')
  })

  it('shows a placeholder for undefined values', () => {
    const root = render(undefined)
    expect(root.textContent).toContain('No content to preview')
  })

  it('reports leaf value edits through onChange', () => {
    const onChange = vi.fn()
    const root = render({ name: 'root' }, { onChange })

    buttonByName(root, /^Edit \$\.name$/).click()
    flushSync()
    const input = root.querySelector('input') as HTMLInputElement
    setInputValue(input, 'changed')
    keydown(input, 'Enter')

    expect(onChange).toHaveBeenCalledWith(['name'], 'changed')
  })

  it('reports key renames with onRenameKey', () => {
    const onRenameKey = vi.fn()
    const root = render({ oldKey: 42 }, { onRenameKey })

    const keySpan = [...root.querySelectorAll('span')].find(span => span.textContent === 'oldKey')
    if (!keySpan) throw new Error('key span not found')
    keySpan.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    flushSync()
    const input = root.querySelector('input') as HTMLInputElement
    setInputValue(input, 'newKey')
    keydown(input, 'Enter')

    expect(onRenameKey).toHaveBeenCalledWith([], 'oldKey', 'newKey')
  })

  it('renders a read-only tree when no callbacks are provided', () => {
    const root = render({ name: 'root' })
    expect(root.querySelector('button[aria-label="Edit $.name"]')).toBeNull()
    expect(root.querySelector('button[aria-label="Copy $.name"]')).not.toBeNull()
  })

  it('leaves no measured text in the hidden measure span after editing', () => {
    const onChange = vi.fn()
    const root = render({ name: 'root' }, { onChange })

    buttonByName(root, /^Edit \$\.name$/).click()
    flushSync()
    const input = root.querySelector('input') as HTMLInputElement
    setInputValue(input, 'changed')
    keydown(input, 'Enter')

    expect(onChange).toHaveBeenCalledWith(['name'], 'changed')
    const measure = root.querySelector('span[aria-hidden="true"]')
    expect(measure?.textContent).toBe('')
  })

  function openNestedObjectDialog(onChange: ReturnType<typeof vi.fn>) {
    const root = render({ nested: { a: 1 } }, { onChange })
    buttonByName(root, /^Edit \$\.nested$/).click()
    flushSync()
    const dialog = document.body.querySelector('[role="dialog"]')
    if (!(dialog instanceof HTMLElement)) throw new Error('object dialog not found')
    return { root, dialog }
  }

  function footerButtonNames(dialog: ParentNode): string[] {
    return [...dialog.querySelectorAll('button')].map(
      button => button.getAttribute('aria-label') ?? button.textContent?.trim() ?? '',
    )
  }

  it('shows an object edit button on the root and nested containers', () => {
    const root = render({ nested: { a: 1 } }, { onChange: vi.fn() })
    expect(root.querySelector('button[aria-label="Edit $.nested"]')).not.toBeNull()
    expect(root.querySelector('button[aria-label="Edit $"]')).not.toBeNull()
    const names = [...root.querySelectorAll('button')].map(
      button => button.getAttribute('aria-label') ?? button.textContent?.trim() ?? '',
    )
    expect(names.indexOf('Edit $.nested')).toBeLessThan(names.indexOf('Copy $.nested'))
  })

  it('opens a JSON dialog for a nested object with Format before OK', () => {
    const { dialog } = openNestedObjectDialog(vi.fn())
    expect(dialog.textContent).toContain('$.nested')
    expect(dialog.querySelector('button[aria-label="Copy to clipboard"]')).not.toBeNull()
    const names = footerButtonNames(dialog)
    expect(names).toContain('Format')
    expect(names.indexOf('Format')).toBeLessThan(names.indexOf('OK'))
    expect(buttonByName(dialog, /^Format$/).disabled).toBe(false)
  })

  // Portal teardown does not detach in jsdom (the Close path shows the same),
  // so dialog dismissal is covered by the browser e2e spec instead.
  it('saves the untouched draft through onChange with the node path', () => {
    const onChange = vi.fn()
    const { dialog } = openNestedObjectDialog(onChange)
    buttonByName(dialog, /^OK$/).click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith(['nested'], { a: 1 })
  })

  it('keeps Reset disabled while the object draft is clean', () => {
    const { dialog } = openNestedObjectDialog(vi.fn())
    const reset = [...dialog.querySelectorAll('button')].find(
      button => button.textContent?.trim() === 'Reset',
    )
    expect(reset?.disabled).toBe(true)
  })

  it('renames a nested container key through double-click', () => {
    const onRenameKey = vi.fn()
    const root = render({ nested: { a: 1 } }, { onRenameKey })

    const keySpan = [...root.querySelectorAll('span[role="button"]')].find(
      span => span.textContent === 'nested',
    )
    if (!keySpan) throw new Error('nested key span not found')
    keySpan.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    flushSync()
    const input = root.querySelector('input') as HTMLInputElement
    setInputValue(input, 'renamed')
    keydown(input, 'Enter')

    expect(onRenameKey).toHaveBeenCalledWith([], 'nested', 'renamed')
  })

  it('does not offer rename for the root or containers inside arrays', () => {
    const root = render({ teams: [{ x: 1 }] }, { onRenameKey: vi.fn() })
    buttonByName(root, /expand teams/i).click()
    flushSync()
    const keyNames = [...root.querySelectorAll('span[role="button"]')].map(
      span => span.textContent,
    )
    expect(keyNames).toContain('teams')
    expect(keyNames).not.toContain('0')
    expect(keyNames.find(name => name?.startsWith('object'))).toBeUndefined()
  })

  it('renders the built-in row classes by default', () => {
    const root = render({ nested: { a: 1 } }, { onChange: vi.fn() })
    const header = buttonByName(root, /^Edit \$\.nested$/).closest('div')
    expect(header?.getAttribute('class')).toContain('gap-2')
  })

  it('applies custom container and leaf row classes', () => {
    const root = render(
      { nested: { a: 1 } },
      { onChange: vi.fn(), containerRowClass: 'custom-container', leafRowClass: 'custom-leaf' },
    )
    const header = buttonByName(root, /^Edit \$\.nested$/).closest('div')
    expect(header?.getAttribute('class')).toContain('custom-container')
    expect(header?.getAttribute('class')).not.toContain('gap-2')
    buttonByName(root, /expand nested/i).click()
    flushSync()
    expect(root.innerHTML).toContain('custom-leaf')
  })
})
