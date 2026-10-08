// Show-code source for the TagInput demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The tag lists are
// seeded as script-local state (like the stage size) so the snippet is
// self-contained and its text tracks Value edits instead of hiding the lists
// in scope. The alternate palette stays a symbolic scope helper (`altPalette`).
//
// The demo sits in a width-only `Resizable` frame so narrow-container behavior
// can be inspected without resizing the window. The host is non-scrolling and
// the frame is bounded to it, so no scrollbar can appear over the frame
// handle. These literals are shared with the page and its tests so the
// rendered stage and the reviewed source stay identical.

export type TriState = '' | 'yes' | 'no'

export const TAG_STAGE_HOST = 'w-full overflow-hidden'
export const TAG_STAGE_PANE = 'flex w-full min-w-0 flex-wrap items-start gap-4'
export const TAG_STAGE_DEFAULT_WIDTH = 560
export const TAG_STAGE_MIN_WIDTH = 240

// The snippet's local size state, seeded to the default so the live stage
// matches the static demo before the first drag.
export function tagStageStateLine(indent: string): string {
  return `${indent}let stageWidth = $state(${TAG_STAGE_DEFAULT_WIDTH})`
}

export function tagStageOpenLines(indent: string): string[] {
  return [
    `${indent}<div class="${TAG_STAGE_HOST}">`,
    `${indent}  <Resizable`,
    `${indent}    width={stageWidth}`,
    `${indent}    minWidth={${TAG_STAGE_MIN_WIDTH}}`,
    `${indent}    maxWidth="parent"`,
    `${indent}    onResize={nextWidth => (stageWidth = nextWidth)}`,
    `${indent}  >`,
    `${indent}    <div class="${TAG_STAGE_PANE}">`,
  ]
}

export function tagStageCloseLines(indent: string): string[] {
  return [`${indent}    </div>`, `${indent}  </Resizable>`, `${indent}</div>`]
}

export interface TagInputSnippetState {
  value: string[]
  availableTags: string[]
  placeholder: string
  palette: string
  disabled: TriState
  inputId: string
  chipClass: string
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

// Validate unknown data into a tag list (every entry a string). Returns null
// for anything else, so the dialogs and parse-back apply only well-shaped
// lists.
export function parseTagListValue(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every(entry => typeof entry === 'string')) {
    return null
  }
  return [...value]
}

// Parse a tag-list editor draft (a JSON array of strings). Returns null for
// anything else, so the dialog can block OK and explain instead of applying
// half-shaped data.
export function parseTagListJson(text: string): string[] | null {
  try {
    return parseTagListValue(JSON.parse(text))
  } catch {
    return null
  }
}

export function buildTagInputSnippet({
  value,
  availableTags,
  placeholder,
  palette,
  disabled,
  inputId,
  chipClass,
}: TagInputSnippetState): string {
  // The component and the trailing readout sit at 6 spaces; attributes at 8,
  // matching the stage's inner pane. JSON.stringify keeps the seeded lists
  // valid no matter what the tags hold.
  const componentIndent = '      '
  const attributeIndent = '        '
  const seedList = (name: string, list: string[], mutable: boolean): string =>
    `  ${mutable ? 'let' : 'const'} ${name} = ${mutable ? '$state(' : ''}${JSON.stringify(list)}${mutable ? ')' : ''};`
  return [
    '<script>',
    tagStageStateLine('  '),
    seedList('value', value, true),
    seedList('availableTags', availableTags, false),
    '</script>',
    ...tagStageOpenLines(''),
    `${componentIndent}<TagInput`,
    `${attributeIndent}value={value}`,
    `${attributeIndent}availableTags={availableTags}`,
    `${attributeIndent}placeholder="${escapeAttr(placeholder || 'Add a tag')}"`,
    ...(palette ? [`${attributeIndent}palette={altPalette}`] : []),
    ...flagLine('disabled', disabled, attributeIndent),
    ...textLine('inputId', inputId, attributeIndent),
    ...textLine('chipClass', chipClass, attributeIndent),
    `${attributeIndent}onChange={next => (value = next)} />`,
    `${componentIndent}<span class="text-sm text-slate-400">tags: {value.join(', ')}</span>`,
    ...tagStageCloseLines(''),
  ].join('\n')
}
