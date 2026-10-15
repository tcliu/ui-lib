import { describe, expect, it } from 'vitest'
import { buildConfirmDialogSnippet } from './demo-snippet'

describe('buildConfirmDialogSnippet', () => {
  const unset = { widthVariant: '', widthVariantOn: true, heightVariant: '', heightVariantOn: true, size: '', sizeOn: true, accent: '', accentOn: true, pending: '', pendingOn: true, confirmOnDismiss: '', confirmOnDismissOn: true, className: '', classNameOn: false, closeLabel: '', closeLabelOn: false, confirmLabel: '', confirmLabelOn: true, message: '', messageOn: true, title: '', titleOn: true, buttonSize: '', buttonSizeOn: true } as const

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
      widthVariant: 'lg',
      widthVariantOn: true,
      heightVariant: '2xl',
      heightVariantOn: true,
      size: 'xl',
      sizeOn: true,
      accent: 'amber',
      accentOn: true,
      pending: 'yes',
      pendingOn: true,
      confirmOnDismiss: 'yes',
      confirmOnDismissOn: true,
      className: 'panel-x',
      classNameOn: true,
      closeLabel: 'Dismiss',
      closeLabelOn: true,
      confirmLabel: 'Delete it',
      confirmLabelOn: true,
      message: 'Gone <forever> & ever',
      messageOn: true,
      title: 'Say "bye"',
      titleOn: true,
      buttonSize: 'lg',
      buttonSizeOn: true,
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
      widthVariant: 'md',
      heightVariant: 'auto',
      accent: 'rose',
      pending: 'no',
      confirmOnDismiss: 'no',
      buttonSize: 'md',
    })
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
    expect(source).not.toContain('    accent=')
    expect(source).not.toMatch(/^\s*buttonSize=/m)
    expect(source).not.toContain('pending')
    expect(source).not.toContain('confirmOnDismiss')
  })

  it('omits staged text props while their eye is off and emits them when on', () => {
    const off = buildConfirmDialogSnippet({ ...unset, className: 'panel-x', closeLabel: 'Dismiss' })
    expect(off).toContain('closeLabel={closeLabel}')
    expect(off).not.toContain('className=')
    const on = buildConfirmDialogSnippet({ ...unset, className: 'panel-x', classNameOn: true, closeLabel: 'Dismiss', closeLabelOn: true })
    expect(on).toContain('closeLabel="Dismiss"')
    expect(on).toContain('className="panel-x"')
  })

  it('omits boolean flags while their eyes are off', () => {
    const source = buildConfirmDialogSnippet({ ...unset, pending: 'yes', pendingOn: false, confirmOnDismiss: 'yes', confirmOnDismissOn: false })
    expect(source).not.toContain('pending')
    expect(source).not.toContain('confirmOnDismiss')
  })

  it('omits text props while their eyes are off', () => {
    const source = buildConfirmDialogSnippet({
      ...unset,
      confirmLabel: 'Delete it',
      confirmLabelOn: false,
      message: 'Gone',
      messageOn: false,
      title: 'Bye',
      titleOn: false,
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
      widthVariant: 'lg',
      widthVariantOn: false,
      heightVariant: '2xl',
      heightVariantOn: false,
      size: 'xl',
      sizeOn: false,
    })
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('omits accent and button size while their eyes are off', () => {
    const source = buildConfirmDialogSnippet({
      ...unset,
      accent: 'amber',
      accentOn: false,
      buttonSize: 'lg',
      buttonSizeOn: false,
    })
    expect(source).not.toContain('    accent=')
    expect(source).not.toMatch(/^\s*buttonSize=/m)
  })
})
