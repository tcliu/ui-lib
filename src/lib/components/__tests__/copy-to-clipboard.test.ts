import { describe, expect, it, vi } from 'vitest'
import { toast } from 'svelte-sonner'
import { copyToClipboard } from '../copy-to-clipboard'

vi.mock('svelte-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const messages = { copied: 'Copied', failed: 'Copy failed' }

describe('copyToClipboard', () => {
  it('writes the text and fires the success feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.clearAllMocks()

    await copyToClipboard('hello', messages)

    expect(writeText).toHaveBeenCalledWith('hello')
    expect(toast.success).toHaveBeenCalledWith('Copied')
    expect(toast.error).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('surfaces the failure message', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.clearAllMocks()

    await copyToClipboard('hello', messages)

    expect(toast.error).toHaveBeenCalledWith('denied')
    expect(toast.success).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('falls back to the localized failure when the error carries no message', async () => {
    const writeText = vi.fn().mockRejectedValue('nope')
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.clearAllMocks()

    await copyToClipboard('hello', messages)

    expect(toast.error).toHaveBeenCalledWith('Copy failed')
    vi.unstubAllGlobals()
  })
})
