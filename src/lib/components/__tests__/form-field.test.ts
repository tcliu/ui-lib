import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './form-field.harness.svelte'

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

function render(layout?: 'stacked' | 'inline'): HTMLElement {
  instance = mount(Harness, { target, props: { layout } })
  flushSync()
  return target.firstElementChild as HTMLElement
}

describe('FormField', () => {
  it('stacks the label above the control by default', () => {
    const wrapper = render()
    expect(wrapper.classList.contains('flex-col')).toBe(true)
    expect(wrapper.querySelector('label')?.getAttribute('for')).toBe('field')
    expect(wrapper.querySelector('input')?.id).toBe('field')
  })

  it('places the label beside the control in the inline layout', () => {
    const wrapper = render('inline')
    expect(wrapper.classList.contains('grid')).toBe(true)
    expect(wrapper.classList.contains('sm:grid-cols-[6rem_minmax(0,1fr)]')).toBe(true)
    expect(wrapper.children).toHaveLength(2)
    expect(wrapper.firstElementChild?.tagName).toBe('LABEL')
    expect(wrapper.lastElementChild?.tagName).toBe('INPUT')
  })
})
