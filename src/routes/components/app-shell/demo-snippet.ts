// Show-code source for the AppShell demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. Labels come from the
// page `scope` (never the page's i18n helper, which the playground does not
// expose), and the markup mirrors the static demo exactly.

export interface AppShellSnippetState {
  collapseMode: string
  visibility: string
  mode: string
  rightPane: string
  footer: string
}

export function buildAppShellSnippet({ collapseMode, visibility, mode, rightPane, footer }: AppShellSnippetState): string {
  const attrs = [
    ...(mode ? [` mode="${mode}"`] : []),
    ...(collapseMode ? [` collapseMode="${collapseMode}"`] : []),
    ...(visibility === 'closed' ? [' open={false}'] : []),
    ...(rightPane === 'open' ? [' rightOpen={true}'] : []),
  ].join('')
  return [
    '<div class="flex h-80 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-800">',
    `  <AppShell${attrs}>`,
    '    {#snippet header(api)}',
    '      {@const toggleLabel = api.open ? hideLabel : showLabel}',
    '      <Button variant="secondary" size="sm" className="-ml-1" ariaLabel={toggleLabel} ariaExpanded={api.open} tooltip={toggleLabel} tooltipAlign="left" preventFocusSteal onClick={api.toggleLeft}>',
    '        {#snippet icon()}<MenuIcon className="h-4 w-4" />{/snippet}',
    '      </Button>',
    '      <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200">{demoTitle}</span>',
    '    {/snippet}',
    '    {#snippet leftPane()}',
    '      <p class="px-3 py-2 text-sm text-slate-300">{navLabel}</p>',
    '    {/snippet}',
    ...(rightPane === 'open'
      ? [
          '    {#snippet rightPane()}',
          '      <p class="px-3 py-2 text-sm text-slate-300">{bodyText}</p>',
          '    {/snippet}',
        ]
      : []),
    ...(footer === 'show'
      ? [
          '    {#snippet footer()}',
          '      <div class="flex min-w-0 flex-1 items-center justify-between gap-4">',
          '        <span class="text-xs text-slate-400">{navLabel}</span>',
          '        <span class="text-xs text-slate-400">{demoTitle}</span>',
          '      </div>',
          '    {/snippet}',
        ]
      : []),
    '    <p class="p-4 text-sm text-slate-300">{bodyText}</p>',
    '  </AppShell>',
    '</div>',
  ].join('\n')
}
