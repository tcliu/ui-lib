import { describe, expect, it } from 'vitest'
import { buildToastSnippet } from './demo-snippet'

describe('buildToastSnippet', () => {
  it('uses the scoped default message while unset', () => {
    const source = buildToastSnippet({ message: '', messageOn: false, toastType: '', toastTypeOn: false, position: '', positionOn: false, size: '', sizeOn: false, action: '', closeLabel: '', closeLabelOn: false })
    expect(source).toContain('message={defaultMessage}')
    expect(source).toContain('closeLabel={closeLabel}')
    expect(source).not.toContain('type=')
    expect(source).not.toContain('position=')
    expect(source).not.toContain('action=')
  })

  it('emits message, type, position, size, and the action wiring', () => {
    const source = buildToastSnippet({
      message: 'Saved',
      messageOn: true,
      toastType: 'success',
      toastTypeOn: true,
      position: 'top-right',
      positionOn: true,
      size: 'lg',
      sizeOn: true,
      action: 'Undo',
      closeLabel: 'Dismiss',
      closeLabelOn: true,
    })
    expect(source).toContain('message="Saved"')
    expect(source).toContain('type="success"')
    expect(source).toContain('position="top-right"')
    expect(source).toContain('size="lg"')
    expect(source).toContain('action={{ label: "Undo", onClick: () => (actionTaken = actionLabel) }}')
    expect(source).toContain('closeLabel="Dismiss"')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildToastSnippet({ message: '', messageOn: false, toastType: 'info', toastTypeOn: true, position: 'bottom-right', positionOn: true, size: 'md', sizeOn: true, action: '', closeLabel: '', closeLabelOn: false })
    expect(source).not.toContain('type=')
    expect(source).not.toContain('position=')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    const numeric = buildToastSnippet({ message: '', messageOn: false, toastType: '', toastTypeOn: true, position: '', positionOn: true, size: '14', sizeOn: true, action: '', closeLabel: '', closeLabelOn: false })
    expect(numeric).toContain('size={14}')
    const invalid = buildToastSnippet({ message: '', messageOn: false, toastType: '', toastTypeOn: true, position: '', positionOn: true, size: 'huge', sizeOn: true, action: '', closeLabel: '', closeLabelOn: false })
    expect(invalid).not.toContain('size=')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildToastSnippet({ message: '', messageOn: false, toastType: 'success', toastTypeOn: false, position: 'top-right', positionOn: false, size: 'lg', sizeOn: false, action: '', closeLabel: '', closeLabelOn: false })
    expect(off).not.toContain('type=')
    expect(off).not.toContain('position=')
    expect(off).not.toMatch(/^\s*size=/m)
  })

  it('omits staged text props while their eyes are off and keeps the scope fallbacks', () => {
    const off = buildToastSnippet({ message: 'Saved', messageOn: false, toastType: '', toastTypeOn: false, position: '', positionOn: false, size: '', sizeOn: false, action: '', closeLabel: 'Dismiss', closeLabelOn: false })
    expect(off).not.toContain('message="Saved"')
    expect(off).not.toContain('closeLabel="Dismiss"')
    expect(off).toContain('message={defaultMessage}')
    expect(off).toContain('closeLabel={closeLabel}')
  })
})
