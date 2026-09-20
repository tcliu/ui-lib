// Show-code source for the EditDialog demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

export type TriState = '' | 'yes' | 'no'

export interface EditDialogSnippetState {
  maxWidth: string
  dirty: TriState
  pending: TriState
  saveDisabled: TriState
  showReset: TriState
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`    ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildEditDialogSnippet({
  maxWidth,
  dirty,
  pending,
  saveDisabled,
  showReset,
}: EditDialogSnippetState): string {
  return [
    '<Button variant="primary" onClick={() => (open = true)}>{openDialogLabel}</Button>',
    '',
    '{#if open}',
    '  <EditDialog',
    '    title={dialogTitle}',
    '    closeLabel={closeLabel}',
    '    saveLabel={okLabel}',
    '    resetLabel={resetLabel}',
    '    discardTitle={discardTitle}',
    '    discardMessage={discardMessage}',
    '    discardLabel={discardLabel}',
    ...(maxWidth ? [`    maxWidth="${maxWidth}"`] : []),
    ...flagLine('dirty', dirty),
    ...flagLine('pending', pending),
    ...flagLine('saveDisabled', saveDisabled),
    ...flagLine('showReset', showReset),
    '    onSave={() => (open = false)}',
    '    onReset={() => (draft = saved)}',
    '    onClose={() => (open = false)}>',
    '    <input type="text" bind:value={draft} aria-label={dialogTitle} />',
    '  </EditDialog>',
    '{/if}',
  ].join('\n')
}
