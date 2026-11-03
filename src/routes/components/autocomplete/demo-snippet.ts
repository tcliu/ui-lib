// Show-code source for the AutoComplete demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.
import { boolAttrLine, enumAttrLine, sizeAttrLine, textAttrLine, type TriState } from '$showcase/playground/snippet-build'
import type { Staged } from '$showcase/playground/staged'
import { ratiosAttrLine } from '$showcase/playground/text-input-ratios'
import type { AutoCompleteRatioOverrides } from '$lib/components/AutoComplete.svelte'

export const AUTOCOMPLETE_STAGE_DEFAULT_WIDTH = 560
export const AUTOCOMPLETE_STAGE_MIN_WIDTH = 240

export interface AutoCompleteSnippetState {
  ariaLabel: Staged<string>
  // Bound value, seeded as script-local state so the snippet text tracks value
  // edits instead of hiding the value in scope.
  value: Staged<string>
  size: Staged<string>
  ratios: Staged<AutoCompleteRatioOverrides>
  placeholder: Staged<string>
  disabled: Staged<TriState>
  clearable: Staged<TriState>
  clearLabel: Staged<string>
  clearPlacement: Staged<string>
  defaultValue: Staged<string>
  align: Staged<string>
  autoPlace: Staged<TriState>
  panelClass: Staged<string>
}

export function buildAutoCompleteSnippet(state: AutoCompleteSnippetState): string {
  const { ariaLabel, value, size, ratios, placeholder, disabled, clearable, clearLabel, clearPlacement, defaultValue, align, autoPlace, panelClass } = state
  // The frame is shell chrome, so the component sits at the snippet root with
  // its attributes one step in; the bound value is script-local state.
  const indent = '  '
  const attributes = [
    `${indent}bind:value`,
    ...textAttrLine('ariaLabel', ariaLabel, indent),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...sizeAttrLine(size, indent),
    ...ratiosAttrLine(ratios, indent),
    ...textAttrLine('placeholder', placeholder, indent),
    ...boolAttrLine('disabled', disabled, 'no', indent),
    ...enumAttrLine('align', align, 'left', indent),
    ...boolAttrLine('autoPlace', autoPlace, 'yes', indent),
    ...textAttrLine('panelClass', panelClass, indent),
    ...boolAttrLine('clearable', clearable, 'no', indent),
    ...textAttrLine('clearLabel', clearLabel, indent),
    ...enumAttrLine('clearPlacement', clearPlacement, 'auto', indent),
    ...textAttrLine('defaultValue', defaultValue, indent),
    `${indent}options={options} />`,
  ]
  return [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `${indent}let value = $state(${JSON.stringify(value.value)})`,
    '</script>',
    '<AutoComplete',
    ...attributes,
    '<span class="text-sm text-slate-400">value: {value}</span>',
  ].join('\n')
}
