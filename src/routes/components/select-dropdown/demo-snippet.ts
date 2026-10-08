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
import type { SelectOption } from '$lib/components/SelectDropdown.svelte'

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

// Parse the options editor draft: a JSON array of bare strings or
// `{ value, label? }` objects. Returns null for anything else (unparseable
// text, a non-array, or an entry without a string value), so the dialog can
// block OK and explain instead of applying half-shaped data.
export function parseSelectOptionsJson(text: string): SelectOption[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) {
    return null
  }
  const out: SelectOption[] = []
  for (const entry of parsed) {
    if (typeof entry === 'string') {
      out.push(entry)
      continue
    }
    if (typeof entry !== 'object' || entry === null || typeof entry.value !== 'string') {
      return null
    }
    if (entry.label !== undefined && typeof entry.label !== 'string') {
      return null
    }
    out.push(entry.label === undefined ? { value: entry.value } : { value: entry.value, label: entry.label })
  }
  return out
}

export type SnippetAttribute =
  { kind: 'string'; value: string } | { kind: 'expression'; value: string } | { kind: 'bare' }

// Extract the first `<SelectDropdown ... />` tag's attributes from snippet
// source, so a compiled edit can write recognized values back into playground
// state. Returns null when no complete tag exists (a custom experiment the
// page must leave alone). The scan tracks quote/brace depth, so `=>` inside an
// expression never ends the tag early; anything the extractor does not model
// (spreads, directives) also bails out rather than syncing a partial picture.
export function extractSelectDropdownAttributes(source: string): Map<string, SnippetAttribute> | null {
  const tag = '<SelectDropdown'
  const start = source.indexOf(tag)
  if (start < 0) {
    return null
  }
  const attrs = new Map<string, SnippetAttribute>()
  const isWs = (ch: string): boolean => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'
  let i = start + tag.length
  while (i < source.length) {
    while (i < source.length && isWs(source[i]!)) {
      i += 1
    }
    if (source.startsWith('/>', i) || source[i] === '>') {
      return attrs
    }
    const name = /^[A-Za-z][A-Za-z0-9$]*/.exec(source.slice(i))?.[0]
    if (!name) {
      return null
    }
    i += name.length
    let j = i
    while (j < source.length && isWs(source[j]!)) {
      j += 1
    }
    if (source[j] !== '=') {
      // A bare attribute; the loop validates whatever follows.
      attrs.set(name, { kind: 'bare' })
      i = j
      continue
    }
    i = j + 1
    while (i < source.length && isWs(source[i]!)) {
      i += 1
    }
    const quote = source[i]
    if (quote === '"' || quote === "'") {
      let end = i + 1
      while (end < source.length && (source[end] !== quote || source[end - 1] === '\\')) {
        end += 1
      }
      if (end >= source.length) {
        return null
      }
      attrs.set(name, { kind: 'string', value: source.slice(i + 1, end) })
      i = end + 1
      continue
    }
    if (source[i] === '{') {
      let depth = 0
      let k = i
      let openQuote: string | null = null
      while (k < source.length) {
        const ch = source[k]!
        if (openQuote) {
          if (ch === openQuote) {
            openQuote = null
          }
        } else if (ch === '"' || ch === "'") {
          openQuote = ch
        } else if (ch === '{') {
          depth += 1
        } else if (ch === '}') {
          depth -= 1
          if (depth === 0) {
            break
          }
        }
        k += 1
      }
      if (depth !== 0) {
        return null
      }
      attrs.set(name, { kind: 'expression', value: source.slice(i + 1, k).trim() })
      i = k + 1
      continue
    }
    return null
  }
  return null
}

// Read a script-local `let value = $state("...")` back out of snippet
// declarations (the shape the builder emits below, via JSON.stringify).
// Returns null when absent or unparseable, so hand-written state the page did
// not author never syncs.
export function extractScriptValue(declarations: string): string | null {
  const match = /let\s+value\s*=\s*\$state\(\s*("(?:[^"\\]|\\.)*")\s*\)/.exec(declarations)
  if (!match) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(match[1]!)
    return typeof parsed === 'string' ? parsed : null
  } catch {
    return null
  }
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
