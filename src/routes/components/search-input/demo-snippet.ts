// Show-code source for the SearchInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
import { sizeAttributeLine } from '$lib/showcase/size-input'

export interface SearchInputSnippetState {
  ariaLabel: string
  // Bound query, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  query: string
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
  ariaLabel,
  query,
  placeholder,
  size,
  wrapperClass,
  inputClass,
}: SearchInputSnippetState): string {
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the query holds.
    `  let query = $state(${JSON.stringify(query)})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    // A custom label renders as a literal; unset, the control reads the scope
    // label, so the scope ref stands in.
    ...(ariaLabel
      ? [`  <SearchInput bind:value={query} ariaLabel="${escapeAttr(ariaLabel)}" onkeydown={handleKeydown}`]
      : ['  <SearchInput bind:value={query} ariaLabel={applyLabel} onkeydown={handleKeydown}']),
    ...(placeholder ? [`    placeholder="${escapeAttr(placeholder)}"`] : []),
    ...sizeAttributeLine(size, '    '),
    ...(wrapperClass ? [`    wrapperClass="${escapeAttr(wrapperClass)}"`] : []),
    ...(inputClass ? [`    inputClass="${escapeAttr(inputClass)}"`] : []),
    '  />',
    `  <span class="text-sm text-slate-400">value: {query || '—'}</span>`,
    '</div>',
  ]
  return lines.join('\n')
}
