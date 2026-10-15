// Show-code source for the TextArea demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.
import { escapeAttr } from '$lib/showcase/snippet-build'
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export interface TextAreaSnippetState {
  ariaLabel: string
  ariaLabelOn: boolean
  // Bound value, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  value: string
  placeholder: string
  placeholderOn: boolean
  rows: string
  rowsOn: boolean
  size: string
  sizeOn: boolean
  disabled: TriState
  disabledOn: boolean
  readonly: TriState
  readonlyOn: boolean
  id: string
  idOn: boolean
  inputClass: string
  inputClassOn: boolean
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: string, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`${indent}${name}${value === 'yes' ? '' : '={false}'}`]
}

// A rows line: omitted while unset or non-numeric (the demo falls back to the
// component default).
function rowsLine(value: string, indent: string): string[] {
  if (value.trim() === '') {
    return []
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? [`${indent}rows={${parsed}}`] : []
}

export function buildTextAreaSnippet({
  ariaLabel,
  ariaLabelOn,
  value,
  placeholder,
  placeholderOn,
  rows,
  rowsOn,
  size,
  sizeOn,
  disabled,
  disabledOn,
  readonly,
  readonlyOn,
  id,
  idOn,
  inputClass,
  inputClassOn,
}: TextAreaSnippetState): string {
  const attributeIndent = '    '
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds;
    // escaping `<` stops a value from closing the surrounding script block.
    // `\u003c` is valid JSON, so the literal parses back to the original text.
    `  let value = $state(${JSON.stringify(value).replace(/</g, '\\u003c')})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    // A custom label renders as a literal while its eye is on; otherwise the
    // control reads the scope label, so the scope ref stands in.
    ...(ariaLabelOn && ariaLabel
      ? [`  <TextArea bind:value={value} ariaLabel="${escapeAttr(ariaLabel)}"`]
      : ['  <TextArea bind:value={value} ariaLabel={applyLabel}']),
    ...(placeholderOn && placeholder ? [`${attributeIndent}placeholder="${escapeAttr(placeholder)}"`] : []),
    // The rows row prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(rowsOn && rows !== '' && rows !== '3' ? rowsLine(rows, attributeIndent) : []),
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, attributeIndent) : []),
    ...(disabledOn ? flagLine('disabled', disabled, attributeIndent, 'no') : []),
    ...(readonlyOn ? flagLine('readonly', readonly, attributeIndent, 'no') : []),
    ...(idOn && id ? [`${attributeIndent}id="${escapeAttr(id)}"`] : []),
    ...(inputClassOn && inputClass ? [`${attributeIndent}inputClass="${escapeAttr(inputClass)}"`] : []),
    '  />',
    `  <span class="text-sm text-slate-400">value: {value || '—'}</span>`,
    '</div>',
  ]
  return lines.join('\n')
}
