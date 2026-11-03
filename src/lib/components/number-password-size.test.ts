import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import NumberInput from './NumberInput.svelte'
import PasswordInput from './PasswordInput.svelte'

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
    // The stepper glyph rides the trimmed in-field share; its gutter clears the
    // overlay (0.75 × md).
    expect(frame?.getAttribute('style')).toContain('--num-icon: 12px')
    expect(frame?.getAttribute('style')).toContain('--num-pad-right: 20px')
    expect(frame?.getAttribute('style')).toContain('--num-radius: 6px')
    // The box rides TextInput's shared base metrics.
    expect(target.querySelector('input')?.className).toContain('text-[length:var(--input-font)]')
    // Stepper chevrons scale with the dimension, at the shared icon ratio.
    expect(target.querySelector('svg')?.getAttribute('width')).toBe('9.75')
  })

  it('scales continuously for names and numbers, falling back to md', async () => {
    await remount(NumberInput, { value: '5', ariaLabel: 'x', size: 14 })
    expect(target.firstElementChild?.getAttribute('style')).toContain('--num-icon: 10.5px')
    expect(target.firstElementChild?.getAttribute('style')).toContain('--num-pad-right: 17.5px')
    await remount(NumberInput, { value: '5', ariaLabel: 'x', size: Number.NaN })
    expect(target.firstElementChild?.getAttribute('style')).toContain('--num-icon: 12px')
  })

  it('merges a partial override over the field and the stepper metrics', async () => {
    await remount(NumberInput, {
      value: '5',
      ariaLabel: 'x',
      clearable: true,
      ratios: { font: 0.5, stepperIcon: 0.5, stepperGutter: 2, clearBox: 1.5 },
    })
    const frame = target.firstElementChild
    expect(frame?.getAttribute('style')).toContain('--num-icon: 8px')
    expect(frame?.getAttribute('style')).toContain('--num-pad-right: 32px')
    expect(target.querySelector('input')?.getAttribute('style')).toContain('--input-font: 8px')
    // The clear keys are part of this composite's set, so they reach the field.
    const style = Array.from(target.querySelectorAll('[style]'))
      .map(element => element.getAttribute('style') ?? '')
      .join(';')
    expect(style).toContain('--clear-box: 24px')
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

  it('merges a partial override over the field and the toggle metrics', async () => {
    await remount(PasswordInput, {
      value: 'x',
      clearable: true,
      ratios: { font: 0.5, icon: 0.5, box: 3, clearGutter: 2 },
    })
    expect(target.querySelector('.relative')?.getAttribute('style')).toContain('--pwd-icon: 8px')
    expect(target.querySelector('.relative')?.getAttribute('style')).toContain('--pwd-box: 48px')
    expect(target.querySelector('input')?.getAttribute('style')).toContain('--input-font: 8px')
    // The clear keys are part of this composite's set, so they reach the field.
    const style = Array.from(target.querySelectorAll('[style]'))
      .map(element => element.getAttribute('style') ?? '')
      .join(';')
    expect(style).toContain('--clear-gutter: 32px')
  })

  it('keeps the reveal tooltip reachable while the field is disabled', async () => {
    await remount(PasswordInput, { value: '', disabled: true })
    const toggle = target.querySelector<HTMLButtonElement>('button[aria-label]')
    expect(toggle?.disabled).toBe(true)
    // The tip's trigger is the non-disabled wrapper: a disabled button fires no
    // mouse events, so a tip bound to the button itself would never open.
    const trigger = toggle?.parentElement
    expect(trigger?.tagName).toBe('SPAN')
    expect(trigger?.hasAttribute('disabled')).toBe(false)
  })
})
