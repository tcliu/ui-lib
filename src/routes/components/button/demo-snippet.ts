// Show-code source for the Button demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export type TriState = '' | 'yes' | 'no'

export interface ButtonSnippetState {
  variant: string
  accent: string
  size: string
  disabled: TriState
  pending: TriState
  icon: string
  badge: string
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

export function buildButtonSnippet({
  variant,
  accent,
  size,
  disabled,
  pending,
  icon,
  badge,
  className,
}: ButtonSnippetState): string {
  const lines = [
    '<Button',
    ...(variant ? [`  variant="${variant}"`] : []),
    ...(accent ? [`  accent="${accent}"`] : []),
    ...(size ? [`  size="${size}"`] : []),
    ...flagLine('disabled', disabled),
    ...flagLine('pending', pending),
    ...(icon ? ['  icon={checkIcon}'] : []),
    ...(badge ? [`  badge="${escapeAttr(badge)}"`] : []),
    ...(className ? [`  className="${escapeAttr(className)}"`] : []),
    '  onClick={() => (clicks += 1)}>{label} ({clicks})',
    '</Button>',
  ]
  return lines.join('\n')
}
