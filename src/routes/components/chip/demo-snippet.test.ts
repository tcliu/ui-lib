import { describe, expect, it } from 'vitest'
import { DEFAULT_CHIP_CLASS, buildChipSnippet } from './demo-snippet'

describe('buildChipSnippet', () => {
  it('renders a static chip with the default class while unset', () => {
    const source = buildChipSnippet({ mode: '', label: '', labelOn: true, chipClass: '', chipClassOn: true, removeLabel: '', removeLabelOn: false, disabled: '', disabledOn: true, removeButtonClass: '', removeButtonClassOn: false, removeButtonStyle: '', removeButtonStyleOn: false, style: '', styleOn: false, tooltip: '', tooltipOn: false })
    expect(source).toContain('label={defaultLabel}')
    expect(source).toContain(`chipClass="${DEFAULT_CHIP_CLASS}"`)
    expect(source).not.toContain('onRemove=')
    expect(source).not.toContain('onClick=')
    expect(source).not.toContain('removeLabel=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('style=')
    expect(source).not.toContain('tooltip=')
  })

  it('wraps the removable chip in a removed guard', () => {
    const source = buildChipSnippet({ mode: 'removable', label: 'Draft', labelOn: true, chipClass: '', chipClassOn: true, removeLabel: 'Remove it', removeLabelOn: true, disabled: 'yes', disabledOn: true, removeButtonClass: 'btn-x', removeButtonClassOn: true, removeButtonStyle: 'color:red', removeButtonStyleOn: true, style: '', styleOn: false, tooltip: '', tooltipOn: false })
    expect(source).toContain('{#if !removed}')
    expect(source).toContain('label="Draft"')
    expect(source).toContain('removeLabel="Remove it"')
    expect(source).toContain('    disabled\n')
    expect(source).toContain('removeButtonClass="btn-x"')
    expect(source).toContain('removeButtonStyle="color:red"')
    expect(source).toContain('onRemove={() => (removed = true)}')
  })

  it('carries the pill style and tooltip in the static mode', () => {
    const source = buildChipSnippet({ mode: '', label: '', labelOn: true, chipClass: 'text-cyan-200', chipClassOn: true, removeLabel: '', removeLabelOn: false, disabled: '', disabledOn: true, removeButtonClass: '', removeButtonClassOn: false, removeButtonStyle: '', removeButtonStyleOn: false, style: 'font-weight:bold', styleOn: true, tooltip: 'Pill tip', tooltipOn: true })
    expect(source).toContain('chipClass="text-cyan-200"')
    expect(source).toContain('style="font-weight:bold"')
    expect(source).toContain('tooltip="Pill tip"')
    expect(source).not.toContain('onClick=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildChipSnippet({ mode: 'removable', label: 'Draft', labelOn: true, chipClass: '', chipClassOn: true, removeLabel: '', removeLabelOn: false, disabled: 'no', disabledOn: true, removeButtonClass: '', removeButtonClassOn: false, removeButtonStyle: '', removeButtonStyleOn: false, style: '', styleOn: false, tooltip: '', tooltipOn: false })
    expect(source).not.toContain('disabled')
  })

  it('stages the eye-gated text rows until applied', () => {
    const staged = buildChipSnippet({ mode: 'removable', label: 'Draft', labelOn: false, chipClass: '', chipClassOn: true, removeLabel: 'Remove it', removeLabelOn: false, disabled: '', disabledOn: true, removeButtonClass: 'btn-x', removeButtonClassOn: false, removeButtonStyle: 'color:red', removeButtonStyleOn: false, style: 'font-weight:bold', styleOn: false, tooltip: 'Pill tip', tooltipOn: false })
    expect(staged).not.toContain('removeLabel=')
    expect(staged).not.toContain('removeButtonClass=')
    expect(staged).not.toContain('removeButtonStyle=')
    expect(staged).not.toContain('style=')
    expect(staged).not.toContain('tooltip=')
    const applied = buildChipSnippet({ mode: 'removable', label: 'Draft', labelOn: true, chipClass: '', chipClassOn: true, removeLabel: 'Remove it', removeLabelOn: true, disabled: '', disabledOn: true, removeButtonClass: 'btn-x', removeButtonClassOn: true, removeButtonStyle: 'color:red', removeButtonStyleOn: true, style: 'font-weight:bold', styleOn: true, tooltip: 'Pill tip', tooltipOn: true })
    expect(applied).toContain('removeLabel="Remove it"')
    expect(applied).toContain('removeButtonClass="btn-x"')
    expect(applied).toContain('removeButtonStyle="color:red"')
    expect(applied).toContain('style="font-weight:bold"')
    expect(applied).toContain('tooltip="Pill tip"')
  })

  it('falls back to the scope label and default class and omits the flag while their eyes are off', () => {
    const off = buildChipSnippet({ mode: 'removable', label: 'Draft', labelOn: false, chipClass: 'text-cyan-200', chipClassOn: false, removeLabel: '', removeLabelOn: false, disabled: 'yes', disabledOn: false, removeButtonClass: '', removeButtonClassOn: false, removeButtonStyle: '', removeButtonStyleOn: false, style: '', styleOn: false, tooltip: '', tooltipOn: false })
    expect(off).not.toContain('label="Draft"')
    expect(off).toContain('label={defaultLabel}')
    expect(off).not.toContain('chipClass="text-cyan-200"')
    expect(off).toContain(`chipClass="${DEFAULT_CHIP_CLASS}"`)
    expect(off).not.toContain('disabled')
  })
})
