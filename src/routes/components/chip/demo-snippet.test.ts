import { describe, expect, it } from 'vitest'
import { DEFAULT_CHIP_CLASS, buildChipSnippet, type ChipSnippetState } from './demo-snippet'

function state(overrides: Partial<ChipSnippetState> = {}): ChipSnippetState {
  return {
    removable: '',
    removableOn: true,
    label: '',
    labelOn: true,
    chipClass: '',
    chipClassOn: true,
    size: '',
    sizeOn: false,
    removeLabel: '',
    removeLabelOn: false,
    disabled: '',
    disabledOn: true,
    removeButtonClass: '',
    removeButtonClassOn: false,
    removeButtonStyle: '',
    removeButtonStyleOn: false,
    style: '',
    styleOn: false,
    tooltip: '',
    tooltipOn: false,
    ...overrides,
  }
}

describe('buildChipSnippet', () => {
  it('renders a static chip with the default class while unset', () => {
    const source = buildChipSnippet(state())
    expect(source).toContain('label={defaultLabel}')
    expect(source).toContain(`chipClass="${DEFAULT_CHIP_CLASS}"`)
    expect(source).not.toContain('onRemove=')
    expect(source).not.toContain('onClick=')
    expect(source).not.toContain('removable')
    expect(source).not.toContain('removeLabel=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('style=')
    expect(source).not.toContain('tooltip=')
    expect(source).not.toContain('size=')
  })

  it('wraps the removable chip in a removed guard', () => {
    const source = buildChipSnippet(state({ removable: 'yes', label: 'Draft', removeLabel: 'Remove it', removeLabelOn: true, disabled: 'yes', removeButtonClass: 'btn-x', removeButtonClassOn: true, removeButtonStyle: 'color:red', removeButtonStyleOn: true }))
    expect(source).toContain('{#if !removed}')
    expect(source).toContain('label="Draft"')
    expect(source).toContain('    removable\n')
    expect(source).toContain('removeLabel="Remove it"')
    expect(source).toContain('    disabled\n')
    expect(source).toContain('removeButtonClass="btn-x"')
    expect(source).toContain('removeButtonStyle="color:red"')
    expect(source).toContain('onRemove={() => (removed = true)}')
  })

  it('carries the pill style and tooltip in the static mode', () => {
    const source = buildChipSnippet(state({ chipClass: 'text-cyan-200', style: 'font-weight:bold', styleOn: true, tooltip: 'Pill tip', tooltipOn: true }))
    expect(source).toContain('chipClass="text-cyan-200"')
    expect(source).toContain('style="font-weight:bold"')
    expect(source).toContain('tooltip="Pill tip"')
    expect(source).not.toContain('onClick=')
  })

  it('emits a non-default size and omits the md default', () => {
    const removed = buildChipSnippet(state({ size: 'lg', sizeOn: true }))
    expect(removed).toContain('  size="lg"')
    expect(buildChipSnippet(state({ size: '18', sizeOn: true }))).toContain('  size={18}')
    expect(buildChipSnippet(state({ size: 'md', sizeOn: true }))).not.toContain('size=')
    expect(buildChipSnippet(state({ size: 'lg', sizeOn: false }))).not.toContain('size=')
    expect(buildChipSnippet(state({ removable: 'yes', size: 'lg', sizeOn: true }))).toContain('    size="lg"')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildChipSnippet(state({ removable: 'yes', label: 'Draft', disabled: 'no', disabledOn: true }))
    expect(source).not.toContain('disabled')
  })

  it('stages the eye-gated text rows until applied', () => {
    const staged = buildChipSnippet(state({ removable: 'yes', label: 'Draft', labelOn: false, removeLabel: 'Remove it', removeLabelOn: false, removeButtonClass: 'btn-x', removeButtonClassOn: false, removeButtonStyle: 'color:red', removeButtonStyleOn: false, style: 'font-weight:bold', styleOn: false, tooltip: 'Pill tip', tooltipOn: false }))
    expect(staged).not.toContain('removeLabel=')
    expect(staged).not.toContain('removeButtonClass=')
    expect(staged).not.toContain('removeButtonStyle=')
    expect(staged).not.toContain('style=')
    expect(staged).not.toContain('tooltip=')
    const applied = buildChipSnippet(state({ removable: 'yes', label: 'Draft', removeLabel: 'Remove it', removeLabelOn: true, removeButtonClass: 'btn-x', removeButtonClassOn: true, removeButtonStyle: 'color:red', removeButtonStyleOn: true, style: 'font-weight:bold', styleOn: true, tooltip: 'Pill tip', tooltipOn: true }))
    expect(applied).toContain('removeLabel="Remove it"')
    expect(applied).toContain('removeButtonClass="btn-x"')
    expect(applied).toContain('removeButtonStyle="color:red"')
    expect(applied).toContain('style="font-weight:bold"')
    expect(applied).toContain('tooltip="Pill tip"')
  })

  it('falls back to the scope label and default class and omits the flag while their eyes are off', () => {
    const off = buildChipSnippet(state({ removable: 'yes', label: 'Draft', labelOn: false, chipClass: 'text-cyan-200', chipClassOn: false, disabled: 'yes', disabledOn: false }))
    expect(off).not.toContain('label="Draft"')
    expect(off).toContain('label={defaultLabel}')
    expect(off).not.toContain('chipClass="text-cyan-200"')
    expect(off).toContain(`chipClass="${DEFAULT_CHIP_CLASS}"`)
    expect(off).not.toContain('disabled')
  })
})
