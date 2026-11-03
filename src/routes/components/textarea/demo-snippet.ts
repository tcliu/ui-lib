// Show-code source for the TextArea demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.
import { boolAttrLine, escapeAttr, sizeAttrLine, textAttrLine, type TriState } from '#showcase/playground/snippet-build.js'
import { ratiosAttrLine } from '#showcase/playground/text-input-ratios.js'
import type { Staged } from '#showcase/playground/staged.js'
import type { FieldRatioOverrides } from '#lib/components/input-chrome.js'

export interface TextAreaSnippetState {
  ariaLabel: Staged<string>
  // Bound value, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  value: Staged<string>
  placeholder: Staged<string>
  rows: Staged<string>
  size: Staged<string>
  ratios: Staged<FieldRatioOverrides>
  disabled: Staged<TriState>
  hideOutline: Staged<TriState>
  readonly: Staged<TriState>
  id: Staged<string>
  inputClass: Staged<string>
}

// A rows line: omitted while the eye is off, unset, or non-numeric (the demo
// falls back to the component default).
function rowsLine(pair: Staged<string>, indent: string): string[] {
  if (!pair.on || pair.value.trim() === '') {
    return []
  }
  const parsed = Number(pair.value)
  return Number.isInteger(parsed) && parsed > 0 ? [`${indent}rows={${parsed}}`] : []
}

export function buildTextAreaSnippet(state: TextAreaSnippetState): string {
  const { ariaLabel, value, placeholder, rows, size, ratios, disabled, hideOutline, readonly, id, inputClass } = state
  const attributeIndent = '    '
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds;
    // escaping `<` stops a value from closing the surrounding script block.
    // `\u003c` is valid JSON, so the literal parses back to the original text.
    `  let value = $state(${JSON.stringify(value.value).replace(/</g, '\\u003c')})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    // A custom label renders as a literal while its eye is on; otherwise the
    // control reads the scope label, so the scope ref stands in.
    ...(ariaLabel.on && ariaLabel.value
      ? [`  <TextArea bind:value={value} ariaLabel="${escapeAttr(ariaLabel.value)}"`]
      : ['  <TextArea bind:value={value} ariaLabel={applyLabel}']),
    ...textAttrLine('placeholder', placeholder, attributeIndent),
    // The rows row prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(rows.on && rows.value !== '3' ? rowsLine(rows, attributeIndent) : []),
    ...sizeAttrLine(size, attributeIndent),
    ...ratiosAttrLine(ratios, attributeIndent),
    ...boolAttrLine('disabled', disabled, 'no', attributeIndent),
    ...boolAttrLine('hideOutline', hideOutline, 'no', attributeIndent),
    ...boolAttrLine('readonly', readonly, 'no', attributeIndent),
    ...textAttrLine('id', id, attributeIndent),
    ...textAttrLine('inputClass', inputClass, attributeIndent),
    '  />',
    `  <span class="text-sm text-slate-400">value: {value || '—'}</span>`,
    '</div>',
  ]
  return lines.join('\n')
}
