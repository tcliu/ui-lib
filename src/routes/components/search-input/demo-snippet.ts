// Show-code source for the SearchInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.
import {
  boolAttrLine,
  enumAttrLine,
  escapeAttr,
  sizeAttrLine,
  textAttrLine,
  type TriState,
} from '$showcase/playground/snippet-build'
import type { Staged } from '$showcase/playground/staged'

export interface SearchInputSnippetState {
  ariaLabel: Staged<string>
  // Bound query, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  query: Staged<string>
  placeholder: Staged<string>
  size: Staged<string>
  wrapperClass: Staged<string>
  inputClass: Staged<string>
  clearable: Staged<TriState>
  clearLabel: Staged<string>
  clearPlacement: Staged<string>
  defaultValue: Staged<string>
  hideOutline: Staged<TriState>
}

export const STYLED_WRAPPER = 'rounded-lg border border-cyan-500/40 p-2'
export const STYLED_INPUT =
  'w-56 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 pl-7 text-sm text-cyan-200 outline-none focus-visible:border-cyan-500'

export function buildSearchInputSnippet(state: SearchInputSnippetState): string {
  const { ariaLabel, query, placeholder, size, wrapperClass, inputClass, clearable, clearLabel, clearPlacement, defaultValue, hideOutline } = state
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the query holds.
    `  let query = $state(${JSON.stringify(query.value)})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    // A custom label renders as a literal while its eye is on; otherwise the
    // control reads the scope label, so the scope ref stands in.
    ...(ariaLabel.on && ariaLabel.value
      ? [`  <SearchInput bind:value={query} ariaLabel="${escapeAttr(ariaLabel.value)}" onkeydown={handleKeydown}`]
      : ['  <SearchInput bind:value={query} ariaLabel={applyLabel} onkeydown={handleKeydown}']),
    ...textAttrLine('placeholder', placeholder, '    '),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...sizeAttrLine(size, '    '),
    ...textAttrLine('wrapperClass', wrapperClass, '    '),
    ...textAttrLine('inputClass', inputClass, '    '),
    ...boolAttrLine('clearable', clearable, 'no', '    '),
    ...textAttrLine('clearLabel', clearLabel, '    '),
    ...enumAttrLine('clearPlacement', clearPlacement, 'auto', '    '),
    ...textAttrLine('defaultValue', defaultValue, '    '),
    ...boolAttrLine('hideOutline', hideOutline, 'no', '    '),
    '  />',
    `  <span class="text-sm text-slate-400">value: {query || '—'}</span>`,
    '</div>',
  ]
  return lines.join('\n')
}
