import { describe, expect, it } from 'vitest'
import { staged } from '$showcase/playground/staged'
import { DEFAULT_CHIP_CLASS, buildChipSnippet, type ChipSnippetState } from './demo-snippet'

function state(overrides: Partial<ChipSnippetState> = {}): ChipSnippetState {
  return {
    removable: staged('', true),
    label: staged('', true),
    chipClass: staged('', true),
    size: staged(''),
    removeLabel: staged(''),
    disabled: staged('', true),
    removeButtonClass: staged(''),
    removeButtonStyle: staged(''),
    style: staged(''),
    tooltip: staged(''),
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
    const source = buildChipSnippet(state({ removable: staged('yes', true), label: staged('Draft', true), removeLabel: staged('Remove it', true), disabled: staged('yes', true), removeButtonClass: staged('btn-x', true), removeButtonStyle: staged('color:red', true) }))
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
    const source = buildChipSnippet(state({ chipClass: staged('text-cyan-200', true), style: staged('font-weight:bold', true), tooltip: staged('Pill tip', true) }))
    expect(source).toContain('chipClass="text-cyan-200"')
    expect(source).toContain('style="font-weight:bold"')
    expect(source).toContain('tooltip="Pill tip"')
    expect(source).not.toContain('onClick=')
  })

  it('emits a non-default size and omits the md default', () => {
    const removed = buildChipSnippet(state({ size: staged('lg', true) }))
    expect(removed).toContain('  size="lg"')
    expect(buildChipSnippet(state({ size: staged('18', true) }))).toContain('  size={18}')
    expect(buildChipSnippet(state({ size: staged('md', true) }))).not.toContain('size=')
    expect(buildChipSnippet(state({ size: staged('lg') }))).not.toContain('size=')
    expect(buildChipSnippet(state({ removable: staged('yes', true), size: staged('lg', true) }))).toContain('    size="lg"')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildChipSnippet(state({ removable: staged('yes', true), label: staged('Draft', true), disabled: staged('no', true) }))
    expect(source).not.toContain('disabled')
  })

  it('stages the eye-gated text rows until applied', () => {
    const stagedRows = buildChipSnippet(state({ removable: staged('yes', true), label: staged('Draft'), removeLabel: staged('Remove it'), removeButtonClass: staged('btn-x'), removeButtonStyle: staged('color:red'), style: staged('font-weight:bold'), tooltip: staged('Pill tip') }))
    expect(stagedRows).not.toContain('removeLabel=')
    expect(stagedRows).not.toContain('removeButtonClass=')
    expect(stagedRows).not.toContain('removeButtonStyle=')
    expect(stagedRows).not.toContain('style=')
    expect(stagedRows).not.toContain('tooltip=')
    const applied = buildChipSnippet(state({ removable: staged('yes', true), label: staged('Draft', true), removeLabel: staged('Remove it', true), removeButtonClass: staged('btn-x', true), removeButtonStyle: staged('color:red', true), style: staged('font-weight:bold', true), tooltip: staged('Pill tip', true) }))
    expect(applied).toContain('removeLabel="Remove it"')
    expect(applied).toContain('removeButtonClass="btn-x"')
    expect(applied).toContain('removeButtonStyle="color:red"')
    expect(applied).toContain('style="font-weight:bold"')
    expect(applied).toContain('tooltip="Pill tip"')
  })

  it('falls back to the scope label and default class and omits the flag while their eyes are off', () => {
    const off = buildChipSnippet(state({ removable: staged('yes', true), label: staged('Draft'), chipClass: staged('text-cyan-200'), disabled: staged('yes') }))
    expect(off).not.toContain('label="Draft"')
    expect(off).toContain('label={defaultLabel}')
    expect(off).not.toContain('chipClass="text-cyan-200"')
    expect(off).toContain(`chipClass="${DEFAULT_CHIP_CLASS}"`)
    expect(off).not.toContain('disabled')
  })
})
