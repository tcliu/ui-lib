import { describe, expect, it } from 'vitest'
import { staged } from '$showcase/playground/staged'
import { STYLED_WRAPPER, buildCheckboxSnippet, type CheckboxSnippetState } from './demo-snippet'

const IDLE: CheckboxSnippetState = {
  label: staged(''),
  size: staged(''),
  disabled: staged(''),
  indeterminate: staged(''),
  wrapperClass: staged(''),
  ariaLabel: staged(''),
  name: staged(''),
  stopPropagation: staged(''),
}

function state(overrides: Partial<CheckboxSnippetState> = {}): CheckboxSnippetState {
  return { ...IDLE, ...overrides }
}

describe('buildCheckboxSnippet', () => {
  it('uses the scoped label while unset', () => {
    const source = buildCheckboxSnippet(state())
    expect(source).toContain('label={applyLabel}')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('wrapperClass=')
    expect(source).not.toContain('ariaLabel=')
    expect(source).not.toContain('name=')
    expect(source).not.toContain('stopPropagation')
  })

  it('emits size, flags, and the styled wrapper when set', () => {
    const source = buildCheckboxSnippet({
      label: staged('Ok', true),
      size: staged('sm', true),
      disabled: staged('yes', true),
      indeterminate: staged('yes', true),
      wrapperClass: staged(STYLED_WRAPPER, true),
      ariaLabel: staged('Confirm', true),
      name: staged('confirm', true),
      stopPropagation: staged('no', true),
    })
    expect(source).toContain('label="Ok"')
    expect(source).toContain('size="sm"')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('\n  indeterminate\n')
    expect(source).toContain('wrapperClass="rounded-md border border-slate-700 px-3 py-2"')
    expect(source).toContain('ariaLabel="Confirm"')
    expect(source).toContain('name="confirm"')
    expect(source).toContain('stopPropagation={false}')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildCheckboxSnippet({
      label: staged(''),
      size: staged('md', true),
      disabled: staged('no', true),
      indeterminate: staged('no', true),
      wrapperClass: staged(''),
      ariaLabel: staged(''),
      name: staged(''),
      stopPropagation: staged('yes', true),
    })
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('indeterminate')
    expect(source).not.toContain('stopPropagation')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildCheckboxSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    expect(buildCheckboxSnippet(state({ size: staged('huge', true) }))).not.toContain('size=')
  })

  it('omits the staged size while its eye is off', () => {
    const off = buildCheckboxSnippet(state({ size: staged('sm') }))
    expect(off).not.toContain('size=')
  })

  it('stages the eye-gated text rows until applied', () => {
    const stagedRows = buildCheckboxSnippet({ ...IDLE, wrapperClass: staged(STYLED_WRAPPER), ariaLabel: staged('Confirm'), name: staged('confirm') })
    expect(stagedRows).not.toContain('wrapperClass=')
    expect(stagedRows).not.toContain('ariaLabel=')
    expect(stagedRows).not.toContain('name=')
    const applied = buildCheckboxSnippet({ ...IDLE, wrapperClass: staged(STYLED_WRAPPER, true), ariaLabel: staged('Confirm', true), name: staged('confirm', true) })
    expect(applied).toContain(`wrapperClass="${STYLED_WRAPPER}"`)
    expect(applied).toContain('ariaLabel="Confirm"')
    expect(applied).toContain('name="confirm"')
  })

  it('omits staged flag props while their eyes are off', () => {
    const off = buildCheckboxSnippet(state({ disabled: staged('yes'), indeterminate: staged('yes'), stopPropagation: staged('no') }))
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('indeterminate')
    expect(off).not.toContain('stopPropagation')
  })

  it('falls back to the scoped label while its eye is off', () => {
    const off = buildCheckboxSnippet(state({ label: staged('Ok') }))
    expect(off).toContain('label={applyLabel}')
    expect(off).not.toContain('label="Ok"')
    const on = buildCheckboxSnippet(state({ label: staged('Ok', true) }))
    expect(on).toContain('label="Ok"')
  })
})
