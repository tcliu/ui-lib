// Show-code source for the Toast demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface ToastSnippetState {
  message: string
  toastType: string
  position: string
  size: string
  action: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildToastSnippet({ message, toastType, position, size, action }: ToastSnippetState): string {
  const lines = [
    '<Button variant="primary" onClick={() => (open = true)}>{showLabel}</Button>',
    '',
    '{#if open}',
    '  <Toast',
    ...(message ? [`    message="${escapeAttr(message)}"`] : ['    message={defaultMessage}']),
    '    closeLabel={closeLabel}',
    ...(toastType ? [`    type="${toastType}"`] : []),
    ...(position ? [`    position="${position}"`] : []),
    ...(size ? [`    size="${size}"`] : []),
    ...(action
      ? [`    actionLabel="${escapeAttr(action)}"`, '    onAction={() => (actionTaken = actionLabel)}']
      : []),
    '    onClose={() => (open = false)} />',
    '{/if}',
    `<span class="text-sm text-slate-400">action: {actionTaken || '—'}</span>`,
  ]
  return lines.join('\n')
}
