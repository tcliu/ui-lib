// Show-code source for the BaseDialog demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

export type TriState = '' | 'yes' | 'no'

export interface BaseDialogSnippetState {
  maxWidth: string
  height: string
  fullscreen: TriState
  pending: TriState
  allowPendingCancel: TriState
  titleClass: string
  className: string
  customHeader: string
}

export const STYLED_TITLE = 'text-cyan-200'
export const STYLED_PANEL = 'border-cyan-500/40'

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`    ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildBaseDialogSnippet({
  maxWidth,
  height,
  fullscreen,
  pending,
  allowPendingCancel,
  titleClass,
  className,
  customHeader,
}: BaseDialogSnippetState): string {
  const lines = [
    '<Button variant="primary" onClick={() => (open = true)}>{openDialogLabel}</Button>',
    '',
    '{#if open}',
    '  <BaseDialog',
    ...(customHeader ? ['    header={customHeader}'] : ['    title={dialogTitle}']),
    ...(titleClass ? [`    titleClass="${titleClass}"`] : []),
    ...(className ? [`    className="${className}"`] : []),
    ...(maxWidth ? [`    maxWidth="${maxWidth}"`] : []),
    ...(height ? [`    height="${height}"`] : []),
    ...flagLine('fullscreen', fullscreen),
    ...flagLine('pending', pending),
    ...flagLine('allowPendingCancel', allowPendingCancel),
    '    onCancel={() => (open = false)}>',
    '    <p data-testid="dialog-body">{dialogBody}</p>',
    '    <Buttons className="mt-4 flex w-full shrink-0 flex-wrap items-center justify-end gap-3">',
    '      <Button onClick={() => (open = false)}>{cancelLabel}</Button>',
    '      <Button variant="primary" onClick={() => (open = false)}>{okLabel}</Button>',
    '    </Buttons>',
    '  </BaseDialog>',
    '{/if}',
  ]
  return lines.join('\n')
}
