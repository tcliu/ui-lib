// Show-code source for the EditableText demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above. The committed
// value lives in a local `$state` so the live snippet keeps its own edits and
// still starts from the demo's displayed text.

import { sizeAttributeLine } from '$lib/showcase/size-input'
export type TriState = '' | 'yes' | 'no'

// Default value shared by the page and the snippet so the static demo and the
// Show-code source start from the same text.
export const DEFAULT_TEXT = 'Untitled project'

export interface EditableTextSnippetState {
  value: string
  size: string
  sizeOn: boolean
  copyable: TriState
  copyableOn: boolean
  className: string
  classNameOn: boolean
  maxWidth: string
  maxWidthOn: boolean
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// The value is baked into a single-quoted JS string in the snippet's leading
// script, so backslashes, quotes, and line breaks must stay literal.
function escapeScriptString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`    ${name}${value === 'yes' ? '' : '={false}'}`]
}

// A numeric line: omitted while unset or non-numeric.
function numberLine(name: string, value: string): string[] {
  if (value.trim() === '') {
    return []
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? [`    ${name}={${parsed}}`] : []
}

export function buildEditableTextSnippet({ value, size, sizeOn, copyable, copyableOn, className, classNameOn, maxWidth, maxWidthOn }: EditableTextSnippetState): string {
  return [
    '<script>',
    `  let value = $state('${escapeScriptString(value || DEFAULT_TEXT)}')`,
    '</script>',
    '<div class="group flex flex-wrap items-center gap-2">',
    '  <EditableText',
    '    text={value}',
    '    onChange={next => { value = next }}',
    // Size and maxWidth rows prefill their component defaults in the Value
    // column; the builder omits the defaults so Show-code stays minimal.
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, '    ') : []),
    ...(copyableOn ? flagLine('copyable', copyable, 'no') : []),
    ...(classNameOn && className ? [`    className="${escapeAttr(className)}"`] : []),
    ...(maxWidthOn && maxWidth !== '' && maxWidth !== '480' ? numberLine('maxWidth', maxWidth) : []),
    '  />',
    '  <span class="text-xs text-slate-500">{editHint}</span>',
    '</div>',
  ].join('\n')
}
