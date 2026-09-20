// Show-code source for the SearchInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

export interface SearchInputSnippetState {
  placeholder: string
  size: string
  wrapperClass: string
  inputClass: string
}

export const STYLED_WRAPPER = 'rounded-lg border border-cyan-500/40 p-2'
export const STYLED_INPUT =
  'w-56 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 pl-7 text-sm text-cyan-200 outline-none focus-visible:border-cyan-500'

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildSearchInputSnippet({
  placeholder,
  size,
  wrapperClass,
  inputClass,
}: SearchInputSnippetState): string {
  const lines = [
    '<div class="flex flex-col gap-1">',
    '  <SearchInput bind:value={query} ariaLabel={applyLabel} onkeydown={handleKeydown}',
    ...(placeholder ? [`    placeholder="${escapeAttr(placeholder)}"`] : []),
    ...(size ? [`    size="${size}"`] : []),
    ...(wrapperClass ? [`    wrapperClass="${escapeAttr(wrapperClass)}"`] : []),
    ...(inputClass ? [`    inputClass="${escapeAttr(inputClass)}"`] : []),
    '  />',
    `  <span class="text-sm text-slate-400">value: {query || '—'}</span>`,
    '</div>',
  ]
  return lines.join('\n')
}
