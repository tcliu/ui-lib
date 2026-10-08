// Show-code source for the SelectDropdown demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
//
// The demo sits in a `Resizable` frame (like the other container-sensitive
// demos) so the trigger panel's placement can be inspected as the container
// narrows. The host is non-scrolling and the frame is bounded to it, so no
// scrollbar can appear over the frame handles. These literals are shared with
// the page and its tests so the rendered stage and the reviewed source stay
// identical.
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export const SELECT_STAGE_HOST = 'w-full overflow-hidden'
export const SELECT_STAGE_PANE = 'flex w-full min-w-0 flex-wrap items-start gap-4'
export const SELECT_STAGE_DEFAULT_WIDTH = 560
export const SELECT_STAGE_MIN_WIDTH = 240

// The snippet's local size state, seeded to the default so the live stage
// matches the static demo before the first drag.
export function selectStageStateLine(indent: string): string {
  return `${indent}let stageWidth = $state(${SELECT_STAGE_DEFAULT_WIDTH})`
}

export function selectStageOpenLines(indent: string): string[] {
  return [
    `${indent}<div class="${SELECT_STAGE_HOST}">`,
    `${indent}  <Resizable`,
    `${indent}    width={stageWidth}`,
    `${indent}    minWidth={${SELECT_STAGE_MIN_WIDTH}}`,
    `${indent}    maxWidth="parent"`,
    `${indent}    onResize={nextWidth => (stageWidth = nextWidth)}`,
    `${indent}  >`,
    `${indent}    <div class="${SELECT_STAGE_PANE}">`,
  ]
}

export function selectStageCloseLines(indent: string): string[] {
  return [`${indent}    </div>`, `${indent}  </Resizable>`, `${indent}</div>`]
}

export interface SelectDropdownSnippetState {
  ariaLabel: string
  buttonLabel: string
  // Committed value, seeded as script-local state (like the stage size) so the
  // snippet text tracks activeValue edits instead of hiding the value in scope.
  value: string
  size: string
  filterable: TriState
  allowCustomValue: TriState
  buttonClass: string
  controlClass: string
  optionClass: string
  emptyLabel: string
  clearable: TriState
  clearLabel: string
  align: string
  autoPlace: TriState
  panelClass: string
}

// Option-JSON parsing, tag-attribute extraction, and script-value reads live in
// the shared showcase modules (`option-json.ts`, `snippet-attributes.ts`) so
// sibling demos reuse them; this builder only emits source.

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: string): string[] {
  if (value === '') {
    return []
  }
  return [`${indent}${name}${value === 'yes' ? '' : '={false}'}`]
}

// A string attribute line, omitted while unset.
function textLine(name: string, value: string, indent: string): string[] {
  return value ? [`${indent}${name}="${value}"`] : []
}

export function buildSelectDropdownSnippet({
  ariaLabel,
  buttonLabel,
  value,
  size,
  filterable,
  allowCustomValue,
  buttonClass,
  controlClass,
  optionClass,
  emptyLabel,
  clearable,
  clearLabel,
  align,
  autoPlace,
  panelClass,
}: SelectDropdownSnippetState): string {
  // The component sits at 6 spaces; its attributes and the trailing value line
  // at 8, matching the stage's inner pane.
  const componentIndent = '      '
  const attributeIndent = '        '
  const attributes = [
    // A custom label renders as a literal; unset, the trigger derives its
    // label from the committed value, so no line is emitted.
    ...(buttonLabel ? [`${attributeIndent}buttonLabel="${buttonLabel}"`] : []),
    `${attributeIndent}activeValue={value}`,
    `${attributeIndent}ariaLabel="${ariaLabel}"`,
    ...sizeAttributeLine(size, attributeIndent),
    ...flagLine('filterable', filterable, attributeIndent),
    ...flagLine('allowCustomValue', allowCustomValue, attributeIndent),
    ...textLine('buttonClass', buttonClass, attributeIndent),
    ...textLine('controlClass', controlClass, attributeIndent),
    ...textLine('optionClass', optionClass, attributeIndent),
    ...textLine('emptyLabel', emptyLabel, attributeIndent),
    ...flagLine('clearable', clearable, attributeIndent),
    ...textLine('clearLabel', clearLabel, attributeIndent),
    ...textLine('align', align, attributeIndent),
    ...flagLine('autoPlace', autoPlace, attributeIndent),
    ...textLine('panelClass', panelClass, attributeIndent),
    `${attributeIndent}options={options}`,
    `${attributeIndent}onSelect={next => (value = next)} />`,
  ]
  return [
    '<script>',
    selectStageStateLine('  '),
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `  let value = $state(${JSON.stringify(value)})`,
    '</script>',
    ...selectStageOpenLines(''),
    `${componentIndent}<SelectDropdown`,
    ...attributes,
    `${componentIndent}<span class="text-sm text-slate-400">value: {value}</span>`,
    ...selectStageCloseLines(''),
  ].join('\n')
}
