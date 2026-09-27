// Show-code source for the EditableText demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above. The committed
// value lives in a local `$state` so the live snippet keeps its own edits and
// still starts from the demo's displayed text.

export type TriState = '' | 'yes' | 'no'

// Default value shared by the page and the snippet so the static demo and the
// Show-code source start from the same text.
export const DEFAULT_TEXT = 'Untitled project'

export interface EditableTextSnippetState {
  value: string
  size: string
  copyable: TriState
  className: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// The value is baked into a single-quoted JS string in the snippet's leading
// script, so backslashes, quotes, and line breaks must stay literal.
function escapeScriptString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`    ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildEditableTextSnippet({ value, size, copyable, className }: EditableTextSnippetState): string {
  return [
    '<script>',
    `  let value = $state('${escapeScriptString(value || DEFAULT_TEXT)}')`,
    '</script>',
    '<div class="group flex flex-wrap items-center gap-2">',
    '  <EditableText',
    '    text={value}',
    '    onChange={next => { value = next }}',
    ...(size ? [`    size="${size}"`] : []),
    ...flagLine('copyable', copyable),
    ...(className ? [`    className="${escapeAttr(className)}"`] : []),
    '  />',
    '  <span class="text-xs text-slate-500">{editHint}</span>',
    '</div>',
  ].join('\n')
}
