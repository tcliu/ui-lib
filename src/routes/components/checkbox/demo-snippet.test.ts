import { describe, expect, it } from 'vitest'
import { STYLED_WRAPPER, buildCheckboxSnippet, type CheckboxSnippetState } from './demo-snippet'

describe('buildCheckboxSnippet', () => {
  it('uses the scoped label while unset', () => {
    const source = buildCheckboxSnippet({
      label: '',
      labelOn: false,
      size: '',
      sizeOn: false,
      disabled: '',
      disabledOn: false,
      indeterminate: '',
      indeterminateOn: false,
      wrapperClass: '',
      wrapperClassOn: false,
      ariaLabel: '',
      ariaLabelOn: false,
      name: '',
      nameOn: false,
      stopPropagation: '',
      stopPropagationOn: false,
    })
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
      label: 'Ok',
      labelOn: true,
      size: 'sm',
      sizeOn: true,
      disabled: 'yes',
      disabledOn: true,
      indeterminate: 'yes',
      indeterminateOn: true,
      wrapperClass: STYLED_WRAPPER,
      wrapperClassOn: true,
      ariaLabel: 'Confirm',
      ariaLabelOn: true,
      name: 'confirm',
      nameOn: true,
      stopPropagation: 'no',
      stopPropagationOn: true,
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
      label: '',
      labelOn: false,
      size: 'md',
      sizeOn: true,
      disabled: 'no',
      disabledOn: true,
      indeterminate: 'no',
      indeterminateOn: true,
      wrapperClass: '',
      wrapperClassOn: false,
      ariaLabel: '',
      ariaLabelOn: false,
      name: '',
      nameOn: false,
      stopPropagation: 'yes',
      stopPropagationOn: true,
    })
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('indeterminate')
    expect(source).not.toContain('stopPropagation')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    const base: Omit<CheckboxSnippetState, 'size' | 'sizeOn'> = {
      label: '',
      labelOn: false,
      disabled: '',
      disabledOn: false,
      indeterminate: '',
      indeterminateOn: false,
      wrapperClass: '',
      wrapperClassOn: false,
      ariaLabel: '',
      ariaLabelOn: false,
      name: '',
      nameOn: false,
      stopPropagation: '',
      stopPropagationOn: false,
    }
    const numeric = buildCheckboxSnippet({ ...base, size: '14', sizeOn: true })
    expect(numeric).toContain('size={14}')
    const invalid = buildCheckboxSnippet({ ...base, size: 'huge', sizeOn: true })
    expect(invalid).not.toContain('size=')
  })

  it('omits the staged size while its eye is off', () => {
    const off = buildCheckboxSnippet({ label: '', labelOn: false, size: 'sm', sizeOn: false, disabled: '', disabledOn: false, indeterminate: '', indeterminateOn: false, wrapperClass: '', wrapperClassOn: false, ariaLabel: '', ariaLabelOn: false, name: '', nameOn: false, stopPropagation: '', stopPropagationOn: false })
    expect(off).not.toContain('size=')
  })

  it('stages the eye-gated text rows until applied', () => {
    const staged = buildCheckboxSnippet({ label: '', labelOn: false, size: '', sizeOn: false, disabled: '', disabledOn: false, indeterminate: '', indeterminateOn: false, wrapperClass: STYLED_WRAPPER, wrapperClassOn: false, ariaLabel: 'Confirm', ariaLabelOn: false, name: 'confirm', nameOn: false, stopPropagation: '', stopPropagationOn: false })
    expect(staged).not.toContain('wrapperClass=')
    expect(staged).not.toContain('ariaLabel=')
    expect(staged).not.toContain('name=')
    const applied = buildCheckboxSnippet({ label: '', labelOn: false, size: '', sizeOn: false, disabled: '', disabledOn: false, indeterminate: '', indeterminateOn: false, wrapperClass: STYLED_WRAPPER, wrapperClassOn: true, ariaLabel: 'Confirm', ariaLabelOn: true, name: 'confirm', nameOn: true, stopPropagation: '', stopPropagationOn: false })
    expect(applied).toContain(`wrapperClass="${STYLED_WRAPPER}"`)
    expect(applied).toContain('ariaLabel="Confirm"')
    expect(applied).toContain('name="confirm"')
  })

  it('omits staged flag props while their eyes are off', () => {
    const off = buildCheckboxSnippet({ label: '', labelOn: false, size: '', sizeOn: false, disabled: 'yes', disabledOn: false, indeterminate: 'yes', indeterminateOn: false, wrapperClass: '', wrapperClassOn: false, ariaLabel: '', ariaLabelOn: false, name: '', nameOn: false, stopPropagation: 'no', stopPropagationOn: false })
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('indeterminate')
    expect(off).not.toContain('stopPropagation')
  })

  it('falls back to the scoped label while its eye is off', () => {
    const off = buildCheckboxSnippet({ label: 'Ok', labelOn: false, size: '', sizeOn: false, disabled: '', disabledOn: false, indeterminate: '', indeterminateOn: false, wrapperClass: '', wrapperClassOn: false, ariaLabel: '', ariaLabelOn: false, name: '', nameOn: false, stopPropagation: '', stopPropagationOn: false })
    expect(off).toContain('label={applyLabel}')
    expect(off).not.toContain('label="Ok"')
    const on = buildCheckboxSnippet({ label: 'Ok', labelOn: true, size: '', sizeOn: false, disabled: '', disabledOn: false, indeterminate: '', indeterminateOn: false, wrapperClass: '', wrapperClassOn: false, ariaLabel: '', ariaLabelOn: false, name: '', nameOn: false, stopPropagation: '', stopPropagationOn: false })
    expect(on).toContain('label="Ok"')
  })
})
