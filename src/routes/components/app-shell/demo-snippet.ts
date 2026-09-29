// Show-code source for the AppShell demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. Labels come from the
// page `scope` (never the page's i18n helper, which the playground does not
// expose), and the markup mirrors the static demo exactly.
//
// AppShell is the one demo whose stage is a `Resizable` frame rather than the
// shared `ShowcaseStage`: the shell measures its own container to pick between
// docked and floating, so the container itself must be resizable to inspect that
// behaviour. The stage is gap-free — a non-scrolling host whose width bounds the
// frame — so no scrollbar can appear over the frame handles.

// The non-scrolling host: `w-full` is what the frame's `maxWidth="parent"`
// measures against, and `overflow-hidden` contains any demo overflow without a
// scrollbar (a scrollbar here would sit on the frame's edge handles).
export const SHELL_STAGE_HOST = 'w-full overflow-hidden'
// The pane carries no padding, so the shell lines up with the section's settings
// panel below it.
export const SHELL_STAGE_PANE = 'h-full w-full'
export const SHELL_STAGE_DEFAULT_WIDTH = 840
export const SHELL_STAGE_DEFAULT_HEIGHT = 420
export const SHELL_STAGE_MIN_WIDTH = 320
export const SHELL_STAGE_MIN_HEIGHT = 240
export const SHELL_STAGE_MAX_HEIGHT = 720

// The snippet's local size state, seeded to the defaults so the live stage
// matches the static demo before the first drag.
export function shellStageStateLine(indent: string): string {
  return (
    `${indent}let stageWidth = $state(${SHELL_STAGE_DEFAULT_WIDTH})\n` +
    `${indent}let stageHeight = $state(${SHELL_STAGE_DEFAULT_HEIGHT})`
  )
}

// Show-code lines for the stage wrapper; the caller writes the shell between the
// open and close lines.
export function shellStageOpenLines(indent: string): string[] {
  return [
    `${indent}<div class="${SHELL_STAGE_HOST}">`,
    `${indent}  <Resizable`,
    `${indent}    width={stageWidth}`,
    `${indent}    height={stageHeight}`,
    `${indent}    minWidth={${SHELL_STAGE_MIN_WIDTH}}`,
    `${indent}    minHeight={${SHELL_STAGE_MIN_HEIGHT}}`,
    `${indent}    maxWidth="parent"`,
    `${indent}    maxHeight={${SHELL_STAGE_MAX_HEIGHT}}`,
    `${indent}    onResize={(nextWidth, nextHeight) => { stageWidth = nextWidth; stageHeight = nextHeight; }}`,
    `${indent}  >`,
    `${indent}    <div class="${SHELL_STAGE_PANE}">`,
  ]
}

export function shellStageCloseLines(indent: string): string[] {
  return [`${indent}    </div>`, `${indent}  </Resizable>`, `${indent}</div>`]
}

export interface AppShellSnippetState {
  collapseMode: string
  visibility: string
  mode: string
  rightPane: string
  footer: string
}

export function buildAppShellSnippet({
  collapseMode,
  visibility,
  mode,
  rightPane,
  footer,
}: AppShellSnippetState): string {
  const attrs = [
    ' className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-800"',
    ...(mode ? [` mode="${mode}"`] : []),
    ...(collapseMode ? [` collapseMode="${collapseMode}"`] : []),
    ...(visibility === 'closed' ? [' open={false}'] : []),
    ...(rightPane === 'open' ? [' rightOpen={true}'] : []),
  ].join('')
  return [
    '<script>',
    shellStageStateLine('  '),
    '</script>',
    ...shellStageOpenLines(''),
    `      <AppShell${attrs}>`,
    '        {#snippet header(api)}',
    '          {@const toggleLabel = api.open ? hideLabel : showLabel}',
    '          <Button variant="secondary" size="sm" className="-ml-1" ariaLabel={toggleLabel} ariaExpanded={api.open} tooltip={toggleLabel} tooltipAlign="left" preventFocusSteal onClick={api.toggleLeft}>',
    '            {#snippet icon()}<MenuIcon size="sm" />{/snippet}',
    '          </Button>',
    '          <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200">{demoTitle}</span>',
    '        {/snippet}',
    '        {#snippet leftPane()}',
    '          <p class="px-3 py-2 text-sm text-slate-300">{navLabel}</p>',
    '        {/snippet}',
    ...(rightPane === 'open'
      ? [
          '        {#snippet rightPane()}',
          '          <p class="px-3 py-2 text-sm text-slate-300">{bodyText}</p>',
          '        {/snippet}',
        ]
      : []),
    ...(footer === 'show'
      ? [
          '        {#snippet footer()}',
          '          <div class="flex min-w-0 flex-1 items-center justify-between gap-4">',
          '            <span class="text-xs text-slate-400">{navLabel}</span>',
          '            <span class="text-xs text-slate-400">{demoTitle}</span>',
          '          </div>',
          '        {/snippet}',
        ]
      : []),
    '        <p class="p-4 text-sm text-slate-300">{bodyText}</p>',
    '      </AppShell>',
    ...shellStageCloseLines(''),
  ].join('\n')
}
