// Show-code source for the DateRangePicker demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above. The range
// is seeded as script-local state (like the stage size) so the snippet is
// self-contained and its text tracks Value edits instead of hiding the range
// in scope.
//
// The demo sits in a width-only `Resizable` frame so the calendar placement can
// be inspected as the container narrows. The host is non-scrolling and the
// frame is bounded to it, so no scrollbar can appear over the frame handle.
// These literals are shared with the page and its tests so the rendered stage
// and the reviewed source stay identical.

export const DATE_STAGE_HOST = 'w-full overflow-hidden'
export const DATE_STAGE_PANE = 'flex w-full min-w-0 flex-wrap items-start gap-4'
export const DATE_STAGE_CONTENT = 'flex flex-col gap-1'
export const DATE_STAGE_DEFAULT_WIDTH = 560
export const DATE_STAGE_MIN_WIDTH = 240

// The snippet's local size state, seeded to the default so the live stage
// matches the static demo before the first drag.
export function dateStageStateLine(indent: string): string {
  return `${indent}let stageWidth = $state(${DATE_STAGE_DEFAULT_WIDTH})`
}

export function dateStageOpenLines(indent: string): string[] {
  return [
    `${indent}<div class="${DATE_STAGE_HOST}">`,
    `${indent}  <Resizable`,
    `${indent}    width={stageWidth}`,
    `${indent}    minWidth={${DATE_STAGE_MIN_WIDTH}}`,
    `${indent}    maxWidth="parent"`,
    `${indent}    onResize={nextWidth => (stageWidth = nextWidth)}`,
    `${indent}  >`,
    `${indent}    <div class="${DATE_STAGE_PANE}">`,
  ]
}

export function dateStageCloseLines(indent: string): string[] {
  return [`${indent}    </div>`, `${indent}  </Resizable>`, `${indent}</div>`]
}

export interface DateRangePickerSnippetState {
  from: string
  to: string
}

export function buildDateRangePickerSnippet({ from, to }: DateRangePickerSnippetState): string {
  // The content column sits at 6 spaces; the component and the trailing range
  // line at 8, and attributes at 10, matching the stage's inner pane.
  // JSON.stringify keeps the seeded literals valid no matter what the range
  // holds.
  const contentIndent = '      '
  const componentIndent = '        '
  const attributeIndent = '          '
  return [
    '<script>',
    dateStageStateLine('  '),
    `  let from = $state(${JSON.stringify(from)})`,
    `  let to = $state(${JSON.stringify(to)})`,
    '</script>',
    ...dateStageOpenLines(''),
    `${contentIndent}<div class="${DATE_STAGE_CONTENT}">`,
    `${componentIndent}<DateRangePicker`,
    `${attributeIndent}from={from}`,
    `${attributeIndent}to={to}`,
    `${attributeIndent}onFrom={value => (from = value)}`,
    `${attributeIndent}onTo={value => (to = value)} />`,
    `${componentIndent}<span class="text-sm text-slate-400">range: {from || '—'} – {to || '—'}</span>`,
    `${contentIndent}</div>`,
    ...dateStageCloseLines(''),
  ].join('\n')
}
