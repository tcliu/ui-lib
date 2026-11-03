import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import { INPUT_RATIOS } from './input-chrome'
import Harness from './select-dropdown-derived-label.harness.svelte'

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

function triggerText(): string {
  const trigger = target.querySelector('button[role=combobox]')
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new Error('trigger not found')
  }
  return trigger.textContent?.trim() ?? ''
}

describe('SelectDropdown derived trigger label', () => {
  it('derives the label from the committed option when buttonLabel is omitted', () => {
    instance = mount(Harness, {
      target,
      props: {
        options: [
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
        ],
        activeValue: 'two',
      },
    })
    flushSync()
    expect(triggerText()).toBe('Two')
  })

  it('displays a bare string option as its own value', () => {
    instance = mount(Harness, { target, props: { options: ['one', 'two'], activeValue: 'two' } })
    flushSync()
    expect(triggerText()).toBe('two')
  })

  it('displays a labelless object option as its value', () => {
    instance = mount(Harness, {
      target,
      props: { options: [{ value: 'one' }, { value: 'two' }], activeValue: 'two' },
    })
    flushSync()
    expect(triggerText()).toBe('two')
  })

  it('falls back to the raw value when nothing matches', () => {
    instance = mount(Harness, { target, props: { activeValue: 'nine' } })
    flushSync()
    expect(triggerText()).toBe('nine')
  })

  it('prefers an explicit buttonLabel over the derived label', () => {
    instance = mount(Harness, { target, props: { activeValue: 'two', buttonLabel: 'Pick one' } })
    flushSync()
    expect(triggerText()).toBe('Pick one')
  })

  // An empty label collapses its span to zero height, which would drop the
  // trigger below the field row; the row floors itself at the metric line so a
  // cleared selection keeps the control's height.
  it('keeps the label row at the line height when the value is empty', () => {
    instance = mount(Harness, { target, props: { activeValue: '' } })
    flushSync()
    expect(triggerText()).toBe('')
    const row = target.querySelector('button[role=combobox] > span')
    expect(row?.getAttribute('class')).toContain('min-h-[var(--sel-line)]')
    const trigger = target.querySelector('button[role=combobox]')
    expect(trigger?.getAttribute('style')).toContain(`--sel-line: ${16 * INPUT_RATIOS.line}px`)
  })
})
