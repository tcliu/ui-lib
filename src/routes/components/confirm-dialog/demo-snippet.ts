// Show-code source for the ConfirmDialog demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
// Single-quoted lines throughout: backticks and ${} inside them stay literal,
// so no escaping.

import { escapeAttr } from '$showcase/snippet-build'
import { sizeAttributeLine } from '$showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export interface ConfirmDialogSnippetState {
  widthVariant: string
  widthVariantOn: boolean
  heightVariant: string
  heightVariantOn: boolean
  // Panel footprint shorthand (`size` on BaseDialog).
  size: string
  sizeOn: boolean
  accent: string
  accentOn: boolean
  pending: TriState
  pendingOn: boolean
  confirmOnDismiss: TriState
  confirmOnDismissOn: boolean
  className: string
  classNameOn: boolean
  closeLabel: string
  closeLabelOn: boolean
  confirmLabel: string
  confirmLabelOn: boolean
  message: string
  messageOn: boolean
  title: string
  titleOn: boolean
  // The confirm button's scale, distinct from the panel `size`.
  buttonSize: string
  buttonSizeOn: boolean
}

// A string attribute line for an optional prop: omitted while unset.
function optionalTextLine(name: string, value: string): string[] {
  return value ? [`    ${name}="${escapeAttr(value)}"`] : []
}

// A string attribute line for a required prop: a scope ref stands in while
// unset, so the localized default renders without pinning English text.
function requiredTextLine(name: string, value: string, scopeRef: string): string[] {
  return value ? [`    ${name}="${escapeAttr(value)}"`] : [`    ${name}={${scopeRef}}`]
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`    ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildConfirmDialogSnippet({
  widthVariant,
  widthVariantOn,
  heightVariant,
  heightVariantOn,
  size,
  sizeOn,
  accent,
  accentOn,
  pending,
  pendingOn,
  confirmOnDismiss,
  confirmOnDismissOn,
  className,
  classNameOn,
  closeLabel,
  closeLabelOn,
  confirmLabel,
  confirmLabelOn,
  message,
  messageOn,
  title,
  titleOn,
  buttonSize,
  buttonSizeOn,
}: ConfirmDialogSnippetState): string {
  return [
    '<Button variant="primary" accent="rose" onClick={() => (open = true)}>{openLabel}</Button>',
    '',
    '{#if open}',
    '  <ConfirmDialog',
    ...requiredTextLine('title', titleOn && title ? title : '', 'discardTitle'),
    ...requiredTextLine('message', messageOn && message ? message : '', 'discardMessage'),
    ...requiredTextLine('confirmLabel', confirmLabelOn && confirmLabel ? confirmLabel : '', 'discardLabel'),
    ...requiredTextLine('closeLabel', closeLabelOn ? closeLabel : '', 'closeLabel'),
    ...optionalTextLine('className', classNameOn ? className : ''),
    ...(widthVariantOn && widthVariant && widthVariant !== 'md' ? [`    widthVariant="${widthVariant}"`] : []),
    ...(heightVariantOn && heightVariant && heightVariant !== 'auto' ? [`    heightVariant="${heightVariant}"`] : []),
    ...(sizeOn ? optionalTextLine('size', size) : []),
    ...(accentOn && accent && accent !== 'rose' ? [`    accent="${accent}"`] : []),
    ...(pendingOn ? flagLine('pending', pending, 'no') : []),
    ...(buttonSizeOn && buttonSize !== '' && buttonSize !== 'md' ? sizeAttributeLine(buttonSize, '    ', 'buttonSize') : []),
    ...(confirmOnDismissOn ? flagLine('confirmOnDismiss', confirmOnDismiss, 'no') : []),
    "    onConfirm={() => { result = 'confirmed'; open = false }}",
    "    onCancel={() => { result = 'cancelled'; open = false }} />",
    '{/if}',
    '<p class="text-sm text-slate-400">result: {result}</p>',
  ].join('\n')
}
