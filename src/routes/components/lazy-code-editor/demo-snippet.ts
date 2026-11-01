// Show-code source for the LazyCodeEditor demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above. Scope-driven
// lines stay symbolic; the curated form options are baked in as literals.
// Single-quoted lines throughout: backticks and ${} inside them stay literal,
// so no escaping.

// Curated playground option: unset or the component default renders the
// default, Yes/No force the value. Options start at the default, so the
// cleared form applies no overrides.
import { boolAttrLine, enumAttrLine, textAttrLine, type TriState } from '$showcase/playground/snippet-build'
import type { Staged } from '$showcase/playground/staged'

// The document types the wrapped editor loads a language pack for (see
// CodeEditor's LANGUAGE_LOADERS). Offering only these keeps every panel choice
// resolvable.
export type DocType = 'json' | 'javascript' | 'html' | 'markdown' | 'yaml' | 'xml'

export const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
]

// The language field starts unset; the cleared form returns to this baseline
// document type, shared by the page, the builder, and the snippet's scope so
// the static demo, Show-code, and live render agree.
export const DEFAULT_DOC_TYPE: DocType = 'markdown'

// Default document shown by the demo. The page seeds its bindable content from
// this and passes it to the snippet through scope, so the static demo and the
// live instance start from the same text.
export const DEFAULT_CONTENT = ['# Lazy editor', '', 'Language packs load on demand.'].join('\n')

export interface LazyCodeEditorSnippetState {
  docType: Staged<string>
  editable: Staged<TriState>
  containerClass: Staged<string>
  editorClass: Staged<string>
  maxContentLength: Staged<string>
  autoFocus: Staged<TriState>
  editorAriaLabel: Staged<string>
  recreateKey: Staged<string>
}

// A max-length line: omitted while the eye is off, unset, at the component
// default (`0` disables the cap), or non-numeric.
function maxLengthLine(pair: Staged<string>, indent: number, def = ''): string[] {
  if (!pair.on || pair.value === '' || pair.value === def) {
    return []
  }
  const parsed = Number(pair.value)
  return Number.isInteger(parsed) && parsed >= 0 ? [`${' '.repeat(indent)}maxContentLength={${parsed}}`] : []
}

export function buildLazyCodeEditorSnippet({ docType, editable, containerClass, editorClass, maxContentLength, autoFocus, editorAriaLabel, recreateKey }: LazyCodeEditorSnippetState): string {
  const resolvedDocType = docType.value || DEFAULT_DOC_TYPE
  return [
    '<div class="h-64 w-full max-w-xl">',
    '  <LazyCodeEditor',
    '    bind:content={content}',
    // The docType Value prefills the component default (`text`, which loads no
    // pack); the builder omits it so Show-code stays minimal, while unset
    // keeps the Markdown demo baseline.
    ...enumAttrLine('docType', { on: docType.on, value: resolvedDocType }, 'text', '    '),
    ...boolAttrLine('editable', editable, 'yes', '    '),
    ...textAttrLine('containerClass', containerClass, '    '),
    ...textAttrLine('editorClass', editorClass, '    '),
    ...maxLengthLine(maxContentLength, 4, '0'),
    ...boolAttrLine('autoFocus', autoFocus, 'no', '    '),
    ...textAttrLine('editorAriaLabel', editorAriaLabel, '    '),
    ...textAttrLine('recreateKey', recreateKey, '    '),
    '  />',
    '</div>',
  ].join('\n')
}
