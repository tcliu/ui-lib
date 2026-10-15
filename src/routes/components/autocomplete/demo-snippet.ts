// Show-code source for the AutoComplete demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export const AUTOCOMPLETE_STAGE_DEFAULT_WIDTH = 560
export const AUTOCOMPLETE_STAGE_MIN_WIDTH = 240

export interface AutoCompleteSnippetState {
  ariaLabel: string
  ariaLabelOn: boolean
  // Bound value, seeded as script-local state so the snippet text tracks value
  // edits instead of hiding the value in scope.
  value: string
  size: string
  sizeOn: boolean
  placeholder: string
  placeholderOn: boolean
  disabled: TriState
  disabledOn: boolean
  clearable: TriState
  clearableOn: boolean
  clearLabel: string
  clearLabelOn: boolean
  clearPlacement: string
  clearPlacementOn: boolean
  defaultValue: string
  defaultValueOn: boolean
  align: string
  alignOn: boolean
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

// A string attribute line, omitted while unset.
function textLine(name: string, value: string, indent: string): string[] {
  return value ? [`${indent}${name}="${value}"`] : []
}

export function buildAutoCompleteSnippet({
  ariaLabel,
  ariaLabelOn,
  value,
  size,
  sizeOn,
  placeholder,
  placeholderOn,
  disabled,
  disabledOn,
  clearable,
  clearableOn,
  clearLabel,
  clearLabelOn,
  clearPlacement,
  clearPlacementOn,
  defaultValue,
  defaultValueOn,
  align,
  alignOn,
  autoPlace,
  autoPlaceOn,
  panelClass,
  panelClassOn,
}: AutoCompleteSnippetState): string {
  // The frame is shell chrome, so the component sits at the snippet root with
  // its attributes one step in; the bound value is script-local state.
  const indent = '  '
  const attributes = [
    `${indent}bind:value`,
    ...(ariaLabelOn && ariaLabel ? [`${indent}ariaLabel="${ariaLabel}"`] : []),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, indent) : []),
    ...(placeholderOn && placeholder ? textLine('placeholder', placeholder, indent) : []),
    ...(disabledOn ? flagLine('disabled', disabled, indent, 'no') : []),
    ...(alignOn && align && align !== 'left' ? [`${indent}align="${align}"`] : []),
    ...(autoPlaceOn ? flagLine('autoPlace', autoPlace, indent, 'yes') : []),
    ...(panelClassOn && panelClass ? textLine('panelClass', panelClass, indent) : []),
    ...(clearableOn ? flagLine('clearable', clearable, indent, 'no') : []),
    ...(clearLabelOn && clearLabel ? textLine('clearLabel', clearLabel, indent) : []),
    ...(clearPlacementOn && clearPlacement && clearPlacement !== 'auto' ? [`${indent}clearPlacement="${clearPlacement}"`] : []),
    ...(defaultValueOn && defaultValue ? [`${indent}defaultValue="${defaultValue}"`] : []),
    `${indent}options={options} />`,
  ]
  return [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `${indent}let value = $state(${JSON.stringify(value)})`,
    '</script>',
    '<AutoComplete',
    ...attributes,
    '<span class="text-sm text-slate-400">value: {value}</span>',
  ].join('\n')
}
