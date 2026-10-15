// Show-code source for the DateRangePicker demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above. The range
// is seeded as script-local state so the snippet is self-contained and its text
// tracks the Value edits instead of hiding the range in scope.
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.

export const DATE_STAGE_CONTENT = 'flex flex-col gap-1'
export const DATE_STAGE_DEFAULT_WIDTH = 560
export const DATE_STAGE_MIN_WIDTH = 240

export interface DateRangePickerSnippetState {
  from: string
  to: string
}

export function buildDateRangePickerSnippet({ from, to }: DateRangePickerSnippetState): string {
  // The frame is shell chrome, so only the demo content remains: the content
  // column wraps the picker and its trailing range line, with the two range
  // ends seeded as script-local state. JSON.stringify keeps the literals valid
  // no matter what the range holds.
  const indent = '  '
  return [
    '<script>',
    `${indent}let from = $state(${JSON.stringify(from)})`,
    `${indent}let to = $state(${JSON.stringify(to)})`,
    '</script>',
    `<div class="${DATE_STAGE_CONTENT}">`,
    '<DateRangePicker',
    `${indent}from={from}`,
    `${indent}to={to}`,
    `${indent}onFrom={value => (from = value)}`,
    `${indent}onTo={value => (to = value)} />`,
    `<span class="text-sm text-slate-400">range: {from || '—'} – {to || '—'}</span>`,
    '</div>',
  ].join('\n')
}
