import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import NumberInput from '../NumberInput.svelte'
import PasswordInput from '../PasswordInput.svelte'

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

async function remount(component: unknown, props: Record<string, unknown>) {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  instance = mount(component as Parameters<typeof mount>[0], { target, props })
  flushSync()
}

describe('NumberInput size', () => {
  it('defaults to md with no custom override', async () => {
    await remount(NumberInput, { value: '5', ariaLabel: 'x' })
    const frame = target.firstElementChild
    // The stepper icon slot is the size dimension itself; its gutter clears the overlay.
    expect(frame?.getAttribute('style')).toContain('--num-icon: 16px')
    expect(frame?.getAttribute('style')).toContain('--num-pad-right: 20px')
    expect(frame?.getAttribute('style')).toContain('--num-radius: 6px')
    // The box rides TextInput's shared base metrics.
    expect(target.querySelector('input')?.className).toContain('text-[length:var(--input-font)]')
    // Stepper chevrons scale with the dimension, at the shared icon ratio.
    expect(target.querySelector('svg')?.getAttribute('width')).toBe('13')
  })

  it('scales continuously for names and numbers, falling back to md', async () => {
    await remount(NumberInput, { value: '5', ariaLabel: 'x', size: 14 })
    expect(target.firstElementChild?.getAttribute('style')).toContain('--num-icon: 14px')
    expect(target.firstElementChild?.getAttribute('style')).toContain('--num-pad-right: 17.5px')
    await remount(NumberInput, { value: '5', ariaLabel: 'x', size: Number.NaN })
    expect(target.firstElementChild?.getAttribute('style')).toContain('--num-icon: 16px')
  })
})

describe('PasswordInput size', () => {
  it('defaults to md with no custom override', async () => {
    await remount(PasswordInput, { value: '' })
    const frame = target.querySelector('.relative')
    // The eye glyph is the dimension itself, so the toggle metric is 16px at md.
    expect(frame?.getAttribute('style')).toContain('--pwd-icon: 16px')
    // The box rides TextInput's shared base metrics.
    expect(target.querySelector('input')?.className).toContain('text-[length:var(--input-font)]')
    // The eye toggle scales with the dimension instead of a pinned size.
    expect(target.querySelector('svg')?.getAttribute('width')).toBe('13')
  })

  it('scales continuously for names and numbers, falling back to md', async () => {
    await remount(PasswordInput, { value: '', size: 14 })
    expect(target.querySelector('.relative')?.getAttribute('style')).toContain('--pwd-icon: 14px')
    await remount(PasswordInput, { value: '', size: Number.NaN })
    expect(target.querySelector('.relative')?.getAttribute('style')).toContain('--pwd-icon: 16px')
  })
})
