import { describe, expect, it } from 'vitest'
import { buildToastSnippet } from './demo-snippet'

describe('buildToastSnippet', () => {
  it('uses the scoped default message while unset', () => {
    const source = buildToastSnippet({ message: '', toastType: '', position: '', size: '', action: '' })
    expect(source).toContain('message={defaultMessage}')
    expect(source).toContain('closeLabel={closeLabel}')
    expect(source).not.toContain('type=')
    expect(source).not.toContain('position=')
    expect(source).not.toContain('actionLabel=')
  })

  it('emits message, type, position, size, and the action wiring', () => {
    const source = buildToastSnippet({
      message: 'Saved',
      toastType: 'success',
      position: 'top-right',
      size: 'md',
      action: 'Undo',
    })
    expect(source).toContain('message="Saved"')
    expect(source).toContain('type="success"')
    expect(source).toContain('position="top-right"')
    expect(source).toContain('size="md"')
    expect(source).toContain('actionLabel="Undo"')
    expect(source).toContain('onAction={() => (actionTaken = actionLabel)}')
  })
})
