// Show-code source for the Tooltip demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface TooltipSnippetState {
  align: string
  className: string
}

export const STYLED_CLASS = 'border-cyan-500/40 text-cyan-200'

export function buildTooltipSnippet({ align, className }: TooltipSnippetState): string {
  const alignAttr = align ? ` align="${align}"` : ''
  const classAttr = className ? ` class="${className}"` : ''
  return [
    '<Button bind:buttonEl={explicitTrigger}>{applyLabel}</Button>',
    `<Tooltip trigger={explicitTrigger}${alignAttr}${classAttr}>{applyLabel}</Tooltip>`,
  ].join('\n')
}
