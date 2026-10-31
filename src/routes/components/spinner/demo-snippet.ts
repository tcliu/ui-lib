// Show-code source for the Spinner demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import { sizeAttrLine, textAttrLine } from '$showcase/snippet-build'
import type { Staged } from '$showcase/staged'

export interface SpinnerSnippetState {
  size: Staged<string>
  tint: Staged<string>
}

export function buildSpinnerSnippet({ size, tint }: SpinnerSnippetState): string {
  // The attributes share the tag's one line, so each helper's single-space
  // indent doubles as the inline separator.
  const attrs = [...sizeAttrLine(size, ' '), ...textAttrLine('className', tint, ' ')].join('')
  return [
    '<span class="inline-flex items-center gap-2 text-sm text-slate-300">',
    `  <Spinner${attrs} /> {reloadLabel}`,
    '</span>',
  ].join('\n')
}
