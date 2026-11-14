// Show-code source for the Chip demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import { boolAttrLine, enumAttrLine, escapeAttr, sizeAttrLine, textAttrLine, type TriState } from '#showcase/playground/snippet-build.js'
import { appliedFlag, type Staged } from '#showcase/playground/staged.js'

export interface ChipSnippetState {
  label: Staged<string>
  chipClass: Staged<string>
  variant: Staged<string>
  appearance: Staged<string>
  size: Staged<string>
  removable: Staged<TriState>
  active: Staged<TriState>
  removeLabel: Staged<string>
  disabled: Staged<TriState>
  removeButtonClass: Staged<string>
  removeButtonStyle: Staged<string>
  style: Staged<string>
  tooltip: Staged<string>
}

export function buildChipSnippet(state: ChipSnippetState): string {
  const { label, chipClass, variant, appearance, size, removable, active, removeLabel, disabled, removeButtonClass, removeButtonStyle, style, tooltip } = state
  const labelAttr = label.on && label.value ? `label="${escapeAttr(label.value)}"` : 'label={defaultLabel}'
  // The named look rides the component defaults, so the builder emits only
  // non-default steps; a caller class is emitted only while set and wins.
  const lookAttrs = (indent: string): string[] => [
    ...enumAttrLine('variant', variant, 'cyan', indent),
    ...enumAttrLine('appearance', appearance, 'soft', indent),
    ...textAttrLine('chipClass', chipClass, indent),
  ]
  // Style/tooltip ride the pill in every mode; the remove props only render in
  // the removable mode that mounts a button.
  const pillAttrs = [...textAttrLine('style', style, '  '), ...textAttrLine('tooltip', tooltip, '  ')]
  // The active row implies toggle mode: a leading script-local carries the
  // pressed state so the snippet's pill toggles itself, and the removable row
  // is ignored (the page renders the toggle branch first).
  if (active.on) {
    return [
      '<script>',
      `  let active = $state(${active.value === 'yes'})`,
      '</script>',
      '<Chip',
      `  ${labelAttr}`,
      ...lookAttrs('  '),
      ...sizeAttrLine(size),
      '  active={active}',
      '  onclick={() => (active = !active)}',
      ...pillAttrs,
      '/>',
    ].join('\n')
  }
  if (appliedFlag(removable) === true) {
    return [
      '{#if !removed}',
      '  <Chip',
      `    ${labelAttr}`,
      ...lookAttrs('    '),
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
    ...lookAttrs('  '),
    ...sizeAttrLine(size),
    ...pillAttrs,
    '/>',
  ].join('\n')
}
