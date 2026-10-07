// Show-code source for the Checkbox demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

import { sizeAttributeLine } from '$lib/showcase/size-input'
export type TriState = '' | 'yes' | 'no'

export interface CheckboxSnippetState {
  label: string
  size: string
  disabled: TriState
  indeterminate: TriState
  labelClass: string
  wrapperClass: string
  boxClass: string
}

export const STYLED_LABEL = 'text-cyan-300'
export const STYLED_WRAPPER = 'rounded-md border border-slate-700 px-3 py-2'
export const STYLED_BOX = 'rounded-full'

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildCheckboxSnippet({
  label,
  size,
  disabled,
  indeterminate,
  labelClass,
  wrapperClass,
  boxClass,
}: CheckboxSnippetState): string {
  const lines = [
    '<Checkbox',
    '  bind:checked={checked}',
    ...(label ? [`  label="${escapeAttr(label)}"`] : ['  label={applyLabel}']),
    ...sizeAttributeLine(size),
    ...flagLine('disabled', disabled),
    ...flagLine('indeterminate', indeterminate),
    ...(labelClass ? [`  labelClass="${escapeAttr(labelClass)}"`] : []),
    ...(wrapperClass ? [`  wrapperClass="${escapeAttr(wrapperClass)}"`] : []),
    ...(boxClass ? [`  boxClass="${escapeAttr(boxClass)}"`] : []),
    '  onChange={checked => (lastChange = String(checked))} />',
    '<p class="text-sm text-slate-400">checked: {checked}, lastChange: {lastChange}</p>',
  ]
  return lines.join('\n')
}
