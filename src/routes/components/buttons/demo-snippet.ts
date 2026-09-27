// Show-code source for the Buttons demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface ButtonsSnippetState {
  align: string
  className: string
}

export const STACKED_CLASS = 'flex flex-col items-start gap-1'

export function buildButtonsSnippet({ align, className }: ButtonsSnippetState): string {
  // A custom className replaces the default row, so align is omitted with it.
  const attrs = [
    ...(!className && align ? [` align="${align}"`] : []),
    ...(className ? [` className="${className}"`] : []),
  ].join('')
  return [
    `<Buttons${attrs}>`,
    '  <Button variant="primary">{okLabel}</Button>',
    '  <Button>{cancelLabel}</Button>',
    '</Buttons>',
  ].join('\n')
}
