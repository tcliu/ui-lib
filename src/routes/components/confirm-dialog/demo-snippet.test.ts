import { describe, expect, it } from 'vitest'
import { staged } from '#showcase/playground/staged.js'
import { type TriState } from '#showcase/playground/snippet-build.js'
import { buildConfirmDialogSnippet } from './demo-snippet'

describe('buildConfirmDialogSnippet', () => {
  const unset = { widthVariant: staged('', true), heightVariant: staged('', true), size: staged('', true), accent: staged('', true), pending: staged('' as TriState, true), confirmOnDismiss: staged('' as TriState, true), className: staged('', false), closeLabel: staged('', false), confirmLabel: staged('', true), message: staged('', true), title: staged('', true), buttonSize: staged('', true) } as const

  it('omits every override while unset', () => {
    const source = buildConfirmDialogSnippet({ ...unset })
    expect(source).toContain('title={discardTitle}')
    expect(source).toContain('message={discardMessage}')
    expect(source).toContain('confirmLabel={discardLabel}')
    expect(source).toContain('closeLabel={closeLabel}')
    expect(source).not.toContain('className=')
    expect(source).toContain("onConfirm={() => { result = 'confirmed'; open = false }}")
    expect(source).toContain("onCancel={() => { result = 'cancelled'; open = false }}")
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
    expect(source).not.toContain('    accent=')
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toMatch(/^\s*buttonSize=/m)
    expect(source).not.toContain('pending')
    expect(source).not.toContain('confirmOnDismiss')
  })

  it('emits each curated override when set', () => {
    const source = buildConfirmDialogSnippet({
      widthVariant: staged('lg', true),
      heightVariant: staged('2xl', true),
      size: staged('xl', true),
      accent: staged('amber', true),
      pending: staged('yes', true),
      confirmOnDismiss: staged('yes', true),
      className: staged('panel-x', true),
      closeLabel: staged('Dismiss', true),
      confirmLabel: staged('Delete it', true),
      message: staged('Gone <forever> & ever', true),
      title: staged('Say "bye"', true),
      buttonSize: staged('lg', true),
    })
    expect(source).toContain('widthVariant="lg"')
    expect(source).toContain('heightVariant="2xl"')
    expect(source).toContain('size="xl"')
    expect(source).toContain('accent="amber"')
    expect(source).toContain('buttonSize="lg"')
    expect(source).toContain('    pending\n')
    expect(source).toContain('    confirmOnDismiss\n')
    expect(source).toContain('className="panel-x"')
    expect(source).toContain('closeLabel="Dismiss"')
    expect(source).toContain('confirmLabel="Delete it"')
    expect(source).toContain('message="Gone <forever> &amp; ever"')
    expect(source).toContain('title="Say &quot;bye&quot;"')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildConfirmDialogSnippet({
      ...unset,
      widthVariant: staged('md', true),
      heightVariant: staged('auto', true),
      accent: staged('rose', true),
      pending: staged('no', true),
      confirmOnDismiss: staged('no', true),
      buttonSize: staged('md', true),
    })
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
    expect(source).not.toContain('    accent=')
    expect(source).not.toMatch(/^\s*buttonSize=/m)
    expect(source).not.toContain('pending')
    expect(source).not.toContain('confirmOnDismiss')
  })

  it('omits staged text props while their eye is off and emits them when on', () => {
    const off = buildConfirmDialogSnippet({ ...unset, className: staged('panel-x'), closeLabel: staged('Dismiss') })
    expect(off).toContain('closeLabel={closeLabel}')
    expect(off).not.toContain('className=')
    const on = buildConfirmDialogSnippet({ ...unset, className: staged('panel-x', true), closeLabel: staged('Dismiss', true) })
    expect(on).toContain('closeLabel="Dismiss"')
    expect(on).toContain('className="panel-x"')
  })

  it('omits boolean flags while their eyes are off', () => {
    const source = buildConfirmDialogSnippet({ ...unset, pending: staged('yes', false), confirmOnDismiss: staged('yes', false) })
    expect(source).not.toContain('pending')
    expect(source).not.toContain('confirmOnDismiss')
  })

  it('omits text props while their eyes are off', () => {
    const source = buildConfirmDialogSnippet({
      ...unset,
      confirmLabel: staged('Delete it', false),
      message: staged('Gone', false),
      title: staged('Bye', false),
    })
    expect(source).toContain('title={discardTitle}')
    expect(source).toContain('message={discardMessage}')
    expect(source).toContain('confirmLabel={discardLabel}')
    expect(source).not.toContain('Delete it')
    expect(source).not.toContain('Gone')
    expect(source).not.toContain('Bye')
  })

  it('omits sizing props while their eyes are off', () => {
    const source = buildConfirmDialogSnippet({
      ...unset,
      widthVariant: staged('lg', false),
      heightVariant: staged('2xl', false),
      size: staged('xl', false),
    })
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('omits accent and button size while their eyes are off', () => {
    const source = buildConfirmDialogSnippet({
      ...unset,
      accent: staged('amber', false),
      buttonSize: staged('lg', false),
    })
    expect(source).not.toContain('    accent=')
    expect(source).not.toMatch(/^\s*buttonSize=/m)
  })
})
