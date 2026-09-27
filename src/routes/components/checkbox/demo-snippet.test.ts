import { describe, expect, it } from 'vitest'
import { STYLED_BOX, STYLED_LABEL, STYLED_WRAPPER, buildCheckboxSnippet } from './demo-snippet'

describe('buildCheckboxSnippet', () => {
  it('uses the scoped label while unset', () => {
    const source = buildCheckboxSnippet({
      label: '',
      size: '',
      disabled: '',
      indeterminate: '',
      labelClass: '',
      wrapperClass: '',
      boxClass: '',
    })
    expect(source).toContain('label={applyLabel}')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('labelClass=')
    expect(source).not.toContain('wrapperClass=')
    expect(source).not.toContain('boxClass=')
  })

  it('emits size, flags, and styled classes when set', () => {
    const source = buildCheckboxSnippet({
      label: 'Ok',
      size: 'sm',
      disabled: 'yes',
      indeterminate: 'no',
      labelClass: STYLED_LABEL,
      wrapperClass: STYLED_WRAPPER,
      boxClass: STYLED_BOX,
    })
    expect(source).toContain('label="Ok"')
    expect(source).toContain('size="sm"')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('indeterminate={false}')
    expect(source).toContain('labelClass="text-cyan-300"')
    expect(source).toContain('wrapperClass="rounded-md border border-slate-700 px-3 py-2"')
    expect(source).toContain('boxClass="rounded-full"')
  })
})
