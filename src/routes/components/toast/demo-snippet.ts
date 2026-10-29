// Show-code source for the Toast demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import { escapeAttr } from '$showcase/snippet-build'
import { sizeAttributeLine } from '$showcase/size-input'
export interface ToastSnippetState {
  message: string
  messageOn: boolean
  toastType: string
  toastTypeOn: boolean
  position: string
  positionOn: boolean
  size: string
  sizeOn: boolean
  action: string
  closeLabel: string
  closeLabelOn: boolean
}

export function buildToastSnippet({ message, messageOn, toastType, toastTypeOn, position, positionOn, size, sizeOn, action, closeLabel, closeLabelOn }: ToastSnippetState): string {
  const lines = [
    '<Button variant="primary" onClick={() => (open = true)}>{showLabel}</Button>',
    '',
    '{#if open}',
    '  <Toast',
    ...(messageOn && message ? [`    message="${escapeAttr(message)}"`] : ['    message={defaultMessage}']),
    ...(closeLabelOn && closeLabel ? [`    closeLabel="${escapeAttr(closeLabel)}"`] : ['    closeLabel={closeLabel}']),
    ...(toastTypeOn && toastType && toastType !== 'info' ? [`    type="${toastType}"`] : []),
    ...(positionOn && position && position !== 'bottom-right' ? [`    position="${position}"`] : []),
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, '    ') : []),
    ...(action ? [`    action={{ label: "${escapeAttr(action)}", onClick: () => (actionTaken = actionLabel) }}`] : []),
    '    onClose={() => (open = false)} />',
    '{/if}',
    `<span class="text-sm text-slate-400">action: {actionTaken || '—'}</span>`,
  ]
  return lines.join('\n')
}
