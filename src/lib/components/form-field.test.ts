import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import type { SizeInput } from '#lib/size-scale.js'
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

function render(layout?: 'stacked' | 'inline', size?: SizeInput): HTMLElement {
  instance = mount(Harness, { target, props: { layout, size } })
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
    expect(wrapper.className).toContain('sm:grid-cols-[var(--ff-inline-col)_minmax(0,1fr)]')
    expect(wrapper.children).toHaveLength(2)
    expect(wrapper.firstElementChild?.tagName).toBe('LABEL')
    expect(wrapper.lastElementChild?.tagName).toBe('INPUT')
  })

  it('scales the label and gaps from the size', () => {
    const wrapper = render(undefined, 'lg')
    expect(wrapper.getAttribute('style')).toContain('--ff-font: 15.75px')
    expect(wrapper.getAttribute('style')).toContain('--ff-gap: 6.75px')
    expect(wrapper.querySelector('label')?.className).toContain('var(--ff-font)')
  })

  it('scales the inline label column from the size', () => {
    const wrapper = render('inline', 20)
    expect(wrapper.getAttribute('style')).toContain('--ff-inline-col: 120px')
  })
})
