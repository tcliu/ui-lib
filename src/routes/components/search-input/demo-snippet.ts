// Show-code source for the SearchInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
import { escapeAttr } from '$lib/showcase/snippet-build'
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export interface SearchInputSnippetState {
  ariaLabel: string
  ariaLabelOn: boolean
  // Bound query, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  query: string
  placeholder: string
  placeholderOn: boolean
  size: string
  sizeOn: boolean
  wrapperClass: string
  wrapperClassOn: boolean
  inputClass: string
  inputClassOn: boolean
  clearable: TriState
  clearableOn: boolean
  clearLabel: string
  clearLabelOn: boolean
  clearPlacement: string
  clearPlacementOn: boolean
  defaultValue: string
  defaultValueOn: boolean
  hideOutline: TriState
  hideOutlineOn: boolean
}

export const STYLED_WRAPPER = 'rounded-lg border border-cyan-500/40 p-2'
export const STYLED_INPUT =
  'w-56 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 pl-7 text-sm text-cyan-200 outline-none focus-visible:border-cyan-500'

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`    ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildSearchInputSnippet({
  ariaLabel,
  ariaLabelOn,
  query,
  placeholder,
  placeholderOn,
  size,
  sizeOn,
  wrapperClass,
  wrapperClassOn,
  inputClass,
  inputClassOn,
  clearable,
  clearableOn,
  clearLabel,
  clearLabelOn,
  clearPlacement,
  clearPlacementOn,
  defaultValue,
  defaultValueOn,
  hideOutline,
  hideOutlineOn,
}: SearchInputSnippetState): string {
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the query holds.
    `  let query = $state(${JSON.stringify(query)})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    // A custom label renders as a literal while its eye is on; otherwise the
    // control reads the scope label, so the scope ref stands in.
    ...(ariaLabelOn && ariaLabel
      ? [`  <SearchInput bind:value={query} ariaLabel="${escapeAttr(ariaLabel)}" onkeydown={handleKeydown}`]
      : ['  <SearchInput bind:value={query} ariaLabel={applyLabel} onkeydown={handleKeydown}']),
    ...(placeholderOn && placeholder ? [`    placeholder="${escapeAttr(placeholder)}"`] : []),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, '    ') : []),
    ...(wrapperClassOn && wrapperClass ? [`    wrapperClass="${escapeAttr(wrapperClass)}"`] : []),
    ...(inputClassOn && inputClass ? [`    inputClass="${escapeAttr(inputClass)}"`] : []),
    ...(clearableOn ? flagLine('clearable', clearable, 'no') : []),
    ...(clearLabelOn && clearLabel ? [`    clearLabel="${escapeAttr(clearLabel)}"`] : []),
    ...(clearPlacementOn && clearPlacement !== '' && clearPlacement !== 'auto' ? [`    clearPlacement="${escapeAttr(clearPlacement)}"`] : []),
    ...(defaultValueOn && defaultValue ? [`    defaultValue="${escapeAttr(defaultValue)}"`] : []),
    ...(hideOutlineOn ? flagLine('hideOutline', hideOutline, 'no') : []),
    '  />',
    `  <span class="text-sm text-slate-400">value: {query || '—'}</span>`,
    '</div>',
  ]
  return lines.join('\n')
}
