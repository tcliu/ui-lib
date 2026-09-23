import { describe, expect, it } from 'vitest'
import { buildConfirmDialogSnippet } from './demo-snippet'

describe('buildConfirmDialogSnippet', () => {
  const unset = { maxWidth: '', confirmColor: '', pending: '', confirmOnDismiss: '' } as const

  it('omits every override while unset', () => {
    const source = buildConfirmDialogSnippet({ ...unset })
    expect(source).toContain('title={discardTitle}')
    expect(source).toContain('onConfirm={() => { result = \'confirmed\'; open = false }}')
    expect(source).toContain('onCancel={() => { result = \'cancelled\'; open = false }}')
    expect(source).not.toContain('maxWidth=')
    expect(source).not.toContain('confirmColor=')
    expect(source).not.toContain('pending')
    expect(source).not.toContain('confirmOnDismiss')
  })

  it('emits each curated override when set', () => {
    const source = buildConfirmDialogSnippet({
      maxWidth: 'lg',
      confirmColor: 'amber',
      pending: 'yes',
      confirmOnDismiss: 'no',
    })
    expect(source).toContain('maxWidth="lg"')
    expect(source).toContain('confirmColor="amber"')
    expect(source).toContain('    pending\n')
    expect(source).toContain('confirmOnDismiss={false}')
  })
})
