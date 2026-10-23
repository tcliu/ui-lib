import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import NumberInput from './NumberInput.svelte'

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

describe('NumberInput stepper visibility', () => {
  it('hides the steppers without changing the box', async () => {
    await remount(NumberInput, { value: '5', ariaLabel: 'x', showControls: false })
    expect(target.querySelectorAll('button')).toHaveLength(0)
    const input = target.querySelector('input')!
    // The bordered box and its metrics stay; only the stepper overlay goes.
    expect(input.className).toContain('border-slate-700')
    expect(input.className).toContain('var(--input-font)')
    expect(input.className).not.toContain('pr-[var(--num-pad-right)]')
  })

  it('hands the box to the caller in the embedded variant', async () => {
    await remount(NumberInput, { value: '5', ariaLabel: 'x', variant: 'embedded', showControls: false })
    const input = target.querySelector('input')!
    expect(input.className).toContain('bg-transparent')
    expect(input.className).not.toContain('border-slate-700')
    expect(input.className).not.toContain('var(--input-font)')
  })

  it('forwards hideOutline to the bordered field', async () => {
    await remount(NumberInput, { value: '5', ariaLabel: 'x', hideOutline: true })
    const input = target.querySelector('input')!
    expect(input.className).not.toContain('border-slate-700')
    expect(input.className).toContain('bg-slate-950')
    expect(target.querySelectorAll('button')).toHaveLength(2)
  })
})

describe('NumberInput stepper frame chrome', () => {
  it('defers its border to the input so focus and disabled styling stay in lockstep', async () => {
    await remount(NumberInput, { value: '5', ariaLabel: 'x' })
    const frame = target.querySelector('button')?.parentElement
    // The column reserves the input's border ring with a transparent border
    // instead of painting a second, independently-styled border: a second
    // border would drop its focus highlight before the input's and would not
    // fade with the input when disabled.
    expect(frame?.className).toContain('border-transparent')
    expect(frame?.className).not.toContain('border-slate-700')
    expect(frame?.className).not.toContain('focus-within')
  })

  it('offsets an explicit inside clear left of the steppers instead of over them', async () => {
    await remount(NumberInput, { value: '5', ariaLabel: 'x', clearable: true, clearPlacement: 'inside' })
    const input = target.querySelector('input')!
    // The input reserves both gutters so text never runs under either button.
    expect(input.getAttribute('style')).toContain(
      'calc(var(--clear-gutter) + var(--input-clear-offset, 0px))',
    )
    const clear = Array.from(target.querySelectorAll('button')).find(
      button => button.getAttribute('aria-label') === 'Clear',
    )!
    expect(clear).toBeDefined()
    // The cross rides the stepper gutter's left edge, clear of the column.
    expect(clear.parentElement!.getAttribute('style')).toContain(
      'calc(var(--clear-inset) + var(--input-clear-offset, 0px))',
    )
    // The stepper gutter reaches the clear as a frame-inherited custom property.
    const frame = input.parentElement!
    expect(frame.getAttribute('style')).toContain('--input-clear-offset')
    expect(frame.getAttribute('style')).toContain('var(--num-pad-right)')
  })

  it('leaves auto (outside) and stepless inside clears unoffset', async () => {
    await remount(NumberInput, { value: '5', ariaLabel: 'x', clearable: true })
    expect(target.querySelector('input')!.getAttribute('style')).not.toContain('var(--clear-gutter)')

    await remount(NumberInput, {
      value: '5',
      ariaLabel: 'x',
      clearable: true,
      clearPlacement: 'inside',
      showControls: false,
    })
    const style = target.querySelector('input')!.getAttribute('style')!
    expect(style).toContain('padding-right: calc(var(--clear-gutter)')
    expect(style).not.toContain('num-pad-right')
  })
})
