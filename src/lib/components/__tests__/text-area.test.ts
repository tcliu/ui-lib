import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './text-area.harness.svelte'

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
})
