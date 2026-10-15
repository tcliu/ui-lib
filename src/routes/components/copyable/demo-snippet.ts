// Show-code source for the Copyable demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

import { escapeAttr, escapeText } from '$lib/showcase/snippet-build'
import { sizeAttributeLine } from '$lib/showcase/size-input'

export interface CopyableSnippetState {
  text: string
  textOn: boolean
  copyPosition: string
  copyPositionOn: boolean
  textClass: string
  textClassOn: boolean
  containerClass: string
  containerClassOn: boolean
  ariaLabel: string
  ariaLabelOn: boolean
  tooltip: string
  tooltipOn: boolean
  children: string
  size: string
  sizeOn: boolean
}

// Element text for the children span below.

export function buildCopyableSnippet({ text, textOn, copyPosition, copyPositionOn, textClass, textClassOn, containerClass, containerClassOn, ariaLabel, ariaLabelOn, tooltip, tooltipOn, children, size, sizeOn }: CopyableSnippetState): string {
  const hasChildren = children !== ''
  const resolvedText = textOn && text ? text : 'Copy me'
  return [
    '<Copyable',
    `  text="${escapeAttr(resolvedText)}"`,
    // The size and position Values prefill their component defaults; the
    // builder omits the defaults so Show-code stays minimal.
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, '  ') : []),
    ...(copyPositionOn && copyPosition && copyPosition !== 'inline' ? [`  copyPosition="${copyPosition}"`] : []),
    ...(textClassOn && textClass ? [`  textClass="${escapeAttr(textClass)}"`] : []),
    ...(containerClassOn && containerClass ? [`  containerClass="${escapeAttr(containerClass)}"`] : []),
    ...(ariaLabelOn && ariaLabel ? [`  ariaLabel="${escapeAttr(ariaLabel)}"`] : []),
    ...(tooltipOn && tooltip ? [`  tooltip="${escapeAttr(tooltip)}"`] : []),
    ...(hasChildren ? ['>', `  <span>${escapeText(children)}</span>`, '</Copyable>'] : ['/>']),
  ].join('\n')
}
