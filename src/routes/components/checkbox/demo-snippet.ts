// Show-code source for the Checkbox demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

import { boolAttrLine, escapeAttr, sizeAttrLine, textAttrLine, type TriState } from '$showcase/snippet-build'
import type { Staged } from '$showcase/staged'

export interface CheckboxSnippetState {
  label: Staged<string>
  size: Staged<string>
  disabled: Staged<TriState>
  indeterminate: Staged<TriState>
  wrapperClass: Staged<string>
  ariaLabel: Staged<string>
  name: Staged<string>
  stopPropagation: Staged<TriState>
}

export const STYLED_WRAPPER = 'rounded-md border border-slate-700 px-3 py-2'

export function buildCheckboxSnippet(state: CheckboxSnippetState): string {
  const { label, size, disabled, indeterminate, wrapperClass, ariaLabel, name, stopPropagation } = state
  const lines = [
    '<Checkbox',
    '  bind:checked={checked}',
    ...(label.on && label.value ? [`  label="${escapeAttr(label.value)}"`] : ['  label={applyLabel}']),
    ...textAttrLine('ariaLabel', ariaLabel),
    ...textAttrLine('name', name),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...sizeAttrLine(size),
    ...boolAttrLine('disabled', disabled, 'no'),
    ...boolAttrLine('indeterminate', indeterminate, 'no'),
    ...boolAttrLine('stopPropagation', stopPropagation, 'yes'),
    ...textAttrLine('wrapperClass', wrapperClass),
    '  onChange={checked => (lastChange = String(checked))} />',
    '<p class="text-sm text-slate-400">checked: {checked}, lastChange: {lastChange}</p>',
  ]
  return lines.join('\n')
}
