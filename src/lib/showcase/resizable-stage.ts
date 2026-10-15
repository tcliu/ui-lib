// Shared demo stage for the showcase's larger components: the demo fills a
// bounded pane whose size comes from `paneClass` (a handle-free stage, since the
// width-resizable variant has no caller).
//
// The page markup, the Show-code builder, and the tests read the same literals,
// so the rendered stage and the reviewed source stay identical.

export const STAGE_ROW = 'flex w-full min-w-0'
export const STAGE_PANE = 'min-h-0 min-w-0 flex-none'

// Handle-less stage for a demo that fills a bounded pane and must not be
// width-resizable (the DataTable fill demo): the same row + pane wrapper with
// no inline width and no Splitter, so the pane's width comes from `paneClass`.
export function stageStaticOpenLines(indent: string, paneClass: string): string[] {
  return [`${indent}<div class="${STAGE_ROW}">`, `${indent}  <div class="${STAGE_PANE} ${paneClass}">`]
}

export function stageStaticCloseLines(indent: string): string[] {
  return [`${indent}  </div>`, `${indent}</div>`]
}
