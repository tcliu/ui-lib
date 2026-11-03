// Show-code source for the PasswordInput demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
import { boolAttrLine, enumAttrLine, escapeAttr, sizeAttrLine, textAttrLine, type TriState } from '#showcase/playground/snippet-build.js'
import { ratiosAttrLine } from '#showcase/playground/text-input-ratios.js'
import type { Staged } from '#showcase/playground/staged.js'
import type { PasswordInputRatioOverrides } from '#lib/components/PasswordInput.svelte'

export interface PasswordInputSnippetState {
  // Bound value, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  value: Staged<string>
  placeholder: Staged<string>
  showLabel: Staged<string>
  hideLabel: Staged<string>
  size?: Staged<string>
  ratios: Staged<PasswordInputRatioOverrides>
  disabled: Staged<TriState>
  hideOutline: Staged<TriState>
  required: Staged<TriState>
  clearable: Staged<TriState>
  clearLabel: Staged<string>
  clearPlacement: Staged<string>
  defaultValue: Staged<string>
  className: Staged<string>
  autocomplete: Staged<string>
  id: Staged<string>
  name: Staged<string>
}

export function buildPasswordInputSnippet(state: PasswordInputSnippetState): string {
  const {
    value,
    placeholder,
    showLabel,
    hideLabel,
    size,
    ratios,
    disabled,
    hideOutline,
    required,
    clearable,
    clearLabel,
    clearPlacement,
    defaultValue,
    className,
    autocomplete,
    id,
    name,
  } = state
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `  let value = $state(${JSON.stringify(value.value)})`,
    '</script>',
    '<PasswordInput',
    '  bind:value={value}',
    // An unset placeholder falls back to the component default, so the fallback
    // text stands in rather than dropping the attribute.
    `  placeholder="${escapeAttr(placeholder.on && placeholder.value ? placeholder.value : 'Password')}"`,
    ...textAttrLine('autocomplete', autocomplete),
    ...textAttrLine('id', id),
    ...textAttrLine('name', name),
    ...textAttrLine('showLabel', showLabel),
    ...textAttrLine('hideLabel', hideLabel),
    ...(size ? sizeAttrLine(size) : []),
    ...ratiosAttrLine(ratios),
    ...boolAttrLine('disabled', disabled, 'no'),
    ...boolAttrLine('hideOutline', hideOutline, 'no'),
    ...boolAttrLine('required', required, 'no'),
    ...textAttrLine('className', className),
    ...boolAttrLine('clearable', clearable, 'no'),
    ...textAttrLine('clearLabel', clearLabel),
    ...enumAttrLine('clearPlacement', clearPlacement, 'auto'),
    ...textAttrLine('defaultValue', defaultValue),
    '/>',
    '<span class="text-sm text-slate-400">length: {value.length}</span>',
  ]
  return lines.join('\n')
}
