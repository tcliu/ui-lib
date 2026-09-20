// Show-code source for the DateRangePicker demo section. Pure string building
// over the playground form state: the section regenerates the editor text
// from this, so the editor always shows the markup behind the demo above.

export interface DateRangePickerSnippetState {
  from: string
  to: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildDateRangePickerSnippet({ from, to }: DateRangePickerSnippetState): string {
  return [
    '<DateRangePicker',
    `  from={${from ? `"${escapeAttr(from)}"` : 'from'}}`,
    `  to={${to ? `"${escapeAttr(to)}"` : 'to'}}`,
    '  onFrom={value => (from = value)}',
    '  onTo={value => (to = value)}',
    '/>',
    `<span class="text-sm text-slate-400">range: {from || '—'} – {to || '—'}</span>`,
  ].join('\n')
}
