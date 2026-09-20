// Show-code source for the Copyable demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

export type TriState = '' | 'yes' | 'no'

export interface CopyableSnippetState {
  text: string
  copyPosition: string
  alwaysVisible: TriState
  className: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildCopyableSnippet({ text, copyPosition, alwaysVisible, className }: CopyableSnippetState): string {
  return [
    '<Copyable',
    `  text="${escapeAttr(text || 'Copy me')}"`,
    ...(copyPosition ? [`  copyPosition="${copyPosition}"`] : []),
    ...flagLine('alwaysVisible', alwaysVisible),
    ...(className ? [`  className="${escapeAttr(className)}"`] : []),
    '/>',
  ].join('\n')
}
