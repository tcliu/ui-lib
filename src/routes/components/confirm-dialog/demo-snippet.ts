// Show-code source for the ConfirmDialog demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
// Single-quoted lines throughout: backticks and ${} inside them stay literal,
// so no escaping.

import { boolAttrLine, enumAttrLine, escapeAttr, sizeAttrLine, textAttrLine, type TriState } from '$showcase/snippet-build'
import type { Staged } from '$showcase/staged'

export interface ConfirmDialogSnippetState {
  widthVariant: Staged<string>
  heightVariant: Staged<string>
  // Panel footprint shorthand (`size` on BaseDialog).
  size: Staged<string>
  accent: Staged<string>
  pending: Staged<TriState>
  confirmOnDismiss: Staged<TriState>
  className: Staged<string>
  closeLabel: Staged<string>
  confirmLabel: Staged<string>
  message: Staged<string>
  title: Staged<string>
  // The confirm button's scale, distinct from the panel `size`.
  buttonSize: Staged<string>
}

// A string attribute line for a required prop: a scope ref stands in while
// unset, so the localized default renders without pinning English text.
function requiredTextLine(name: string, pair: Staged<string>, scopeRef: string): string[] {
  return pair.on && pair.value ? [`    ${name}="${escapeAttr(pair.value)}"`] : [`    ${name}={${scopeRef}}`]
}

export function buildConfirmDialogSnippet({
  widthVariant,
  heightVariant,
  size,
  accent,
  pending,
  confirmOnDismiss,
  className,
  closeLabel,
  confirmLabel,
  message,
  title,
  buttonSize,
}: ConfirmDialogSnippetState): string {
  return [
    '<Button variant="primary" accent="rose" onClick={() => (open = true)}>{openLabel}</Button>',
    '',
    '{#if open}',
    '  <ConfirmDialog',
    ...requiredTextLine('title', title, 'discardTitle'),
    ...requiredTextLine('message', message, 'discardMessage'),
    ...requiredTextLine('confirmLabel', confirmLabel, 'discardLabel'),
    ...requiredTextLine('closeLabel', closeLabel, 'closeLabel'),
    ...textAttrLine('className', className, '    '),
    ...enumAttrLine('widthVariant', widthVariant, 'md', '    '),
    ...enumAttrLine('heightVariant', heightVariant, 'auto', '    '),
    ...textAttrLine('size', size, '    '),
    ...enumAttrLine('accent', accent, 'rose', '    '),
    ...boolAttrLine('pending', pending, 'no', '    '),
    ...sizeAttrLine(buttonSize, '    ', 'md', 'buttonSize'),
    ...boolAttrLine('confirmOnDismiss', confirmOnDismiss, 'no', '    '),
    "    onConfirm={() => { result = 'confirmed'; open = false }}",
    "    onCancel={() => { result = 'cancelled'; open = false }} />",
    '{/if}',
    '<p class="text-sm text-slate-400">result: {result}</p>',
  ].join('\n')
}
