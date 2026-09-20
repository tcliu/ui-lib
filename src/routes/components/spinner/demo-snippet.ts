// Show-code source for the Spinner demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface SpinnerSnippetState {
  size: string
  tint: string
}

export function buildSpinnerSnippet({ size, tint }: SpinnerSnippetState): string {
  const attrs = [...(size ? [` size="${size}"`] : []), ...(tint ? [` className="${tint}"`] : [])].join('')
  return [
    `<Spinner${attrs} />`,
    '<span class="inline-flex items-center gap-2 text-sm text-slate-300">',
    `  <Spinner${attrs} /> {reloadLabel}`,
    '</span>',
  ].join('\n')
}
