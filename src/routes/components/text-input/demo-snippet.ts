// Show-code source for the TextInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export interface TextInputSnippetState {
  ariaLabel: string
  // Bound value, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  value: string
  placeholder: string
  size: string
  disabled: TriState
  readonly: TriState
  inputClass: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: string): string[] {
  if (value === '') {
    return []
  }
  return [`${indent}${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildTextInputSnippet({
  ariaLabel,
  value,
  placeholder,
  size,
  disabled,
  readonly,
  inputClass,
}: TextInputSnippetState): string {
  const attributeIndent = '    '
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `  let value = $state(${JSON.stringify(value)})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    // A custom label renders as a literal; unset, the control reads the scope
    // label, so the scope ref stands in.
    ...(ariaLabel
      ? [`  <TextInput bind:value={value} ariaLabel="${escapeAttr(ariaLabel)}"`]
      : ['  <TextInput bind:value={value} ariaLabel={applyLabel}']),
    ...(placeholder ? [`${attributeIndent}placeholder="${escapeAttr(placeholder)}"`] : []),
    ...sizeAttributeLine(size, attributeIndent),
    ...flagLine('disabled', disabled, attributeIndent),
    ...flagLine('readonly', readonly, attributeIndent),
    ...(inputClass ? [`${attributeIndent}inputClass="${escapeAttr(inputClass)}"`] : []),
    '  />',
    `  <span class="text-sm text-slate-400">value: {value || '—'}</span>`,
    '</div>',
  ]
  return lines.join('\n')
}
