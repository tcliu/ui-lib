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
import { DATE_STAGE_CONTENT } from '$showcase/date-stage'
import { boolAttrLine, escapeAttr, type TriState } from '$showcase/snippet-build'
import { sizeAttributeFragment } from '$showcase/size-input'
import type { Staged } from '$showcase/staged'

export interface DateInputSnippetState {
  value: Staged<string>
  from: Staged<string>
  to: Staged<string>
  range: Staged<TriState>
  time: Staged<TriState>
  format: Staged<string>
  placeholder: Staged<string>
  closeOnSelect: Staged<TriState>
  highlightRange: Staged<TriState>
  size: Staged<string>
}

export function buildDateInputSnippet({
  value,
  from,
  to,
  range,
  time,
  format,
  placeholder,
  closeOnSelect,
  highlightRange,
  size,
}: DateInputSnippetState): string {
  const indent = '  '
  const isRange = range.on && range.value === 'yes'
  const formatAttr = format.on && format.value && format.value !== DEFAULT_DATE_FORMAT ? ` format="${escapeAttr(format.value)}"` : ''
  const sizeAttr = size.on && size.value && size.value !== 'md' ? sizeAttributeFragment(size.value) : ''
  const placeholderAttr = placeholder.on && placeholder.value ? ` placeholder="${escapeAttr(placeholder.value)}"` : ''
  const flags = [
    ...(isRange ? ['range'] : boolAttrLine('range', range, '', '')),
    ...boolAttrLine('time', time, '', ''),
    ...boolAttrLine('closeOnSelect', closeOnSelect, '', ''),
    ...boolAttrLine('highlightRange', highlightRange, '', ''),
  ].map(line => `${indent}${line}`)
  const body = isRange
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
    `${indent}let value = $state(${JSON.stringify(value.value)})`,
    `${indent}let from = $state(${JSON.stringify(from.value)})`,
    `${indent}let to = $state(${JSON.stringify(to.value)})`,
    '</script>',
    `<div class="${DATE_STAGE_CONTENT}">`,
    ...body,
    '</div>',
  ].join('\n')
}
