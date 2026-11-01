// Show-code source for the EditableText demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above. The committed
// value lives in a local `$state` so the live snippet keeps its own edits and
// still starts from the demo's displayed text.

import { boolAttrLine, sizeAttrLine, textAttrLine, type TriState } from '$showcase/playground/snippet-build'
import type { Staged } from '$showcase/playground/staged'

// Default value shared by the page and the snippet so the static demo and the
// Show-code source start from the same text.
export const DEFAULT_TEXT = 'Untitled project'
// The component's own defaults for the two look rows; Show-code omits them.
export const DEFAULT_CLASS_NAME = 'text-slate-200'
export const DEFAULT_MAX_WIDTH = '480'

export interface EditableTextSnippetState {
  value: Staged<string>
  size: Staged<string>
  copyable: Staged<TriState>
  className: Staged<string>
  maxWidth: Staged<string>
}

// The value is baked into a single-quoted JS string in the snippet's leading
// script, so backslashes, quotes, and line breaks must stay literal.
function escapeScriptString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
}

// A numeric line: omitted while the eye is off, unset, or non-numeric.
function numberLine(name: string, pair: Staged<string>): string[] {
  if (!pair.on || pair.value.trim() === '') {
    return []
  }
  const parsed = Number(pair.value)
  return Number.isFinite(parsed) ? [`    ${name}={${parsed}}`] : []
}

export function buildEditableTextSnippet({ value, size, copyable, className, maxWidth }: EditableTextSnippetState): string {
  return [
    '<script>',
    `  let value = $state('${escapeScriptString(value.value || DEFAULT_TEXT)}')`,
    '</script>',
    '<div class="group flex flex-wrap items-center gap-2">',
    '  <EditableText',
    '    text={value}',
    '    onChange={next => { value = next }}',
    // Size, className, and maxWidth rows prefill their component defaults in the
    // Value column; the builder omits the defaults so Show-code stays minimal.
    ...sizeAttrLine(size, '    '),
    ...boolAttrLine('copyable', copyable, 'no', '    '),
    ...(className.value !== DEFAULT_CLASS_NAME ? textAttrLine('className', className, '    ') : []),
    ...(maxWidth.value !== '' && maxWidth.value !== DEFAULT_MAX_WIDTH ? numberLine('maxWidth', maxWidth) : []),
    '  />',
    '  <span class="text-xs text-slate-500">{editHint}</span>',
    '</div>',
  ].join('\n')
}
