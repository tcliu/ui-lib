import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setTipBox, tipState, tooltip } from './tooltip.svelte'

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  setTipBox(host)
})

afterEach(() => {
  setTipBox(null)
  document.body.innerHTML = ''
})

function anchor(text?: string): { node: HTMLButtonElement; destroy: () => void } {
  const node = document.createElement('button')
  if (text !== undefined) node.dataset.tip = text
  document.body.appendChild(node)
  const action = tooltip(node)
  const destroy = () => {
    if (action) action.destroy?.()
  }
  return { node, destroy }
}

describe('use:tooltip action', () => {
  it('shows the shared tip with the anchor text on pointerenter', () => {
    const { node, destroy } = anchor('More info')
    node.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))

    expect(tipState.visible).toBe(true)
    expect(tipState.text).toBe('More info')
    destroy()
  })

  it('hides the tip on pointerleave', () => {
    const { node, destroy } = anchor('More info')
    node.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
    expect(tipState.visible).toBe(true)

    node.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
    expect(tipState.visible).toBe(false)
    destroy()
  })

  it('shows on keyboard focus and hides on blur', () => {
    const { node, destroy } = anchor('Focused hint')
    node.dispatchEvent(new FocusEvent('focus'))
    expect(tipState.visible).toBe(true)

    node.dispatchEvent(new FocusEvent('blur'))
    expect(tipState.visible).toBe(false)
    destroy()
  })

  it('ignores anchors without tip text', () => {
    const { node, destroy } = anchor()
    node.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
    expect(tipState.visible).toBe(false)
    destroy()
  })

  it('stops responding after destroy', () => {
    const { node, destroy } = anchor('Gone')
    destroy()
    node.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
    expect(tipState.visible).toBe(false)
  })

  it('unregistering the host hides the tip', () => {
    const { node, destroy } = anchor('More info')
    node.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
    expect(tipState.visible).toBe(true)

    setTipBox(null)
    expect(tipState.visible).toBe(false)
    destroy()
  })
})
