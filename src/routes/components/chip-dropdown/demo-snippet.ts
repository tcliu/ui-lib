// Show-code source for the ChipDropdown demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.

import {
  boolAttrLine,
  enumAttrLine,
  escapeAttr,
  sizeAttrLine,
  textAttrLine,
  type TriState,
} from '$showcase/playground/snippet-build'
import type { Staged } from '$showcase/playground/staged'

export const CHIP_STAGE_DEFAULT_WIDTH = 560
export const CHIP_STAGE_MIN_WIDTH = 240

// Seeded accessible name for the trigger; the cleared form renders this while
// the ariaLabel eye is off, so the required prop always has a value.
export const DEFAULT_CHIP_DROPDOWN_ARIA_LABEL = 'Set status'

export interface ChipDropdownSnippetState {
  label: Staged<string>
  ariaLabel: Staged<string>
  // Committed value, seeded as script-local state so the snippet text tracks
  // activeValue edits instead of hiding the value in scope.
  value: Staged<string>
  defaultValue: Staged<string>
  size: Staged<string>
  variant: Staged<string>
  filterable: Staged<TriState>
  disabled: Staged<TriState>
  align: Staged<string>
  filterPlaceholder: Staged<string>
  filterLabel: Staged<string>
  buttonClass: Staged<string>
  emptyText: Staged<string>
  clearable: Staged<TriState>
  clearLabel: Staged<string>
  autoPlace: Staged<TriState>
  panelClass: Staged<string>
}

export function buildChipDropdownSnippet(state: ChipDropdownSnippetState): string {
  const { label, ariaLabel, value, defaultValue, size, variant, filterable, disabled, align, filterPlaceholder, filterLabel, buttonClass, emptyText, clearable, clearLabel, autoPlace, panelClass } = state
  // The frame is shell chrome, so the component sits at the snippet root with
  // its attributes one step in; the committed value is script-local state.
  const indent = '  '
  const attributes = [
    // A custom label renders as a literal while its eye is on; otherwise the
    // trigger derives its label from the committed value through the scope helper.
    ...(label.on && label.value
      ? [`${indent}label="${escapeAttr(label.value)}"`]
      : [`${indent}label={labelFor(options, value)}`]),
    ...(value.on ? [`${indent}activeValue={value}`] : []),
    // Baseline the clear button compares against; the eye stages it.
    ...textAttrLine('defaultValue', defaultValue, indent),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...sizeAttrLine(size, indent),
    `${indent}ariaLabel="${escapeAttr(ariaLabel.on && ariaLabel.value ? ariaLabel.value : DEFAULT_CHIP_DROPDOWN_ARIA_LABEL)}"`,
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...enumAttrLine('variant', variant, 'violet', indent),
    ...boolAttrLine('filterable', filterable, 'no', indent),
    ...boolAttrLine('disabled', disabled, 'no', indent),
    ...enumAttrLine('align', align, 'left', indent),
    ...textAttrLine('filterPlaceholder', filterPlaceholder, indent),
    ...textAttrLine('filterLabel', filterLabel, indent),
    ...textAttrLine('buttonClass', buttonClass, indent),
    ...textAttrLine('emptyText', emptyText, indent),
    ...boolAttrLine('clearable', clearable, 'no', indent),
    ...textAttrLine('clearLabel', clearLabel, indent),
    ...boolAttrLine('autoPlace', autoPlace, 'yes', indent),
    ...textAttrLine('panelClass', panelClass, indent),
    `${indent}options={options}`,
    `${indent}onSelect={next => (value = next)} />`,
  ]
  return [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `${indent}let value = $state(${JSON.stringify(value.value)})`,
    '</script>',
    '<ChipDropdown',
    ...attributes,
    '<span class="text-sm text-slate-400">value: {value}</span>',
  ].join('\n')
}
