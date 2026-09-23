// Show-code source for the AppShell demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface AppShellSnippetState {
  collapseMode: string
  visibility: string
  mode: string
  rightPane: string
}

export function buildAppShellSnippet({ collapseMode, visibility, mode, rightPane }: AppShellSnippetState): string {
  const attrs = [
    ...(mode ? [` mode="${mode}"`] : []),
    ...(collapseMode ? [` collapseMode="${collapseMode}"`] : []),
    ...(visibility === 'closed' ? [' open={false}'] : []),
    ...(rightPane === 'open' ? [' rightOpen={true}'] : []),
  ].join('')
  return [
    '<div class="w-full min-w-0 overflow-x-auto" tabindex="-1">',
    '  <div class="flex h-80 w-full min-w-[49rem] flex-col overflow-hidden rounded-lg border border-slate-800">',
    `    <AppShell${attrs}>`,
    '      {#snippet headerLeft()}',
    '        <span class="text-sm font-semibold text-slate-200">{demoTitle}</span>',
    '      {/snippet}',
    '      {#snippet leftPane()}',
    '        <p class="px-3 py-2 text-sm text-slate-300">{navLabel}</p>',
    '      {/snippet}',
    ...(rightPane === 'open'
      ? [
          '      {#snippet rightPane()}',
          '        <p class="px-3 py-2 text-sm text-slate-300">{bodyText}</p>',
          '      {/snippet}',
        ]
      : []),
    '      <p class="p-4 text-sm text-slate-300">{bodyText}</p>',
    '    </AppShell>',
    '  </div>',
    '</div>',
  ].join('\n')
}
