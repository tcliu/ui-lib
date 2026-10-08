// Show-code source for the ChipDropdown demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
//
// The demo sits in a width-only `Resizable` frame so the panel placement can be
// inspected as the container narrows. The host is non-scrolling and the frame
// is bounded to it, so no scrollbar can appear over the frame handle. These
// literals are shared with the page and its tests so the rendered stage and
// the reviewed source stay identical.

export type TriState = '' | 'yes' | 'no'

export const CHIP_STAGE_HOST = 'w-full overflow-hidden'
export const CHIP_STAGE_PANE = 'flex w-full min-w-0 flex-wrap items-start gap-4'
export const CHIP_STAGE_DEFAULT_WIDTH = 560
export const CHIP_STAGE_MIN_WIDTH = 240

// The snippet's local size state, seeded to the default so the live stage
// matches the static demo before the first drag.
export function chipStageStateLine(indent: string): string {
  return `${indent}let stageWidth = $state(${CHIP_STAGE_DEFAULT_WIDTH})`
}

export function chipStageOpenLines(indent: string): string[] {
  return [
    `${indent}<div class="${CHIP_STAGE_HOST}">`,
    `${indent}  <Resizable`,
    `${indent}    width={stageWidth}`,
    `${indent}    minWidth={${CHIP_STAGE_MIN_WIDTH}}`,
    `${indent}    maxWidth="parent"`,
    `${indent}    onResize={nextWidth => (stageWidth = nextWidth)}`,
    `${indent}  >`,
    `${indent}    <div class="${CHIP_STAGE_PANE}">`,
  ]
}

export function chipStageCloseLines(indent: string): string[] {
  return [`${indent}    </div>`, `${indent}  </Resizable>`, `${indent}</div>`]
}

export interface ChipDropdownSnippetState {
  label: string
  ariaLabel: string
  // Committed value, seeded as script-local state (like the stage size) so the
  // snippet text tracks activeValue edits instead of hiding the value in scope.
  value: string
  variant: string
  filterable: TriState
  disabled: TriState
  align: string
  filterPlaceholder: string
  buttonClass: string
  emptyText: string
  autoPlace: TriState
  panelClass: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: string): string[] {
  if (value === '') {
    return []
  }
  return [`${indent}${name}${value === 'yes' ? '' : '={false}'}`]
}

// A string attribute line, omitted while unset.
function textLine(name: string, value: string, indent: string): string[] {
  return value ? [`${indent}${name}="${escapeAttr(value)}"`] : []
}

export function buildChipDropdownSnippet({
  label,
  ariaLabel,
  value,
  variant,
  filterable,
  disabled,
  align,
  filterPlaceholder,
  buttonClass,
  emptyText,
  autoPlace,
  panelClass,
}: ChipDropdownSnippetState): string {
  // The component sits at 6 spaces; its attributes and the trailing value line
  // at 8, matching the stage's inner pane.
  const componentIndent = '      '
  const attributeIndent = '        '
  const attributes = [
    // A custom label renders as a literal; unset, the trigger derives its
    // label from the committed value through the scope helper.
    ...(label
      ? [`${attributeIndent}label="${escapeAttr(label)}"`]
      : [`${attributeIndent}label={labelFor(options, value)}`]),
    `${attributeIndent}activeValue={value}`,
    `${attributeIndent}ariaLabel="${escapeAttr(ariaLabel)}"`,
    ...(variant ? [`${attributeIndent}variant="${variant}"`] : []),
    ...flagLine('filterable', filterable, attributeIndent),
    ...flagLine('disabled', disabled, attributeIndent),
    ...(align ? [`${attributeIndent}align="${align}"`] : []),
    ...textLine('filterPlaceholder', filterPlaceholder, attributeIndent),
    ...textLine('buttonClass', buttonClass, attributeIndent),
    ...textLine('emptyText', emptyText, attributeIndent),
    ...flagLine('autoPlace', autoPlace, attributeIndent),
    ...textLine('panelClass', panelClass, attributeIndent),
    `${attributeIndent}options={options}`,
    `${attributeIndent}onSelect={next => (value = next)} />`,
  ]
  return [
    '<script>',
    chipStageStateLine('  '),
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `  let value = $state(${JSON.stringify(value)})`,
    '</script>',
    ...chipStageOpenLines(''),
    `${componentIndent}<ChipDropdown`,
    ...attributes,
    `${componentIndent}<span class="text-sm text-slate-400">value: {value}</span>`,
    ...chipStageCloseLines(''),
  ].join('\n')
}
