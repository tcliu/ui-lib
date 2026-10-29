// Show-code source for the Chip demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import { escapeAttr } from '$showcase/snippet-build'
import { sizeAttributeLine } from '$showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export interface ChipSnippetState {
  label: string
  labelOn: boolean
  chipClass: string
  chipClassOn: boolean
  size: string
  sizeOn: boolean
  removable: TriState
  removableOn: boolean
  removeLabel: string
  removeLabelOn: boolean
  disabled: TriState
  disabledOn: boolean
  removeButtonClass: string
  removeButtonClassOn: boolean
  removeButtonStyle: string
  removeButtonStyleOn: boolean
  style: string
  styleOn: boolean
  tooltip: string
  tooltipOn: boolean
}

// The pill's look only: Chip owns the size-scaled padding, font, and line.
export const DEFAULT_CHIP_CLASS = 'rounded-md border border-slate-700 bg-slate-800 text-slate-200'

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

// A `size` line while the row is applied and non-default; the component default
// `md` is omitted so Show-code stays minimal.
function sizeLine(size: string, sizeOn: boolean, indent = '  '): string[] {
  return sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, indent) : []
}

export function buildChipSnippet({ label, labelOn, chipClass, chipClassOn, size, sizeOn, removable, removableOn, removeLabel, removeLabelOn, disabled, disabledOn, removeButtonClass, removeButtonClassOn, removeButtonStyle, removeButtonStyleOn, style, styleOn, tooltip, tooltipOn }: ChipSnippetState): string {
  const labelAttr = labelOn && label ? `label="${escapeAttr(label)}"` : 'label={defaultLabel}'
  const classAttr = `chipClass="${escapeAttr(chipClassOn && chipClass ? chipClass : DEFAULT_CHIP_CLASS)}"`
  // Style/tooltip ride the pill in every mode; the remove props only render in
  // the removable mode that mounts a button.
  const pillAttrs = [
    ...(styleOn && style ? [`  style="${escapeAttr(style)}"`] : []),
    ...(tooltipOn && tooltip ? [`  tooltip="${escapeAttr(tooltip)}"`] : []),
  ]
  if (removableOn && removable === 'yes') {
    return [
      '{#if !removed}',
      '  <Chip',
      `    ${labelAttr}`,
      `    ${classAttr}`,
      ...sizeLine(size, sizeOn, '    '),
      '    removable',
      ...(removeLabelOn && removeLabel ? [`    removeLabel="${escapeAttr(removeLabel)}"`] : []),
      ...(disabledOn ? flagLine('disabled', disabled, 'no').map(line => `  ${line}`) : []),
      ...(removeButtonClassOn && removeButtonClass ? [`    removeButtonClass="${escapeAttr(removeButtonClass)}"`] : []),
      ...(removeButtonStyleOn && removeButtonStyle ? [`    removeButtonStyle="${escapeAttr(removeButtonStyle)}"`] : []),
      ...pillAttrs.map(line => `  ${line}`),
      '    onRemove={() => (removed = true)} />',
      '{/if}',
    ].join('\n')
  }
  return [
    '<Chip',
    `  ${labelAttr}`,
    `  ${classAttr}`,
    ...sizeLine(size, sizeOn),
    ...pillAttrs,
    '/>',
  ].join('\n')
}
