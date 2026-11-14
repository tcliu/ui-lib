// Show-code source for the SelectDropdown demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.
import { boolAttrLine, enumAttrLine, sizeAttrLine, textAttrLine, type TriState } from '#showcase/playground/snippet-build.js'
import { ratiosAttrLine } from '#showcase/playground/text-input-ratios.js'
import type { Staged } from '#showcase/playground/staged.js'
import type { SelectRatioOverrides } from '#lib/components/select-dropdown-styles.js'

export const SELECT_STAGE_DEFAULT_WIDTH = 560
export const SELECT_STAGE_MIN_WIDTH = 240

export interface SelectDropdownSnippetState {
  ariaLabel: Staged<string>
  buttonLabel: Staged<string>
  // Committed value, seeded as script-local state so the snippet text tracks
  // activeValue edits instead of hiding the value in scope.
  value: Staged<string>
  defaultValue: Staged<string>
  size: Staged<string>
  ratios: Staged<SelectRatioOverrides>
  variant: Staged<string>
  filterable: Staged<TriState>
  allowCustomValue: Staged<TriState>
  hideOutline: Staged<TriState>
  buttonClass: Staged<string>
  controlClass: Staged<string>
  optionClass: Staged<string>
  emptyLabel: Staged<string>
  clearable: Staged<TriState>
  clearLabel: Staged<string>
  align: Staged<string>
  autoPlace: Staged<TriState>
  panelClass: Staged<string>
}

// Option-JSON parsing, tag-attribute extraction, and script-value reads live in
// the shared showcase modules (`option-json.ts`, `snippet-attributes.ts`) so
// sibling demos reuse them; this builder only emits source.

export function buildSelectDropdownSnippet(state: SelectDropdownSnippetState): string {
  const { ariaLabel, buttonLabel, value, defaultValue, size, ratios, variant, filterable, allowCustomValue, hideOutline, buttonClass, controlClass, optionClass, emptyLabel, clearable, clearLabel, align, autoPlace, panelClass } = state
  // The frame is shell chrome, so the component sits at the snippet root with
  // its attributes one step in; the committed value is script-local state.
  // Each eye-gated override emits only while its toggle is on (the committed
  // text stays parked while off).
  const indent = '  '
  const attributes = [
    // A custom label renders as a literal; unset, the trigger derives its
    // label from the committed value, so no line is emitted.
    ...textAttrLine('buttonLabel', buttonLabel, indent),
    ...(value.on ? [`${indent}activeValue={value}`] : []),
    ...textAttrLine('ariaLabel', ariaLabel, indent),
    // Baseline the clear button compares against; the eye stages it.
    ...textAttrLine('defaultValue', defaultValue, indent),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...sizeAttrLine(size, indent),
    ...ratiosAttrLine(ratios, indent),
    ...enumAttrLine('variant', variant, 'bordered', indent),
    ...boolAttrLine('filterable', filterable, 'no', indent),
    ...boolAttrLine('allowCustomValue', allowCustomValue, 'no', indent),
    ...boolAttrLine('hideOutline', hideOutline, 'no', indent),
    ...textAttrLine('buttonClass', buttonClass, indent),
    ...textAttrLine('controlClass', controlClass, indent),
    ...textAttrLine('optionClass', optionClass, indent),
    ...textAttrLine('emptyLabel', emptyLabel, indent),
    ...boolAttrLine('clearable', clearable, 'no', indent),
    ...textAttrLine('clearLabel', clearLabel, indent),
    ...enumAttrLine('align', align, 'left', indent),
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
    '<SelectDropdown',
    ...attributes,
    '<span class="text-sm text-slate-400">value: {value}</span>',
  ].join('\n')
}
