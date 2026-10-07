// Show-code source for the TagInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
// The alternate palette stays a symbolic scope helper (`altPalette`).

export type TriState = '' | 'yes' | 'no'

export interface TagInputSnippetState {
  placeholder: string
  palette: string
  disabled: TriState
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildTagInputSnippet({ placeholder, palette, disabled }: TagInputSnippetState): string {
  const lines = [
    '<TagInput',
    '  value={value}',
    '  availableTags={availableTags}',
    `  placeholder="${escapeAttr(placeholder || 'Add a tag')}"`,
    ...(palette ? ['  palette={altPalette}'] : []),
    ...flagLine('disabled', disabled),
    '  onChange={next => (value = next)} />',
    `<span class="text-sm text-slate-400">tags: {value.join(', ')}</span>`,
  ]
  return lines.join('\n')
}
