// Show-code source for the ClearButton demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.

import { boolAttrLine, sizeAttrLine, textAttrLine, type TriState } from '#showcase/playground/snippet-build.js'
import type { Staged } from '#showcase/playground/staged.js'

export interface ClearButtonSnippetState {
  ariaLabel: Staged<string>
  disabled: Staged<TriState>
  size: Staged<string>
  tooltip: Staged<string>
}

export function buildClearButtonSnippet({ ariaLabel, disabled, size, tooltip }: ClearButtonSnippetState): string {
  return [
    '<ClearButton',
    // The size and disabled Values prefill their component defaults; the
    // builder omits the defaults so Show-code stays minimal.
    ...sizeAttrLine(size),
    ...boolAttrLine('disabled', disabled, 'no'),
    ...textAttrLine('ariaLabel', ariaLabel),
    ...textAttrLine('tooltip', tooltip),
    '  onClick={() => (clicks += 1)} />',
    '<span>{clicks}</span>',
  ].join('\n')
}
