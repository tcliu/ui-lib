// Show-code source for the Spinner demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import { sizeAttributeFragment } from '$showcase/size-input'
export interface SpinnerSnippetState {
  size: string
  sizeOn: boolean
  tint: string
  tintOn: boolean
}

export function buildSpinnerSnippet({ size, sizeOn, tint, tintOn }: SpinnerSnippetState): string {
  // The size Value prefills the component default; the builder omits it so
  // Show-code stays minimal.
  const sizeFragment = sizeOn && size !== '' && size !== 'md' ? sizeAttributeFragment(size) : ''
  const attrs = [sizeFragment, ...(tintOn && tint ? [` className="${tint}"`] : [])].join('')
  return [
    '<span class="inline-flex items-center gap-2 text-sm text-slate-300">',
    `  <Spinner${attrs} /> {reloadLabel}`,
    '</span>',
  ].join('\n')
}
