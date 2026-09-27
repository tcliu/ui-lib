// Show-code source for the LazyCodeEditor demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above. Scope-driven
// lines stay symbolic; the curated form options are baked in as literals.
// Single-quoted lines throughout: backticks and ${} inside them stay literal,
// so no escaping.

// Curated playground option: unset renders the component default, Yes/No force
// the value. Every option starts unset, so the cleared form applies no
// overrides.
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
  editable: TriState
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: number): string[] {
  if (value === '') {
    return []
  }
  return [`${' '.repeat(indent)}${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildLazyCodeEditorSnippet({ docType, editable }: LazyCodeEditorSnippetState): string {
  const resolvedDocType = docType || DEFAULT_DOC_TYPE
  return [
    '<div class="h-64 w-full max-w-xl">',
    '  <LazyCodeEditor',
    '    bind:content={content}',
    `    docType="${resolvedDocType}"`,
    ...flagLine('editable', editable, 4),
    '    containerClass="h-full overflow-hidden rounded-md border border-slate-700 bg-slate-950"',
    '    editorClass="h-full"',
    '  />',
    '</div>',
  ].join('\n')
}
