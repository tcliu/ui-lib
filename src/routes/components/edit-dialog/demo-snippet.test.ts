import { describe, expect, it } from 'vitest'
import { buildEditDialogSnippet } from './demo-snippet'

describe('buildEditDialogSnippet', () => {
  it('renders the titled dialog while unset', () => {
    const source = buildEditDialogSnippet({ maxWidth: '', dirty: '', pending: '', saveDisabled: '', showReset: '' })
    expect(source).toContain('title={dialogTitle}')
    expect(source).toContain('discardTitle={discardTitle}')
    expect(source).not.toContain('maxWidth=')
    expect(source).not.toContain('dirty')
    expect(source).not.toContain('pending')
  })

  it('emits sizing and flags when set', () => {
    const source = buildEditDialogSnippet({
      maxWidth: 'lg',
      dirty: 'yes',
      pending: 'no',
      saveDisabled: 'yes',
      showReset: 'no',
    })
    expect(source).toContain('maxWidth="lg"')
    expect(source).toContain('    dirty\n')
    expect(source).toContain('pending={false}')
    expect(source).toContain('    saveDisabled\n')
    expect(source).toContain('showReset={false}')
  })
})
