// Show-code source for the LazyCodeEditor demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above. Scope-driven
// lines stay symbolic; the curated form options are baked in as literals.
// Single-quoted lines throughout: backticks and ${} inside them stay literal,
// so no escaping.

// Curated playground option: unset or the component default renders the
// default, Yes/No force the value. Options start at the default, so the
// cleared form applies no overrides.
import { escapeAttr } from '$showcase/snippet-build'

export type TriState = '' | 'yes' | 'no'

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
  docType: string
  docTypeOn: boolean
  editable: TriState
  editableOn: boolean
  containerClass: string
  containerClassOn: boolean
  editorClass: string
  editorClassOn: boolean
  maxContentLength: string
  maxContentLengthOn: boolean
  autoFocus: TriState
  autoFocusOn: boolean
  editorAriaLabel: string
  editorAriaLabelOn: boolean
  recreateKey: string
  recreateKeyOn: boolean
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: number, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`${' '.repeat(indent)}${name}${value === 'yes' ? '' : '={false}'}`]
}

// A max-length line: omitted while unset, at the component default (`0`
// disables the cap), or non-numeric.
function maxLengthLine(value: string, indent: number, def = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? [`${' '.repeat(indent)}maxContentLength={${parsed}}`] : []
}

export function buildLazyCodeEditorSnippet({ docType, docTypeOn, editable, editableOn, containerClass, containerClassOn, editorClass, editorClassOn, maxContentLength, maxContentLengthOn, autoFocus, autoFocusOn, editorAriaLabel, editorAriaLabelOn, recreateKey, recreateKeyOn }: LazyCodeEditorSnippetState): string {
  const resolvedDocType = docType || DEFAULT_DOC_TYPE
  return [
    '<div class="h-64 w-full max-w-xl">',
    '  <LazyCodeEditor',
    '    bind:content={content}',
    // The docType Value prefills the component default (`text`, which loads no
    // pack); the builder omits it so Show-code stays minimal, while unset
    // keeps the Markdown demo baseline.
    ...(docTypeOn && resolvedDocType !== 'text' ? [`    docType="${resolvedDocType}"`] : []),
    ...(editableOn ? flagLine('editable', editable, 4, 'yes') : []),
    ...(containerClassOn && containerClass ? [`    containerClass="${escapeAttr(containerClass)}"`] : []),
    ...(editorClassOn && editorClass ? [`    editorClass="${escapeAttr(editorClass)}"`] : []),
    ...(maxContentLengthOn ? maxLengthLine(maxContentLength, 4, '0') : []),
    ...(autoFocusOn ? flagLine('autoFocus', autoFocus, 4, 'no') : []),
    ...(editorAriaLabelOn && editorAriaLabel ? [`    editorAriaLabel="${escapeAttr(editorAriaLabel)}"`] : []),
    ...(recreateKeyOn && recreateKey ? [`    recreateKey="${escapeAttr(recreateKey)}"`] : []),
    '  />',
    '</div>',
  ].join('\n')
}
