// Show-code source for the Copyable demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

import { enumAttrLine, escapeAttr, escapeText, sizeAttrLine, textAttrLine } from '#showcase/playground/snippet-build.js'
import type { Staged } from '#showcase/playground/staged.js'

export interface CopyableSnippetState {
  text: Staged<string>
  copyPosition: Staged<string>
  textClass: Staged<string>
  containerClass: Staged<string>
  ariaLabel: Staged<string>
  tooltip: Staged<string>
  children: Staged<string>
  copyText: Staged<string>
  size: Staged<string>
}

// Element text for the children span below.

export function buildCopyableSnippet({ text, copyPosition, textClass, containerClass, ariaLabel, tooltip, children, copyText, size }: CopyableSnippetState): string {
  const hasChildren = children.on && children.value !== ''
  const resolvedText = text.on && text.value ? text.value : 'Copy me'
  return [
    '<Copyable',
    `  text="${escapeAttr(resolvedText)}"`,
    // The size and position Values prefill their component defaults; the
    // builder omits the defaults so Show-code stays minimal.
    ...sizeAttrLine(size),
    ...enumAttrLine('copyPosition', copyPosition, 'inline'),
    ...textAttrLine('copyText', copyText),
    ...textAttrLine('textClass', textClass),
    ...textAttrLine('containerClass', containerClass),
    ...textAttrLine('ariaLabel', ariaLabel),
    ...textAttrLine('tooltip', tooltip),
    ...(hasChildren ? ['>', `  <span>${escapeText(children.value)}</span>`, '</Copyable>'] : ['/>']),
  ].join('\n')
}
