// Show-code source for the ConfirmDialog demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
// Single-quoted lines throughout: backticks and ${} inside them stay literal,
// so no escaping.

export type TriState = '' | 'yes' | 'no'

export interface ConfirmDialogSnippetState {
  maxWidth: string
  confirmColor: string
  pending: TriState
  confirmOnDismiss: TriState
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`    ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildConfirmDialogSnippet({
  maxWidth,
  confirmColor,
  pending,
  confirmOnDismiss,
}: ConfirmDialogSnippetState): string {
  return [
    '<Button variant="primary" accent="rose" onClick={() => (open = true)}>{openLabel}</Button>',
    '',
    '{#if open}',
    '  <ConfirmDialog',
    '    title={discardTitle}',
    '    message={discardMessage}',
    '    confirmLabel={discardLabel}',
    '    closeLabel={closeLabel}',
    ...(maxWidth ? [`    maxWidth="${maxWidth}"`] : []),
    ...(confirmColor ? [`    confirmColor="${confirmColor}"`] : []),
    ...flagLine('pending', pending),
    ...flagLine('confirmOnDismiss', confirmOnDismiss),
    "    onConfirm={() => { result = 'confirmed'; open = false }}",
    "    onCancel={() => { result = 'cancelled'; open = false }} />",
    '{/if}',
    '<p class="text-sm text-slate-400">result: {result}</p>',
  ].join('\n')
}
