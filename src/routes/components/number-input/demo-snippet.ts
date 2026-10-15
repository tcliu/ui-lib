// Show-code source for the NumberInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export interface NumberInputSnippetState {
  // Bound value, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  value: string
  ariaLabel: string
  ariaLabelOn: boolean
  min: string
  minOn: boolean
  max: string
  maxOn: boolean
  step: string
  stepOn: boolean
  placeholder: string
  placeholderOn: boolean
  size?: string
  sizeOn: boolean
  disabled: TriState
  disabledOn: boolean
  showControls: TriState
  showControlsOn: boolean
  clearable: TriState
  clearableOn: boolean
  clearLabel: string
  clearLabelOn: boolean
  clearPlacement: string
  clearPlacementOn: boolean
  defaultValue: string
  defaultValueOn: boolean
  decrementLabel: string
  decrementLabelOn: boolean
  incrementLabel: string
  incrementLabelOn: boolean
  id: string
  idOn: boolean
  inputStyle: string
  inputStyleOn: boolean
  className: string
  classNameOn: boolean
}

export const STEPLESS_CLASS = 'w-24 px-3 py-2 text-sm'

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function asNumber(value: string): number | null {
  if (value.trim() === '') {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

function numberLine(name: string, value: string): string[] {
  const parsed = asNumber(value)
  return parsed === null ? [] : [`  ${name}={${parsed}}`]
}

function textLine(name: string, value: string): string[] {
  return value ? [`  ${name}="${escapeAttr(value)}"`] : []
}

export function buildNumberInputSnippet({
  value,
  ariaLabel,
  ariaLabelOn,
  min,
  minOn,
  max,
  maxOn,
  step,
  stepOn,
  placeholder,
  placeholderOn,
  size = '',
  sizeOn,
  disabled,
  disabledOn,
  showControls,
  showControlsOn,
  clearable,
  clearableOn,
  clearLabel,
  clearLabelOn,
  clearPlacement,
  clearPlacementOn,
  defaultValue,
  defaultValueOn,
  decrementLabel,
  decrementLabelOn,
  incrementLabel,
  incrementLabelOn,
  id,
  idOn,
  inputStyle,
  inputStyleOn,
  className,
  classNameOn,
}: NumberInputSnippetState): string {
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `  let value = $state(${JSON.stringify(value)})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    // A custom label renders as a literal while its eye is on; unset, the
    // control reads the scope label, so the scope ref stands in.
    ...(ariaLabelOn && ariaLabel
      ? [`  <NumberInput bind:value={value} ariaLabel="${escapeAttr(ariaLabel)}"`]
      : ['  <NumberInput bind:value={value} ariaLabel={applyLabel}']),
    ...(minOn ? numberLine('min', min) : []),
    ...(maxOn ? numberLine('max', max) : []),
    // The step row prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(stepOn && step !== '' && step !== '1' ? numberLine('step', step) : []),
    ...(decrementLabelOn && decrementLabel ? [`  decrementLabel="${escapeAttr(decrementLabel)}"`] : []),
    ...(incrementLabelOn && incrementLabel ? [`  incrementLabel="${escapeAttr(incrementLabel)}"`] : []),
    ...(idOn && id ? [`  id="${escapeAttr(id)}"`] : []),
    ...(inputStyleOn && inputStyle ? [`  inputStyle="${escapeAttr(inputStyle)}"`] : []),
    ...(placeholderOn && placeholder ? [`  placeholder="${escapeAttr(placeholder)}"`] : []),
    ...(sizeOn && size !== undefined && size !== '' && size !== 'md' ? sizeAttributeLine(size, '  ') : []),
    ...(disabledOn ? flagLine('disabled', disabled, 'no') : []),
    ...(showControlsOn ? flagLine('showControls', showControls, 'yes') : []),
    ...(classNameOn && className ? [`  className="${escapeAttr(className)}"`] : []),
    ...(clearableOn ? flagLine('clearable', clearable, 'no') : []),
    ...(clearLabelOn && clearLabel ? [`  clearLabel="${escapeAttr(clearLabel)}"`] : []),
    ...(clearPlacementOn && clearPlacement !== '' && clearPlacement !== 'auto' ? textLine('clearPlacement', clearPlacement) : []),
    ...(defaultValueOn && defaultValue ? [`  defaultValue="${escapeAttr(defaultValue)}"`] : []),
    '  />',
    '  <span class="text-sm text-slate-400">value: {value}</span>',
    '</div>',
  ]
  return lines.join('\n')
}
