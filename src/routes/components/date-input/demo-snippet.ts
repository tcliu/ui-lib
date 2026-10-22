// Show-code source for the DateInput demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The single value and
// the two range ends are seeded as script-local state, so the snippet is
// self-contained and its text tracks the Value edits instead of hiding them in
// scope. `range` picks which form the snippet renders; the declarations stay in
// the script either way, so editing any Value cell round-trips through it.
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.

import { DEFAULT_DATE_FORMAT } from '$lib/components/date-input-core'
import { DATE_STAGE_CONTENT } from '$lib/showcase/date-stage'
import { escapeAttr, type TriState } from '$lib/showcase/snippet-build'
import { sizeAttributeFragment } from '$lib/showcase/size-input'

export interface DateInputSnippetState {
  value: string
  from: string
  to: string
  range: TriState
  time: TriState
  format: string
  formatOn: boolean
  placeholder: string
  placeholderOn: boolean
  closeOnSelect: TriState
  highlightRange: TriState
  size: string
  sizeOn: boolean
}

// A tri-state flag on its own line: bare while Yes, `={false}` while No, and
// omitted while unset, so only a real override shows up.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildDateInputSnippet({
  value,
  from,
  to,
  range,
  time,
  format,
  formatOn,
  placeholder,
  placeholderOn,
  closeOnSelect,
  highlightRange,
  size,
  sizeOn,
}: DateInputSnippetState): string {
  const indent = '  '
  const formatAttr = formatOn && format && format !== DEFAULT_DATE_FORMAT ? ` format="${escapeAttr(format)}"` : ''
  const sizeAttr = sizeOn && size && size !== 'md' ? sizeAttributeFragment(size) : ''
  const placeholderAttr = placeholderOn && placeholder ? ` placeholder="${escapeAttr(placeholder)}"` : ''
  const flags = [
    ...(range === 'yes' ? ['range'] : flagLine('range', range)),
    ...flagLine('time', time),
    ...flagLine('closeOnSelect', closeOnSelect),
    ...flagLine('highlightRange', highlightRange),
  ].map(line => `${indent}${line}`)
  const body =
    range === 'yes'
      ? [
          '<DateInput',
          ...flags,
          `${indent}from={from}`,
          `${indent}to={to}`,
          `${indent}onFrom={next => (from = next)}`,
          `${indent}onTo={next => (to = next)}${formatAttr}${sizeAttr} />`,
          `<span class="text-sm text-slate-400">range: {from || '—'} – {to || '—'}</span>`,
        ]
      : [
          '<DateInput',
          ...flags,
          `${indent}value={value}`,
          `${indent}onChange={next => (value = next)}${formatAttr}${sizeAttr}${placeholderAttr} />`,
          `<span class="text-sm text-slate-400">value: {value || '—'}</span>`,
        ]
  return [
    '<script>',
    `${indent}let value = $state(${JSON.stringify(value)})`,
    `${indent}let from = $state(${JSON.stringify(from)})`,
    `${indent}let to = $state(${JSON.stringify(to)})`,
    '</script>',
    `<div class="${DATE_STAGE_CONTENT}">`,
    ...body,
    '</div>',
  ].join('\n')
}
