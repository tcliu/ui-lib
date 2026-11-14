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

import { DEFAULT_DATE_FORMAT } from '#lib/components/date-input-core.js'
import { DATE_STAGE_CONTENT } from '#showcase/shell/date-stage.js'
import { boolAttrLine, enumAttrLine, escapeAttr, type TriState } from '#showcase/playground/snippet-build.js'
import { sizeAttributeFragment } from '#showcase/playground/size-input.js'
import type { Staged } from '#showcase/playground/staged.js'
import { ratiosAttributeFragment } from '#showcase/playground/text-input-ratios.js'
import type { PickerRatioOverrides } from '#lib/components/date-input-metrics.js'

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
  variant: Staged<string>
  hideOutline: Staged<TriState>
  size: Staged<string>
  ratios: Staged<PickerRatioOverrides>
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
  variant,
  hideOutline,
  size,
  ratios,
}: DateInputSnippetState): string {
  const indent = '  '
  const isRange = range.on && range.value === 'yes'
  const formatAttr = format.on && format.value && format.value !== DEFAULT_DATE_FORMAT ? ` format="${escapeAttr(format.value)}"` : ''
  const sizeAttr = size.on && size.value && size.value !== 'md' ? sizeAttributeFragment(size.value) : ''
  const placeholderAttr = placeholder.on && placeholder.value ? ` placeholder="${escapeAttr(placeholder.value)}"` : ''
  const ratiosAttr = ratiosAttributeFragment(ratios)
  const flags = [
    ...(isRange ? ['range'] : boolAttrLine('range', range, '', '')),
    ...boolAttrLine('time', time, '', ''),
    ...boolAttrLine('closeOnSelect', closeOnSelect, '', ''),
    ...boolAttrLine('hideOutline', hideOutline, 'no', ''),
    ...boolAttrLine('highlightRange', highlightRange, '', ''),
    ...enumAttrLine('variant', variant, 'bordered', ''),
  ].map(line => `${indent}${line}`)
  const body = isRange
    ? [
        '<DateInput',
        ...flags,
        `${indent}from={from}`,
        `${indent}to={to}`,
        `${indent}onFrom={next => (from = next)}`,
        `${indent}onTo={next => (to = next)}${formatAttr}${sizeAttr}${ratiosAttr} />`,
        `<span class="text-sm text-slate-400">range: {from || '—'} – {to || '—'}</span>`,
      ]
    : [
        '<DateInput',
        ...flags,
        `${indent}value={value}`,
        `${indent}onChange={next => (value = next)}${formatAttr}${sizeAttr}${placeholderAttr}${ratiosAttr} />`,
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
