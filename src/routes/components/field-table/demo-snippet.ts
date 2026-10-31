// Show-code source for the FieldTable demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
//
// The demo documents FieldTable with itself: editable sample fields plus a
// read-only function row, with the five header labels overridable. An unset
// header key reads its localized label from scope (like the demo); a
// customized key renders as a literal.

import type { FieldEditor, FieldOption } from '$lib/components/FieldTable.svelte'
import { sizeAttrLine, type TriState } from '$showcase/snippet-build'
import type { Staged } from '$showcase/staged'

// One sample field's data-only facets, shared by the static demo and the
// Show-code builder so the two can never drift. Each consumer supplies only
// its own live `value`/`onChange` pair (and the page its eye type).
export interface FieldTableDemoRow {
  name: string
  type: string
  defaultValue: string
  editorDefaultValue?: string
  note: string
  editor?: FieldEditor
  clearable?: boolean
  placeholder?: string
  clearLabel?: string
  options?: FieldOption[]
  allowCustomValue?: boolean
  // The row renders a reset eye (the notes sample); the two consumers bind it
  // to their own state.
  toggle?: boolean
}

export const FIELD_TABLE_DEMO_ROWS: FieldTableDemoRow[] = [
  {
    name: 'name',
    type: 'string',
    defaultValue: "''",
    editorDefaultValue: '',
    note: 'Display name.',
    editor: 'text',
    clearable: true,
  },
  {
    name: 'role',
    type: "'admin' | 'editor' | 'viewer'",
    defaultValue: "'viewer'",
    note: 'Access level.',
    editor: 'enum',
    options: [
      { value: 'admin', label: 'admin' },
      { value: 'editor', label: 'editor' },
      { value: 'viewer', label: 'viewer' },
    ],
    placeholder: 'viewer',
    clearLabel: 'Clear role',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number",
    defaultValue: "'md'",
    note: 'Control scale.',
    editor: 'size',
    allowCustomValue: true,
    placeholder: 'md',
    clearLabel: 'Clear size',
  },
  {
    name: 'active',
    type: 'boolean',
    defaultValue: 'false',
    note: 'Whether the account is active.',
    editor: 'boolean',
  },
  {
    name: 'notes',
    type: 'string',
    defaultValue: "''",
    note: 'Long text edited in a code dialog; the eye resets the text.',
    editor: 'snippet',
    toggle: true,
  },
  { name: 'onSave', type: '() => void', defaultValue: '—', note: 'Save handler.' },
]

// Column labels edited through the `headers` JSON dialog: plain data only
// (no functions). Empty strings never survive the dialog (the builder would
// render them as scope refs, so the draft would not round-trip); they only
// appear through snippet write-backs, where a scope ref means unset.
export interface FieldTableHeaderLabels {
  prop: string
  type: string
  default: string
  value: string
  note: string
}

export const HEADER_KEYS = ['prop', 'type', 'default', 'value', 'note'] as const

// Validate unknown data into header labels: exactly the five known keys with
// string values. Returns null for anything else, so the dialog and parse-back
// apply only well-shaped objects.
export function parseHeadersValue(value: unknown): FieldTableHeaderLabels | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const record = value as Record<string, unknown>
  if (Object.keys(record).length !== HEADER_KEYS.length) {
    return null
  }
  for (const key of HEADER_KEYS) {
    if (typeof record[key] !== 'string') {
      return null
    }
  }
  return {
    prop: record.prop as string,
    type: record.type as string,
    default: record.default as string,
    value: record.value as string,
    note: record.note as string,
  }
}

// Parse a headers editor draft (a JSON object with the five label keys).
// Returns null for anything else — including empty strings, which the builder
// renders as scope refs rather than literals — so the dialog blocks OK and
// explains instead of applying data the row cannot reproduce exactly.
export function parseHeadersJson(text: string): FieldTableHeaderLabels | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  const value = parseHeadersValue(parsed)
  if (!value || !value.prop || !value.type || !value.default || !value.value || !value.note) {
    return null
  }
  return value
}

export interface FieldTableSnippetState {
  name: string
  role: string
  size: string
  active: TriState
  notes: string
  // The headers object applies only while its eye toggle is on, mirroring the
  // page (off omits the object, so each column keeps its default label).
  headers: Staged<FieldTableHeaderLabels>
  tableSize: Staged<string>
}

// A `headers` object entry: a scope ref while unset (the demo's localized
// label), a JS string literal once customized.
function headerEntry(key: string, value: string, scopeRef: string): string {
  return value ? `    ${key}: ${JSON.stringify(value)},` : `    ${key}: ${scopeRef},`
}

interface RowBinding {
  value: string
  onChange: string
}

// The live state behind each sample row's Value cell, as snippet expressions.
const ROW_BINDINGS: Record<string, RowBinding> = {
  name: { value: 'name', onChange: 'value => (name = value)' },
  role: { value: 'role', onChange: 'value => (role = value)' },
  size: { value: 'size', onChange: 'value => (size = value)' },
  active: { value: 'active', onChange: 'value => (active = value)' },
  notes: { value: 'notes', onChange: 'value => { notes = value; notesEnabled = true }' },
}

// A source-level string literal: single-quoted unless the text itself carries
// a quote (a union type like `'admin' | 'editor'`), which JSON quotes instead.
function quote(text: string): string {
  return text.includes("'") ? JSON.stringify(text) : `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function optionsSource(options: FieldOption[]): string {
  const entries = options.map(option => `{ value: ${quote(option.value)}, label: ${quote(option.label)} }`)
  return `[${entries.join(', ')}]`
}

// One inline `FieldConfig` literal from a shared row description: the static
// facets plus the row's own state binding.
function rowSource(row: FieldTableDemoRow): string {
  const binding = ROW_BINDINGS[row.name]
  const facets = [
    `name: ${quote(row.name)}`,
    `type: ${quote(row.type)}`,
    `defaultValue: ${quote(row.defaultValue)}`,
    ...(row.editorDefaultValue !== undefined ? [`editorDefaultValue: ${quote(row.editorDefaultValue)}`] : []),
    `note: ${quote(row.note)}`,
    ...(row.editor ? [`editor: ${quote(row.editor)}`] : []),
    ...(row.clearable ? ['clearable: true'] : []),
    ...(row.placeholder ? [`placeholder: ${quote(row.placeholder)}`] : []),
    ...(row.clearLabel ? [`clearLabel: ${quote(row.clearLabel)}`] : []),
    ...(row.options ? [`options: ${optionsSource(row.options)}`] : []),
    ...(row.allowCustomValue ? ['allowCustomValue: true'] : []),
    ...(binding ? [`value: ${binding.value}`, `onChange: ${binding.onChange}`] : []),
    ...(row.toggle
      ? [`toggle: { enabled: notesEnabled, onToggle: enabled => { notesEnabled = enabled; if (!enabled) notes = '' } }`]
      : []),
  ]
  return `    { ${facets.join(', ')} },`
}

export function buildFieldTableSnippet({
  name,
  role,
  size,
  active,
  notes,
  headers,
  tableSize,
}: FieldTableSnippetState): string {
  return [
    '<script>',
    `  let name = $state(${JSON.stringify(name)})`,
    `  let role = $state(${JSON.stringify(role)})`,
    `  let size = $state(${JSON.stringify(size)})`,
    `  let active = $state(${JSON.stringify(active)})`,
    `  let notes = $state(${JSON.stringify(notes)})`,
    '  let notesEnabled = $state(true)',
    '</script>',
    '<FieldTable',
    '  fields={[',
    ...FIELD_TABLE_DEMO_ROWS.map(rowSource),
    '  ]}',
    // The table size prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...sizeAttrLine(tableSize, '  '),
    ...(headers.on
      ? [
          '  headers={{',
          headerEntry('prop', headers.value.prop, 'propText'),
          headerEntry('type', headers.value.type, 'typeText'),
          headerEntry('default', headers.value.default, 'defaultText'),
          headerEntry('value', headers.value.value, 'valueText'),
          headerEntry('note', headers.value.note, 'noteText'),
          '  }}',
        ]
      : []),
    '/>',
  ].join('\n')
}
