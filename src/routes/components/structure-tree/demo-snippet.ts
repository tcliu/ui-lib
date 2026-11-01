// Show-code source for the StructureTree demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The tree value is
// seeded as script-local state so the snippet is self-contained; node edits
// round-trip through the shared structure-value helpers, which the playground
// resolves from its module registry.

import { extractScriptConst } from '$showcase/playground/snippet-attributes'
import { boolAttrLine, sizeAttrLine, textAttrLine, type TriState } from '$showcase/playground/snippet-build'
import type { Staged } from '$showcase/playground/staged'

export interface StructureTreeSnippetState {
  value: Staged<unknown>
  editable: Staged<TriState>
  containerRowClass: Staged<string>
  leafRowClass: Staged<string>
  size: Staged<string>
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
// draft for the Value column, reusing the shared object-seed scan; returns
// null when the seed is absent or unparseable, so hand-written state the page
// did not author never syncs.
export function readTreeValueSeed(declarations: string): string | null {
  const value = extractScriptConst(declarations, 'value', '{')
  return value === null ? null : JSON.stringify(value)
}

export function buildStructureTreeSnippet({
  value,
  editable,
  containerRowClass,
  leafRowClass,
  size,
}: StructureTreeSnippetState): string {
  return [
    '<script>',
    '  import { isContainer, renameKeyAtPath, setAtPath } from "ui/structure-value.ts";',
    `  let value = $state(${JSON.stringify(value.value ?? null)});`,
    '</script>',
    '<StructureTree',
    '  value={value}',
    '  onChange={(path, next) => { if (isContainer(value)) value = setAtPath(value, path, next); }}',
    '  onRenameKey={(parentPath, oldKey, newKey) => { if (isContainer(value)) value = renameKeyAtPath(value, parentPath, oldKey, newKey); }}',
    ...boolAttrLine('editable', editable, 'yes'),
    ...textAttrLine('containerRowClass', containerRowClass),
    ...textAttrLine('leafRowClass', leafRowClass),
    // The size prefills its `md` default in the Value column; the builder omits
    // the default so Show-code stays minimal.
    ...sizeAttrLine(size),
    '/>',
  ].join('\n')
}
