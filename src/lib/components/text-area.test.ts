import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './text-area.harness.svelte'
import { INPUT_LEADING } from './input-chrome'

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

function render(props: Record<string, unknown> = {}): HTMLTextAreaElement {
  instance = mount(Harness, { target, props })
  flushSync()
  return target.querySelector('textarea') as HTMLTextAreaElement
}

describe('TextArea', () => {
  it('renders a labelled textarea with three rows by default', () => {
    const area = render()
    expect(area.getAttribute('aria-label')).toBe('Notes')
    expect(area.rows).toBe(3)
    expect(area.placeholder).toBe('Write…')
  })

  it('fills its container height by default', () => {
    expect(render().classList.contains('h-full')).toBe(true)
  })

  it('drops the border, surface, and metrics in the embedded variant', () => {
    const area = render({ variant: 'embedded' })
    expect(area.className).toContain('bg-transparent')
    expect(area.className).not.toContain('border-slate-700')
    expect(area.className).not.toContain('bg-slate-950')
    expect(area.className).not.toContain('rounded-[var(--input-radius)]')
  })

  it('appends the caller className after the base', () => {
    const area = render({ variant: 'embedded', className: 'text-slate-100' })
    expect(area.className).toContain('text-slate-100')
  })

  it('binds the value both ways', () => {
    const area = render({ value: 'one\ntwo' })
    expect(area.value).toBe('one\ntwo')
    area.value = 'three'
    area.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    expect(area.value).toBe('three')
  })

  it('honours explicit rows, disabled, and readonly', () => {
    const area = render({ rows: 5, disabled: true, readonly: true })
    expect(area.rows).toBe(5)
    expect(area.disabled).toBe(true)
    expect(area.readOnly).toBe(true)
  })

  it('merges a partial ratios override over the shared metrics', () => {
    const area = render({ ratios: { font: 0.5, padX: 0.75 } })
    const style = area.getAttribute('style') ?? ''
    expect(Number(/--input-font:\s*([\d.]+)/.exec(style)?.[1])).toBeCloseTo(8)
    expect(Number(/--input-pad-x:\s*([\d.]+)/.exec(style)?.[1])).toBeCloseTo(12)
    expect(Number(/--input-radius:\s*([\d.]+)/.exec(style)?.[1])).toBeCloseTo(6)
    // The line box derives from the overridden font rather than staying on the
    // shared default, so the editor's row height follows its text.
    expect(Number(/--input-line:\s*([\d.]+)/.exec(style)?.[1])).toBeCloseTo(8 * INPUT_LEADING)
  })
})
