// Show-code source for the StructureTree demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The tree value is
// seeded as script-local state so the snippet is self-contained; node edits
// round-trip through the shared structure-value helpers, which the playground
// resolves from its module registry.

import { escapeAttr } from '$lib/showcase/snippet-build'
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export interface StructureTreeSnippetState {
  value: unknown
  editable: TriState
  editableOn: boolean
  containerRowClass: string
  containerRowClassOn: boolean
  leafRowClass: string
  leafRowClassOn: boolean
  size: string
  sizeOn: boolean
}

// Default tree contents, shared by the page and the snippet seed so the static
// demo, Show-code, and live render start from the same nodes.
export const DEFAULT_TREE_VALUE: Record<string, unknown> = {
  name: 'Ada Lovelace',
  role: 'Engineer',
  active: true,
  projects: 3,
  teams: ['Platform', 'Research'],
  address: { city: 'London', postcode: 'E1 6AN' },
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

// A class line: omitted unless the eye applies committed text.
function classLine(name: string, value: string, applied: boolean): string[] {
  if (!applied || value === '') {
    return []
  }
  return [`  ${name}="${escapeAttr(value)}"`]
}

// Parse a value-editor draft: any JSON document is a valid tree value. Returns
// undefined for unparseable text, so the dialog can block OK and the
// write-back can skip instead of applying half-shaped data.
export function parseTreeValueJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

// Read the script-local `let value = $state({...})` seed back into a JSON
// draft for the Value column. The shared extractor only matches array seeds,
// so object seeds need their own balanced scan here; returns null when the
// seed is absent or unparseable, so hand-written state the page did not author
// never syncs.
export function readTreeValueSeed(declarations: string): string | null {
  const head = /let\s+value\s*=\s*\$state\(\s*\{/.exec(declarations)
  if (!head || head.index === undefined) {
    return null
  }
  let depth = 0
  let openQuote: string | null = null
  let k = head.index + head[0].length - 1
  while (k < declarations.length) {
    const ch = declarations[k]!
    if (openQuote) {
      if (ch === '\\') {
        k += 2
        continue
      }
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
  const text = declarations.slice(head.index + head[0].length - 1, k + 1)
  try {
    return JSON.stringify(JSON.parse(text))
  } catch {
    return null
  }
}

export function buildStructureTreeSnippet({
  value,
  editable,
  editableOn,
  containerRowClass,
  containerRowClassOn,
  leafRowClass,
  leafRowClassOn,
  size,
  sizeOn,
}: StructureTreeSnippetState): string {
  return [
    '<script>',
    '  import { isContainer, renameKeyAtPath, setAtPath } from "ui/structure-value.ts";',
    `  let value = $state(${JSON.stringify(value ?? null)});`,
    '</script>',
    '<StructureTree',
    '  value={value}',
    '  onChange={(path, next) => { if (isContainer(value)) value = setAtPath(value, path, next); }}',
    '  onRenameKey={(parentPath, oldKey, newKey) => { if (isContainer(value)) value = renameKeyAtPath(value, parentPath, oldKey, newKey); }}',
    ...(editableOn ? flagLine('editable', editable, 'yes') : []),
    ...classLine('containerRowClass', containerRowClass, containerRowClassOn),
    ...classLine('leafRowClass', leafRowClass, leafRowClassOn),
    // The size prefills its `md` default in the Value column; the builder omits
    // the default so Show-code stays minimal.
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size) : []),
    '/>',
  ].join('\n')
}
