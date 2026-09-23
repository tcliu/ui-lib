// Show-code source for the CopyButton demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.

export type TriState = '' | 'yes' | 'no'

// Default text shared by the page and the snippet so the static demo and the
// Show-code source start from the same value.
export const DEFAULT_TEXT = 'npm run check'

export interface CopyButtonSnippetState {
  text: string
  alwaysVisible: TriState
  copyAriaLabel: string
  copyTooltip: string
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: number): string[] {
  if (value === '') {
    return []
  }
  return [`${' '.repeat(indent)}${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildCopyButtonSnippet({
  text,
  alwaysVisible,
  copyAriaLabel,
  copyTooltip,
}: CopyButtonSnippetState): string {
  const resolved = text || DEFAULT_TEXT
  return [
    '<div class="group flex flex-wrap items-center gap-3">',
    '  <div class="flex max-w-full items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">',
    `    <span class="min-w-0 truncate font-mono text-sm text-slate-300">${escapeText(resolved)}</span>`,
    '    <CopyButton',
    `      text="${escapeAttr(resolved)}"`,
    ...flagLine('alwaysVisible', alwaysVisible, 6),
    ...(copyAriaLabel ? [`      copyAriaLabel="${escapeAttr(copyAriaLabel)}"`] : []),
    ...(copyTooltip ? [`      copyTooltip="${escapeAttr(copyTooltip)}"`] : []),
    '    />',
    '  </div>',
    '  <span class="text-xs text-slate-500">{copyHint}</span>',
    '</div>',
  ].join('\n')
}
