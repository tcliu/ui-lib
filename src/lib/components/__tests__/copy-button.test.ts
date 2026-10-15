import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import { toast } from 'svelte-sonner'
import CopyButton from '../CopyButton.svelte'

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

function render(text: string): void {
  instance = mount(CopyButton, { target, props: { text, ariaLabel: 'Copy' } })
  flushSync()
}

function clickCopy(): void {
  const button = target.querySelector('button')
  if (!(button instanceof HTMLButtonElement)) throw new Error('copy button not found')
  button.click()
  flushSync()
}

describe('CopyButton', () => {
  it('writes the text to the clipboard and fires the success feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render('hello')

    clickCopy()
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('hello'))
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('surfaces the failure through the error feedback', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render('hello')

    clickCopy()
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('denied'))
    expect(toast.success).not.toHaveBeenCalled()
  })
})
