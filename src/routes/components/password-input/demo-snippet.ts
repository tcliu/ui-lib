// Show-code source for the PasswordInput demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

export type TriState = '' | 'yes' | 'no'

export interface PasswordInputSnippetState {
  placeholder: string
  showLabel: string
  hideLabel: string
  disabled: TriState
  required: TriState
  className: string
}

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

export function buildPasswordInputSnippet({
  placeholder,
  showLabel,
  hideLabel,
  disabled,
  required,
  className,
}: PasswordInputSnippetState): string {
  const lines = [
    '<PasswordInput',
    '  bind:value={value}',
    `  placeholder="${escapeAttr(placeholder || 'Password')}"`,
    ...(showLabel ? [`  showLabel="${escapeAttr(showLabel)}"`] : []),
    ...(hideLabel ? [`  hideLabel="${escapeAttr(hideLabel)}"`] : []),
    ...flagLine('disabled', disabled),
    ...flagLine('required', required),
    ...(className ? [`  className="${escapeAttr(className)}"`] : []),
    '/>',
    '<span class="text-sm text-slate-400">length: {value.length}</span>',
  ]
  return lines.join('\n')
}
