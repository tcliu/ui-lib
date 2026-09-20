// Show-code source for the Combobox demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
// Selection data and query filtering stay symbolic scope helpers (as with the
// DataTable demo); the curated placeholder is baked in as a literal.

export interface ComboboxSnippetState {
  placeholder: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildComboboxSnippet({ placeholder }: ComboboxSnippetState): string {
  return [
    '<Combobox',
    '  selected={selected}',
    '  suggestions={suggestions}',
    '  onQueryChange={filterSuggestions}',
    '  onAdd={addOption}',
    '  onRemove={removeOption}',
    ...(placeholder ? [`  placeholder="${escapeAttr(placeholder)}"`] : []),
    '/>',
    `<span class="text-sm text-slate-400">selected: {selected.map(option => option.label).join(', ') || '—'}</span>`,
  ].join('\n')
}
