// Show-code source for the Chip demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import { boolAttrLine, escapeAttr, sizeAttrLine, textAttrLine, type TriState } from '$showcase/snippet-build'
import { appliedFlag, type Staged } from '$showcase/staged'

export interface ChipSnippetState {
  label: Staged<string>
  chipClass: Staged<string>
  size: Staged<string>
  removable: Staged<TriState>
  removeLabel: Staged<string>
  disabled: Staged<TriState>
  removeButtonClass: Staged<string>
  removeButtonStyle: Staged<string>
  style: Staged<string>
  tooltip: Staged<string>
}

// The pill's look only: Chip owns the size-scaled padding, font, and line.
export const DEFAULT_CHIP_CLASS = 'rounded-md border border-slate-700 bg-slate-800 text-slate-200'

export function buildChipSnippet(state: ChipSnippetState): string {
  const { label, chipClass, size, removable, removeLabel, disabled, removeButtonClass, removeButtonStyle, style, tooltip } = state
  const labelAttr = label.on && label.value ? `label="${escapeAttr(label.value)}"` : 'label={defaultLabel}'
  const classAttr = `chipClass="${escapeAttr(chipClass.on && chipClass.value ? chipClass.value : DEFAULT_CHIP_CLASS)}"`
  // Style/tooltip ride the pill in every mode; the remove props only render in
  // the removable mode that mounts a button.
  const pillAttrs = [...textAttrLine('style', style, '  '), ...textAttrLine('tooltip', tooltip, '  ')]
  if (appliedFlag(removable) === true) {
    return [
      '{#if !removed}',
      '  <Chip',
      `    ${labelAttr}`,
      `    ${classAttr}`,
      ...sizeAttrLine(size, '    '),
      '    removable',
      ...textAttrLine('removeLabel', removeLabel, '    '),
      ...boolAttrLine('disabled', disabled, 'no', '    '),
      ...textAttrLine('removeButtonClass', removeButtonClass, '    '),
      ...textAttrLine('removeButtonStyle', removeButtonStyle, '    '),
      ...pillAttrs.map(line => `  ${line}`),
      '    onRemove={() => (removed = true)} />',
      '{/if}',
    ].join('\n')
  }
  return [
    '<Chip',
    `  ${labelAttr}`,
    `  ${classAttr}`,
    ...sizeAttrLine(size),
    ...pillAttrs,
    '/>',
  ].join('\n')
}
