import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Chip from './Chip.svelte'

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

function chipClass(): string {
  return target.firstElementChild?.querySelector('span')?.className ?? ''
}

describe('Chip named variants', () => {
  it('paints the soft default from the cyan token when no chipClass is passed', () => {
    instance = mount(Chip, { target, props: { label: 'tag' } })
    flushSync()
    expect(chipClass()).toContain('rounded-full')
    expect(chipClass()).toContain('border')
    expect(chipClass()).toContain('border-cyan-700/60')
    expect(chipClass()).toContain('bg-cyan-500/15')
    expect(chipClass()).toContain('text-cyan-200')
  })

  it('takes the named colour and appearance', () => {
    instance = mount(Chip, { target, props: { label: 'tag', variant: 'violet', appearance: 'solid' } })
    flushSync()
    expect(chipClass()).toContain('border-violet-500')
    expect(chipClass()).toContain('bg-violet-500')
    expect(chipClass()).toContain('text-onaccent')
  })

  it('keeps the outline appearance transparent', () => {
    instance = mount(Chip, { target, props: { label: 'tag', variant: 'emerald', appearance: 'outline' } })
    flushSync()
    expect(chipClass()).toContain('border-emerald-500/70')
    expect(chipClass()).toContain('bg-transparent')
    expect(chipClass()).toContain('text-emerald-200')
  })

  it('lets a caller chipClass own the whole pill', () => {
    instance = mount(Chip, {
      target,
      props: { label: 'tag', chipClass: 'custom-chip rounded-md', variant: 'violet' },
    })
    flushSync()
    expect(chipClass()).toContain('custom-chip')
    expect(chipClass()).toContain('rounded-md')
    expect(chipClass()).not.toContain('rounded-full')
    expect(chipClass()).not.toContain('text-violet-200')
  })
})
