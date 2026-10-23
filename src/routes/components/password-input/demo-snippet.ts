// Show-code source for the PasswordInput demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
import { escapeAttr } from '$lib/showcase/snippet-build'
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export interface PasswordInputSnippetState {
  // Bound value, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  value: string
  placeholder: string
  placeholderOn: boolean
  showLabel: string
  showLabelOn: boolean
  hideLabel: string
  hideLabelOn: boolean
  size?: string
  sizeOn: boolean
  disabled: TriState
  disabledOn: boolean
  hideOutline: TriState
  hideOutlineOn: boolean
  required: TriState
  requiredOn: boolean
  clearable: TriState
  clearableOn: boolean
  clearLabel: string
  clearLabelOn: boolean
  clearPlacement: string
  clearPlacementOn: boolean
  defaultValue: string
  defaultValueOn: boolean
  className: string
  classNameOn: boolean
  autocomplete: string
  autocompleteOn: boolean
  id: string
  idOn: boolean
  name: string
  nameOn: boolean
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildPasswordInputSnippet({
  value,
  placeholder,
  placeholderOn,
  showLabel,
  showLabelOn,
  hideLabel,
  hideLabelOn,
  size = '',
  sizeOn,
  disabled,
  disabledOn,
  hideOutline,
  hideOutlineOn,
  required,
  requiredOn,
  clearable,
  clearableOn,
  clearLabel,
  clearLabelOn,
  clearPlacement,
  clearPlacementOn,
  defaultValue,
  defaultValueOn,
  className,
  classNameOn,
  autocomplete,
  autocompleteOn,
  id,
  idOn,
  name,
  nameOn,
}: PasswordInputSnippetState): string {
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `  let value = $state(${JSON.stringify(value)})`,
    '</script>',
    '<PasswordInput',
    '  bind:value={value}',
    `  placeholder="${escapeAttr(placeholderOn && placeholder ? placeholder : 'Password')}"`,
    ...(autocompleteOn && autocomplete ? [`  autocomplete="${escapeAttr(autocomplete)}"`] : []),
    ...(idOn && id ? [`  id="${escapeAttr(id)}"`] : []),
    ...(nameOn && name ? [`  name="${escapeAttr(name)}"`] : []),
    ...(showLabelOn && showLabel ? [`  showLabel="${escapeAttr(showLabel)}"`] : []),
    ...(hideLabelOn && hideLabel ? [`  hideLabel="${escapeAttr(hideLabel)}"`] : []),
    ...(sizeOn && size !== undefined && size !== '' && size !== 'md' ? sizeAttributeLine(size) : []),
    ...(disabledOn ? flagLine('disabled', disabled, 'no') : []),
    ...(hideOutlineOn ? flagLine('hideOutline', hideOutline, 'no') : []),
    ...(requiredOn ? flagLine('required', required, 'no') : []),
    ...(classNameOn && className ? [`  className="${escapeAttr(className)}"`] : []),
    ...(clearableOn ? flagLine('clearable', clearable, 'no') : []),
    ...(clearLabelOn && clearLabel ? [`  clearLabel="${escapeAttr(clearLabel)}"`] : []),
    ...(clearPlacementOn && clearPlacement !== '' && clearPlacement !== 'auto' ? [`  clearPlacement="${escapeAttr(clearPlacement)}"`] : []),
    ...(defaultValueOn && defaultValue ? [`  defaultValue="${escapeAttr(defaultValue)}"`] : []),
    '/>',
    '<span class="text-sm text-slate-400">length: {value.length}</span>',
  ]
  return lines.join('\n')
}
