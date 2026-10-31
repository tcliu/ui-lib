import { describe, expect, it } from 'vitest'
import { staged } from '$showcase/staged'
import { buildToastSnippet, type ToastSnippetState } from './demo-snippet'

function state(overrides: Partial<ToastSnippetState> = {}): ToastSnippetState {
  return {
    message: staged(''),
    toastType: staged(''),
    position: staged(''),
    size: staged(''),
    action: '',
    closeLabel: staged(''),
    ...overrides,
  }
}

describe('buildToastSnippet', () => {
  it('uses the scoped default message while unset', () => {
    const source = buildToastSnippet(state())
    expect(source).toContain('message={defaultMessage}')
    expect(source).toContain('closeLabel={closeLabel}')
    expect(source).not.toContain('type=')
    expect(source).not.toContain('position=')
    expect(source).not.toContain('action=')
  })

  it('emits message, type, position, size, and the action wiring', () => {
    const source = buildToastSnippet(
      state({
        message: staged('Saved', true),
        toastType: staged('success', true),
        position: staged('top-right', true),
        size: staged('lg', true),
        action: 'Undo',
        closeLabel: staged('Dismiss', true),
      }),
    )
    expect(source).toContain('message="Saved"')
    expect(source).toContain('type="success"')
    expect(source).toContain('position="top-right"')
    expect(source).toContain('size="lg"')
    expect(source).toContain('action={{ label: "Undo", onClick: () => (actionTaken = actionLabel) }}')
    expect(source).toContain('closeLabel="Dismiss"')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildToastSnippet(state({ toastType: staged('info', true), position: staged('bottom-right', true), size: staged('md', true) }))
    expect(source).not.toContain('type=')
    expect(source).not.toContain('position=')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    const numeric = buildToastSnippet(state({ toastType: staged('', true), position: staged('', true), size: staged('14', true) }))
    expect(numeric).toContain('size={14}')
    const invalid = buildToastSnippet(state({ toastType: staged('', true), position: staged('', true), size: staged('huge', true) }))
    expect(invalid).not.toContain('size=')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildToastSnippet(state({ toastType: staged('success'), position: staged('top-right'), size: staged('lg') }))
    expect(off).not.toContain('type=')
    expect(off).not.toContain('position=')
    expect(off).not.toMatch(/^\s*size=/m)
  })

  it('omits staged text props while their eyes are off and keeps the scope fallbacks', () => {
    const off = buildToastSnippet(state({ message: staged('Saved'), closeLabel: staged('Dismiss') }))
    expect(off).not.toContain('message="Saved"')
    expect(off).not.toContain('closeLabel="Dismiss"')
    expect(off).toContain('message={defaultMessage}')
    expect(off).toContain('closeLabel={closeLabel}')
  })
})
