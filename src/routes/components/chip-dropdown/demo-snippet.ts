// Show-code source for the ChipDropdown demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.

import { escapeAttr } from '$lib/showcase/snippet-build'

export type TriState = '' | 'yes' | 'no'

export const CHIP_STAGE_DEFAULT_WIDTH = 560
export const CHIP_STAGE_MIN_WIDTH = 240

// Seeded accessible name for the trigger; the cleared form renders this while
// the ariaLabel eye is off, so the required prop always has a value.
export const DEFAULT_CHIP_DROPDOWN_ARIA_LABEL = 'Set status'

export interface ChipDropdownSnippetState {
  label: string
  labelOn: boolean
  ariaLabel: string
  ariaLabelOn: boolean
  // Committed value, seeded as script-local state so the snippet text tracks
  // activeValue edits instead of hiding the value in scope.
  value: string
  valueOn: boolean
  defaultValue: string
  defaultValueOn: boolean
  variant: string
  variantOn: boolean
  filterable: TriState
  filterableOn: boolean
  disabled: TriState
  disabledOn: boolean
  align: string
  alignOn: boolean
  filterPlaceholder: string
  filterPlaceholderOn: boolean
  buttonClass: string
  buttonClassOn: boolean
  emptyText: string
  emptyTextOn: boolean
  clearable: TriState
  clearableOn: boolean
  clearLabel: string
  clearLabelOn: boolean
  autoPlace: TriState
  autoPlaceOn: boolean
  panelClass: string
  panelClassOn: boolean
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: string, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`${indent}${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildChipDropdownSnippet({
  label,
  labelOn,
  ariaLabel,
  ariaLabelOn,
  value,
  valueOn,
  defaultValue,
  defaultValueOn,
  variant,
  variantOn,
  filterable,
  filterableOn,
  disabled,
  disabledOn,
  align,
  alignOn,
  filterPlaceholder,
  filterPlaceholderOn,
  buttonClass,
  buttonClassOn,
  emptyText,
  emptyTextOn,
  clearable,
  clearableOn,
  clearLabel,
  clearLabelOn,
  autoPlace,
  autoPlaceOn,
  panelClass,
  panelClassOn,
}: ChipDropdownSnippetState): string {
  // The frame is shell chrome, so the component sits at the snippet root with
  // its attributes one step in; the committed value is script-local state.
  const indent = '  '
  const attributes = [
    // A custom label renders as a literal while its eye is on; otherwise the
    // trigger derives its label from the committed value through the scope helper.
    ...((labelOn && label)
      ? [`${indent}label="${escapeAttr(label)}"`]
      : [`${indent}label={labelFor(options, value)}`]),
    ...(valueOn ? [`${indent}activeValue={value}`] : []),
    // Baseline the clear button compares against; the eye stages it.
    ...(defaultValueOn && defaultValue ? [`${indent}defaultValue="${escapeAttr(defaultValue)}"`] : []),
    `${indent}ariaLabel="${escapeAttr(ariaLabelOn && ariaLabel ? ariaLabel : DEFAULT_CHIP_DROPDOWN_ARIA_LABEL)}"`,
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(variantOn && variant && variant !== 'violet' ? [`${indent}variant="${variant}"`] : []),
    ...(filterableOn ? flagLine('filterable', filterable, indent, 'no') : []),
    ...(disabledOn ? flagLine('disabled', disabled, indent, 'no') : []),
    ...(alignOn && align && align !== 'left' ? [`${indent}align="${align}"`] : []),
    ...(filterPlaceholderOn && filterPlaceholder ? [`${indent}filterPlaceholder="${escapeAttr(filterPlaceholder)}"`] : []),
    ...(buttonClassOn && buttonClass ? [`${indent}buttonClass="${escapeAttr(buttonClass)}"`] : []),
    ...(emptyTextOn && emptyText ? [`${indent}emptyText="${escapeAttr(emptyText)}"`] : []),
    ...(clearableOn ? flagLine('clearable', clearable, indent, 'no') : []),
    ...(clearLabelOn && clearLabel ? [`${indent}clearLabel="${escapeAttr(clearLabel)}"`] : []),
    ...(autoPlaceOn ? flagLine('autoPlace', autoPlace, indent, 'yes') : []),
    ...(panelClassOn && panelClass ? [`${indent}panelClass="${escapeAttr(panelClass)}"`] : []),
    `${indent}options={options}`,
    `${indent}onSelect={next => (value = next)} />`,
  ]
  return [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `${indent}let value = $state(${JSON.stringify(value)})`,
    '</script>',
    '<ChipDropdown',
    ...attributes,
    '<span class="text-sm text-slate-400">value: {value}</span>',
  ].join('\n')
}
