// The shared Button's own state: a pending button disables itself and tells
// assistive tech the action is in flight, so a caller never hand-writes
// `aria-busy` on top of the shared control.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Button from '../Button.svelte'

function installDomStubs(): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
  }))
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

function button(): HTMLButtonElement {
  return target.querySelector('button')!
}

describe('Button pending state', () => {
  it('marks a pending button busy and disables it', async () => {
    instance = mount(Button, { target, props: { pending: true, children: undefined } })
    flushSync()
    expect(button().getAttribute('aria-busy')).toBe('true')
    expect(button().disabled).toBe(true)
  })

  it('leaves a settled button unmarked and enabled', async () => {
    instance = mount(Button, { target, props: { pending: false } })
    flushSync()
    expect(button().hasAttribute('aria-busy')).toBe(false)
    expect(button().disabled).toBe(false)
  })
})
