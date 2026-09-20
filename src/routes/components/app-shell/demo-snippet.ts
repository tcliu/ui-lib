// Show-code source for the AppShell demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface AppShellSnippetState {
  collapseMode: string
  visibility: string
}

export function buildAppShellSnippet({ collapseMode, visibility }: AppShellSnippetState): string {
  const attrs = [
    ...(collapseMode ? [` collapseMode="${collapseMode}"`] : []),
    ...(visibility === 'closed' ? [' open={false}'] : []),
  ].join('')
  return [
    '<div class="flex h-80 flex-col overflow-hidden rounded-lg border border-slate-800">',
    `  <AppShell${attrs}>`,
    '    {#snippet headerLeft()}',
    '      <span class="text-sm font-semibold text-slate-200">{demoTitle}</span>',
    '    {/snippet}',
    '    {#snippet leftPane()}',
    '      <p class="px-3 py-2 text-sm text-slate-300">{navLabel}</p>',
    '    {/snippet}',
    '    <p class="p-4 text-sm text-slate-300">{bodyText}</p>',
    '  </AppShell>',
    '</div>',
  ].join('\n')
}
