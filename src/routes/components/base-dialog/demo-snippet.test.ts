import { describe, expect, it } from 'vitest'
import { STYLED_PANEL, STYLED_TITLE, buildBaseDialogSnippet } from './demo-snippet'

describe('buildBaseDialogSnippet', () => {
  it('renders the titled dialog while unset', () => {
    const source = buildBaseDialogSnippet({
      maxWidth: '',
      height: '',
      fullscreen: '',
      pending: '',
      allowPendingCancel: '',
      titleClass: '',
      className: '',
      customHeader: '',
    })
    expect(source).toContain('title={dialogTitle}')
    expect(source).not.toContain('maxWidth=')
    expect(source).not.toContain('pending')
    expect(source).not.toContain('header=')
    expect(source).not.toContain('titleClass=')
    // Indented: the static <Buttons> footer line also carries a className.
    expect(source).not.toContain('    className=')
  })

  it('emits sizing, flags, styled classes, and the custom header', () => {
    const source = buildBaseDialogSnippet({
      maxWidth: 'xl',
      height: 'tall',
      fullscreen: 'yes',
      pending: 'yes',
      allowPendingCancel: 'no',
      titleClass: STYLED_TITLE,
      className: STYLED_PANEL,
      customHeader: 'yes',
    })
    expect(source).toContain('header={customHeader}')
    expect(source).not.toContain('title={dialogTitle}')
    expect(source).toContain('maxWidth="xl"')
    expect(source).toContain('height="tall"')
    expect(source).toContain('    fullscreen\n')
    expect(source).toContain('    pending\n')
    expect(source).toContain('allowPendingCancel={false}')
    expect(source).toContain('titleClass="text-cyan-200"')
    expect(source).toContain('className="border-cyan-500/40"')
  })
})
