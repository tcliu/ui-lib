// Show-code source for the CopyButton demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.

import { escapeText } from '$lib/showcase/snippet-build'
import { sizeAttributeLine } from '$lib/showcase/size-input'

// Default text shared by the page and the snippet so the static demo and the
// Show-code source start from the same value.
export const DEFAULT_TEXT = 'npm run check'

export interface CopyButtonSnippetState {
  text: string
  textOn: boolean
  ariaLabel: string
  ariaLabelOn: boolean
  tooltip: string
  tooltipOn: boolean
  size: string
  sizeOn: boolean
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildCopyButtonSnippet({
  text,
  textOn,
  ariaLabel,
  ariaLabelOn,
  tooltip,
  tooltipOn,
  size,
  sizeOn,
}: CopyButtonSnippetState): string {
  const resolved = textOn && text ? text : DEFAULT_TEXT
  return [
    '<div class="group flex flex-wrap items-center gap-3">',
    '  <div class="flex max-w-full items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">',
    `    <span class="min-w-0 truncate font-mono text-sm text-slate-300">${escapeText(resolved)}</span>`,
    '    <CopyButton',
    `      text="${escapeAttr(resolved)}"`,
    // The size Value prefills the component default; the builder omits it so
    // Show-code stays minimal.
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, '      ') : []),
    ...(ariaLabelOn && ariaLabel ? [`      ariaLabel="${escapeAttr(ariaLabel)}"`] : []),
    ...(tooltipOn && tooltip ? [`      tooltip="${escapeAttr(tooltip)}"`] : []),
    '    />',
    '  </div>',
    '  <span class="text-xs text-slate-500">{copyHint}</span>',
    '</div>',
  ].join('\n')
}
