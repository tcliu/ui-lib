// Show-code source for the SelectDropdown demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.
import { sizeAttributeLine } from '$showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export const SELECT_STAGE_DEFAULT_WIDTH = 560
export const SELECT_STAGE_MIN_WIDTH = 240

export interface SelectDropdownSnippetState {
  ariaLabel: string
  ariaLabelOn: boolean
  buttonLabel: string
  buttonLabelOn: boolean
  // Committed value, seeded as script-local state so the snippet text tracks
  // activeValue edits instead of hiding the value in scope.
  value: string
  valueOn: boolean
  defaultValue: string
  defaultValueOn: boolean
  size: string
  sizeOn: boolean
  filterable: TriState
  filterableOn: boolean
  allowCustomValue: TriState
  allowCustomValueOn: boolean
  buttonClass: string
  buttonClassOn: boolean
  controlClass: string
  controlClassOn: boolean
  optionClass: string
  optionClassOn: boolean
  emptyLabel: string
  emptyLabelOn: boolean
  clearable: TriState
  clearableOn: boolean
  clearLabel: string
  clearLabelOn: boolean
  align: string
  alignOn: boolean
  autoPlace: TriState
  autoPlaceOn: boolean
  panelClass: string
  panelClassOn: boolean
}

// Option-JSON parsing, tag-attribute extraction, and script-value reads live in
// the shared showcase modules (`option-json.ts`, `snippet-attributes.ts`) so
// sibling demos reuse them; this builder only emits source.

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: string, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`${indent}${name}${value === 'yes' ? '' : '={false}'}`]
}

// A string attribute line, omitted while unset.
function textLine(name: string, value: string, indent: string): string[] {
  return value ? [`${indent}${name}="${value}"`] : []
}

export function buildSelectDropdownSnippet({
  ariaLabel,
  ariaLabelOn,
  buttonLabel,
  buttonLabelOn,
  value,
  valueOn,
  defaultValue,
  defaultValueOn,
  size,
  sizeOn,
  filterable,
  filterableOn,
  allowCustomValue,
  allowCustomValueOn,
  buttonClass,
  buttonClassOn,
  controlClass,
  controlClassOn,
  optionClass,
  optionClassOn,
  emptyLabel,
  emptyLabelOn,
  clearable,
  clearableOn,
  clearLabel,
  clearLabelOn,
  align,
  alignOn,
  autoPlace,
  autoPlaceOn,
  panelClass,
  panelClassOn,
}: SelectDropdownSnippetState): string {
  // The frame is shell chrome, so the component sits at the snippet root with
  // its attributes one step in; the committed value is script-local state.
  // Each eye-gated override emits only while its toggle is on (the committed
  // text stays parked while off).
  const indent = '  '
  const attributes = [
    // A custom label renders as a literal; unset, the trigger derives its
    // label from the committed value, so no line is emitted.
    ...(buttonLabelOn && buttonLabel ? [`${indent}buttonLabel="${buttonLabel}"`] : []),
    ...(valueOn ? [`${indent}activeValue={value}`] : []),
    ...(ariaLabelOn && ariaLabel ? [`${indent}ariaLabel="${ariaLabel}"`] : []),
    // Baseline the clear button compares against; the eye stages it.
    ...(defaultValueOn && defaultValue ? [`${indent}defaultValue="${defaultValue}"`] : []),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, indent) : []),
    ...(filterableOn ? flagLine('filterable', filterable, indent, 'no') : []),
    ...(allowCustomValueOn ? flagLine('allowCustomValue', allowCustomValue, indent, 'no') : []),
    ...(buttonClassOn && buttonClass ? [`${indent}buttonClass="${buttonClass}"`] : []),
    ...(controlClassOn && controlClass ? [`${indent}controlClass="${controlClass}"`] : []),
    ...(optionClassOn && optionClass ? [`${indent}optionClass="${optionClass}"`] : []),
    ...(emptyLabelOn && emptyLabel ? [`${indent}emptyLabel="${emptyLabel}"`] : []),
    ...(clearableOn ? flagLine('clearable', clearable, indent, 'no') : []),
    ...(clearLabelOn && clearLabel ? [`${indent}clearLabel="${clearLabel}"`] : []),
    ...(alignOn && align && align !== 'left' ? [`${indent}align="${align}"`] : []),
    ...(autoPlaceOn ? flagLine('autoPlace', autoPlace, indent, 'yes') : []),
    ...(panelClassOn && panelClass ? [`${indent}panelClass="${panelClass}"`] : []),
    `${indent}options={options}`,
    `${indent}onSelect={next => (value = next)} />`,
  ]
  return [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `${indent}let value = $state(${JSON.stringify(value)})`,
    '</script>',
    '<SelectDropdown',
    ...attributes,
    '<span class="text-sm text-slate-400">value: {value}</span>',
  ].join('\n')
}
