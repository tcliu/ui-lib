// Shared resizable demo stage for the showcase's larger components. The demo
// fills the available width by default and a Splitter drags that width down, so
// a narrow-container layout can be inspected without resizing the window.
//
// The page markup, the Show-code builder, and the tests read the same literals,
// so the rendered stage and the reviewed source stay identical. The stage width
// is a plain percentage: the Splitter's `unit="%"` converts drag deltas against
// its own flex container, so the caller never measures anything.

export const STAGE_ROW = 'flex w-full min-w-0'
export const STAGE_PANE = 'min-h-0 min-w-0 flex-none'
// The handle's visible line: without it the Splitter is invisible until focus.
export const STAGE_HANDLE_LINE = 'bg-slate-700'
// Percent bounds for the stage width: full width by default, down to a quarter
// so the narrow layout stays legible.
export const STAGE_RESIZE_MIN = 25
export const STAGE_RESIZE_MAX = 100
export const STAGE_RESIZE_DEFAULT = 100

// Show-code lines for the stage wrapper. `paneClass` carries the demo's own
// sizing; the caller writes the component between the open and close lines.
export function stageOpenLines(indent: string, paneClass: string): string[] {
  return [
    `${indent}<div class="${STAGE_ROW}">`,
    `${indent}  <div class="${STAGE_PANE} ${paneClass}" style={\`flex-basis:\${stageWidth}%\`}>`,
  ]
}

export function stageCloseLines(indent: string): string[] {
  return [
    `${indent}  </div>`,
    `${indent}  <Splitter`,
    `${indent}    orientation="vertical"`,
    `${indent}    unit="%"`,
    `${indent}    value={stageWidth}`,
    `${indent}    min={${STAGE_RESIZE_MIN}}`,
    `${indent}    max={${STAGE_RESIZE_MAX}}`,
    `${indent}    onChange={next => (stageWidth = next)}`,
    `${indent}    ariaLabel={resizeLabel}`,
    `${indent}    lineClass="${STAGE_HANDLE_LINE}"`,
    `${indent}  />`,
    `${indent}</div>`,
  ]
}

// The snippet's local width state, seeded to the default so the live stage
// matches the static demo before the first drag.
export function stageStateLine(indent: string): string {
  return `${indent}let stageWidth = $state(${STAGE_RESIZE_DEFAULT})`
}
