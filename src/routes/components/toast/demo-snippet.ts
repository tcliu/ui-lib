// Show-code source for the Toast demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import { enumAttrLine, escapeAttr, sizeAttrLine, textAttrLine } from '#showcase/playground/snippet-build.js'
import type { Staged } from '#showcase/playground/staged.js'
export interface ToastSnippetState {
  message: Staged<string>
  toastType: Staged<string>
  position: Staged<string>
  size: Staged<string>
  action: string
  closeLabel: Staged<string>
}

export function buildToastSnippet({ message, toastType, position, size, action, closeLabel }: ToastSnippetState): string {
  // Unset, each text prop falls back to the scope value the demo reads.
  const messageAttr = textAttrLine('message', message, '    ')
  const closeLabelAttr = textAttrLine('closeLabel', closeLabel, '    ')
  const lines = [
    '<Button variant="primary" onClick={() => (open = true)}>{showLabel}</Button>',
    '',
    '{#if open}',
    '  <Toast',
    ...(messageAttr.length ? messageAttr : ['    message={defaultMessage}']),
    ...(closeLabelAttr.length ? closeLabelAttr : ['    closeLabel={closeLabel}']),
    ...enumAttrLine('type', toastType, 'info', '    '),
    ...enumAttrLine('position', position, 'bottom-right', '    '),
    ...sizeAttrLine(size, '    '),
    ...(action ? [`    action={{ label: "${escapeAttr(action)}", onClick: () => (actionTaken = actionLabel) }}`] : []),
    '    onClose={() => (open = false)} />',
    '{/if}',
    `<span class="text-sm text-slate-400">action: {actionTaken || '—'}</span>`,
  ]
  return lines.join('\n')
}
