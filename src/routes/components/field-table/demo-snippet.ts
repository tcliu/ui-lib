// Show-code source for the FieldTable demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
//
// The demo documents FieldTable with itself: editable sample fields plus a
// read-only function row, with the five header labels overridable. An unset
// header key reads its localized label from scope (like the demo); a
// customized key renders as a literal.

import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

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
  propHeader: string
  typeHeader: string
  defaultHeader: string
  valueHeader: string
  noteHeader: string
  // The headers object applies only while its eye toggle is on, mirroring the
  // page (off omits the object, so each column keeps its default label).
  headersEnabled: boolean
  tableSize: string
  tableSizeOn: boolean
}

// A `headers` object entry: a scope ref while unset (the demo's localized
// label), a JS string literal once customized.
function headerEntry(key: string, value: string, scopeRef: string): string {
  return value ? `    ${key}: ${JSON.stringify(value)},` : `    ${key}: ${scopeRef},`
}

export function buildFieldTableSnippet({
  name,
  role,
  size,
  active,
  notes,
  propHeader,
  typeHeader,
  defaultHeader,
  valueHeader,
  noteHeader,
  headersEnabled,
  tableSize,
  tableSizeOn,
}: FieldTableSnippetState): string {
  return [
    '<script>',
    `  let name = $state(${JSON.stringify(name)})`,
    `  let role = $state(${JSON.stringify(role)})`,
    `  let size = $state(${JSON.stringify(size)})`,
    `  let active = $state(${JSON.stringify(active)})`,
    `  let notes = $state(${JSON.stringify(notes)})`,
    '</script>',
    '<FieldTable',
    '  fields={[',
    "    { name: 'name', type: 'string', defaultValue: \"''\", note: 'Display name.', editor: 'text', value: name, onChange: value => (name = value), placeholder: '(empty)' },",
    "    { name: 'role', type: \"'admin' | 'editor' | 'viewer'\", defaultValue: \"'viewer'\", note: 'Access level.', editor: 'enum', options: [{ value: 'admin', label: 'admin' }, { value: 'editor', label: 'editor' }, { value: 'viewer', label: 'viewer' }], value: role, onChange: value => (role = value), clearLabel: 'Clear role' },",
    "    { name: 'size', type: \"'xs' | 'sm' | 'md' | 'lg' | 'xl' | number\", defaultValue: \"'md'\", note: 'Control scale.', editor: 'size', allowCustomValue: true, value: size, onChange: value => (size = value), clearLabel: 'Clear size' },",
    "    { name: 'active', type: 'boolean', defaultValue: 'false', note: 'Whether the account is active.', editor: 'boolean', value: active, onChange: value => (active = value) },",
    "    { name: 'notes', type: 'string', defaultValue: \"''\", note: 'Long text edited in a code dialog.', editor: 'snippet', value: notes, onChange: value => (notes = value) },",
    "    { name: 'onSave', type: '() => void', defaultValue: '\u2014', note: 'Save handler.' },",
    '  ]}',
    // The table size prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(tableSizeOn && tableSize !== '' && tableSize !== 'md' ? sizeAttributeLine(tableSize, '  ') : []),
    ...(headersEnabled
      ? [
          '  headers={{',
          headerEntry('prop', propHeader, 'propText'),
          headerEntry('type', typeHeader, 'typeText'),
          headerEntry('default', defaultHeader, 'defaultText'),
          headerEntry('value', valueHeader, 'valueText'),
          headerEntry('note', noteHeader, 'noteText'),
          '  }}',
        ]
      : []),
    '/>',
  ].join('\n')
}
