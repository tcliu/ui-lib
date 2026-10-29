// Show-code source for the Checkbox demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

import { escapeAttr } from '$showcase/snippet-build'
import { sizeAttributeLine } from '$showcase/size-input'
export type TriState = '' | 'yes' | 'no'

export interface CheckboxSnippetState {
  label: string
  labelOn: boolean
  size: string
  sizeOn: boolean
  disabled: TriState
  disabledOn: boolean
  indeterminate: TriState
  indeterminateOn: boolean
  wrapperClass: string
  wrapperClassOn: boolean
  ariaLabel: string
  ariaLabelOn: boolean
  name: string
  nameOn: boolean
  stopPropagation: TriState
  stopPropagationOn: boolean
}

export const STYLED_WRAPPER = 'rounded-md border border-slate-700 px-3 py-2'

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildCheckboxSnippet({
  label,
  labelOn,
  size,
  sizeOn,
  disabled,
  disabledOn,
  indeterminate,
  indeterminateOn,
  wrapperClass,
  wrapperClassOn,
  ariaLabel,
  ariaLabelOn,
  name,
  nameOn,
  stopPropagation,
  stopPropagationOn,
}: CheckboxSnippetState): string {
  const lines = [
    '<Checkbox',
    '  bind:checked={checked}',
    ...(labelOn && label ? [`  label="${escapeAttr(label)}"`] : ['  label={applyLabel}']),
    ...(ariaLabelOn && ariaLabel ? [`  ariaLabel="${escapeAttr(ariaLabel)}"`] : []),
    ...(nameOn && name ? [`  name="${escapeAttr(name)}"`] : []),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size) : []),
    ...(disabledOn ? flagLine('disabled', disabled, 'no') : []),
    ...(indeterminateOn ? flagLine('indeterminate', indeterminate, 'no') : []),
    ...(stopPropagationOn ? flagLine('stopPropagation', stopPropagation, 'yes') : []),
    ...(wrapperClassOn && wrapperClass ? [`  wrapperClass="${escapeAttr(wrapperClass)}"`] : []),
    '  onChange={checked => (lastChange = String(checked))} />',
    '<p class="text-sm text-slate-400">checked: {checked}, lastChange: {lastChange}</p>',
  ]
  return lines.join('\n')
}
