// Show-code source for the NumberInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.
import { boolAttrLine, enumAttrLine, escapeAttr, sizeAttrLine, textAttrLine, type TriState } from '$showcase/playground/snippet-build'
import { ratiosAttrLine } from '$showcase/playground/text-input-ratios'
import type { Staged } from '$showcase/playground/staged'
import type { NumberInputRatioOverrides } from '$lib/components/NumberInput.svelte'

export interface NumberInputSnippetState {
  // Bound value, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  value: Staged<string>
  ariaLabel: Staged<string>
  caretAtEnd: Staged<TriState>
  min: Staged<string>
  max: Staged<string>
  step: Staged<string>
  placeholder: Staged<string>
  size?: Staged<string>
  ratios: Staged<NumberInputRatioOverrides>
  variant?: Staged<string>
  disabled: Staged<TriState>
  hideOutline: Staged<TriState>
  showControls: Staged<TriState>
  clearable: Staged<TriState>
  clearLabel: Staged<string>
  clearPlacement: Staged<string>
  defaultValue: Staged<string>
  decrementLabel: Staged<string>
  incrementLabel: Staged<string>
  id: Staged<string>
  inputStyle: Staged<string>
  className: Staged<string>
}

function asNumber(value: string): number | null {
  if (value.trim() === '') {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// A numeric expression line, omitted while the eye is off or the value is not
// a number.
function numberLine(name: string, pair: Staged<string>): string[] {
  if (!pair.on) {
    return []
  }
  const parsed = asNumber(pair.value)
  return parsed === null ? [] : [`  ${name}={${parsed}}`]
}

export function buildNumberInputSnippet(state: NumberInputSnippetState): string {
  const {
    value,
    ariaLabel,
    caretAtEnd,
    min,
    max,
    step,
    placeholder,
    size,
    ratios,
    variant,
    disabled,
    hideOutline,
    showControls,
    clearable,
    clearLabel,
    clearPlacement,
    defaultValue,
    decrementLabel,
    incrementLabel,
    id,
    inputStyle,
    className,
  } = state
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `  let value = $state(${JSON.stringify(value.value)})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    // A custom label renders as a literal while its eye is on; unset, the
    // control reads the scope label, so the scope ref stands in.
    ...(ariaLabel.on && ariaLabel.value
      ? [`  <NumberInput bind:value={value} ariaLabel="${escapeAttr(ariaLabel.value)}"`]
      : ['  <NumberInput bind:value={value} ariaLabel={applyLabel}']),
    ...boolAttrLine('caretAtEnd', caretAtEnd, 'no'),
    ...numberLine('min', min),
    ...numberLine('max', max),
    // The step row prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(step.on && step.value !== '' && step.value !== '1' ? numberLine('step', step) : []),
    ...textAttrLine('decrementLabel', decrementLabel),
    ...textAttrLine('incrementLabel', incrementLabel),
    ...textAttrLine('id', id),
    ...textAttrLine('inputStyle', inputStyle),
    ...textAttrLine('placeholder', placeholder),
    ...(size ? sizeAttrLine(size) : []),
    ...ratiosAttrLine(ratios),
    ...(variant ? enumAttrLine('variant', variant, 'bordered') : []),
    ...boolAttrLine('disabled', disabled, 'no'),
    ...boolAttrLine('hideOutline', hideOutline, 'no'),
    ...boolAttrLine('showControls', showControls, 'yes'),
    ...textAttrLine('className', className),
    ...boolAttrLine('clearable', clearable, 'no'),
    ...textAttrLine('clearLabel', clearLabel),
    ...enumAttrLine('clearPlacement', clearPlacement, 'auto'),
    ...textAttrLine('defaultValue', defaultValue),
    '  />',
    '  <span class="text-sm text-slate-400">value: {value}</span>',
    '</div>',
  ]
  return lines.join('\n')
}
