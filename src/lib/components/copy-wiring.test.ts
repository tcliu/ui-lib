import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import { toast } from 'svelte-sonner'
import Copyable from './Copyable.svelte'
import EditableText from './EditableText.svelte'

vi.mock('svelte-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  target = document.createElement('div')
  document.body.appendChild(target)
  vi.clearAllMocks()
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  target.remove()
  vi.unstubAllGlobals()
})

function stubClipboard(): ReturnType<typeof vi.fn> {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  return writeText
}

function clickCopy(selector: string): void {
  const button = target.querySelector(selector)
  if (!(button instanceof HTMLButtonElement)) throw new Error(`copy button not found: ${selector}`)
  button.click()
  flushSync()
}

describe('copy affordance wiring', () => {
  it('Copyable writes its copyText and reports success', async () => {
    const writeText = stubClipboard()
    instance = mount(Copyable, { target, props: { text: 'visible', copyText: 'hello' } })
    flushSync()

    clickCopy('button[aria-label]')

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('hello'))
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('EditableText writes its text from the copyable affordance', async () => {
    const writeText = stubClipboard()
    instance = mount(EditableText, {
      target,
      props: { text: 'hi', copyable: true, onChange: () => {} },
    })
    flushSync()

    // The copy affordance takes its accessible name from the shared locale
    // key (`common.copy`), not from a hardcoded English string.
    clickCopy('button[aria-label="Copy"]')

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('hi'))
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1))
    expect(toast.error).not.toHaveBeenCalled()
  })
})
