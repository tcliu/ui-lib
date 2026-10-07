// Show-code source for the Menu demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The item list
// lives in a leading script block (data arrays are merged into the compiled
// preamble); labels fall back to scope values while unset.

export interface MenuSnippetState {
  align: string
  triggerLabel: string
  firstLabel: string
  secondLabel: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildMenuSnippet({ align, triggerLabel, firstLabel, secondLabel }: MenuSnippetState): string {
  return [
    '<script>',
    '  const menuItems = [',
    `    { id: 'edit', label: ${firstLabel ? `"${escapeAttr(firstLabel)}"` : 'editLabel'}, onClick: () => (lastAction = editLabel) },`,
    `    { id: 'delete', label: ${secondLabel ? `"${escapeAttr(secondLabel)}"` : 'deleteLabel'}, onClick: () => (lastAction = deleteLabel) },`,
    '  ]',
    '</script>',
    '<Menu',
    '  items={menuItems}',
    '  itemKey={item => item.id}',
    '  onSelect={index => menuItems[index].onClick()}',
    ...(triggerLabel ? [`  ariaLabel="${escapeAttr(triggerLabel)}"`] : ['  ariaLabel={triggerLabel}']),
    ...(align ? [`  align="${align}"`] : []),
    '  triggerClass="p-2"',
    '  panelClass="w-44"',
    '  itemClass={menuItemClass}',
    '  itemLabel={item => item.label}',
    '  itemDisabled={item => item.disabled ?? false}>',
    '  {#snippet icon()}',
    '    <KebabIcon className="h-4 w-4" />',
    '  {/snippet}',
    '  {#snippet item(item)}',
    '    {item.label}',
    '  {/snippet}',
    '</Menu>',
    `<span class="text-sm text-slate-400">last action: {lastAction || '—'}</span>`,
  ].join('\n')
}
