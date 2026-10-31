import { describe, expect, it } from 'vitest'
import { extractScriptValue } from '$showcase/snippet-attributes'
import { createSnippetComponent } from '$showcase/snippet-playground'
import { splitLeadingScript } from '$showcase/snippet-source'
import { staged } from '$showcase/staged'
import {
  buildFieldTableSnippet,
  FIELD_TABLE_DEMO_ROWS,
  parseHeadersJson,
  parseHeadersValue,
  type FieldTableHeaderLabels,
  type FieldTableSnippetState,
} from './demo-snippet'

// A headers pair with every key unset unless the case customizes it; the eye
// starts on, matching the cleared form's applied overrides.
function headerPair(overrides: Partial<FieldTableHeaderLabels> = {}, on = true) {
  return staged({ prop: '', type: '', default: '', value: '', note: '', ...overrides }, on)
}

function state(overrides: Partial<FieldTableSnippetState> = {}): FieldTableSnippetState {
  return {
    name: '',
    role: '',
    size: '',
    active: '',
    notes: '',
    headers: headerPair(),
    tableSize: staged('', true),
    ...overrides,
  }
}

const scope = {
  propText: 'Prop',
  typeText: 'Type',
  defaultText: 'Default',
  valueText: 'Value',
  noteText: 'Notes',
}

describe('buildFieldTableSnippet', () => {
  it('reads unset header keys from scope and seeds demo state in a script', () => {
    const source = buildFieldTableSnippet(state())
    expect(source).toContain('<FieldTable')
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).toContain('  headers={{')
    expect(source).toContain('    prop: propText,')
    expect(source).toContain('    type: typeText,')
    expect(source).toContain('    default: defaultText,')
    expect(source).toContain('    value: valueText,')
    expect(source).toContain('    note: noteText,')
    expect(source).toContain('editor: \'text\'')
    expect(source).toContain('editor: \'enum\'')
    expect(source).toContain('editor: \'boolean\'')
    expect(source).toContain('editor: \'snippet\'')
    expect(extractScriptValue(splitLeadingScript(source).declarations, 'name')).toBe('')
    expect(extractScriptValue(splitLeadingScript(source).declarations, 'notes')).toBe('')
  })

  it('emits the shared demo row facets the static demo renders', () => {
    const source = buildFieldTableSnippet(state())
    expect(source).not.toContain('(empty)')
    expect(source).toContain("editorDefaultValue: '',")
    expect(source).toContain('clearable: true')
    expect(source).toContain("placeholder: 'viewer'")
    expect(source).toContain("placeholder: 'md'")
    expect(source).toContain('toggle: { enabled: notesEnabled,')
    expect(source).toContain('let notesEnabled = $state(true)')
    for (const row of FIELD_TABLE_DEMO_ROWS) {
      expect(source).toContain(`name: '${row.name}'`)
      expect(source).toContain(`note: '${row.note}'`)
    }
    expect(FIELD_TABLE_DEMO_ROWS.find(row => row.name === 'notes')?.toggle).toBe(true)
  })

  it('emits customized header keys as literals and seeds demo values', () => {
    const source = buildFieldTableSnippet(state({ name: 'Ada', role: 'admin', headers: headerPair({ prop: 'Field' }) }))
    expect(source).toContain('let name = $state("Ada")')
    expect(source).toContain('let role = $state("admin")')
    expect(source).toContain('    prop: "Field",')
    expect(source).not.toContain('prop: propText')
    expect(source).toContain('    type: typeText,')
  })

  it('escapes quotes in header literals', () => {
    const source = buildFieldTableSnippet(state({ headers: headerPair({ prop: 'Say "hi"' }) }))
    expect(source).toContain('    prop: "Say \\"hi\\"",')
  })

  it('omits the headers object while its eye toggle is off', () => {
    const source = buildFieldTableSnippet(state({ headers: headerPair({ prop: 'Field' }, false) }))
    expect(source).not.toContain('headers={{')
    expect(source).toContain('<FieldTable')
  })

  it('emits the table size as a string or an expression', () => {
    expect(buildFieldTableSnippet(state({ tableSize: staged('lg', true) }))).toContain('  size="lg"')
    expect(buildFieldTableSnippet(state({ tableSize: staged('14', true) }))).toContain('  size={14}')
    expect(buildFieldTableSnippet(state({ tableSize: staged('huge', true) }))).not.toMatch(/^\s*size=/m)
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildFieldTableSnippet(state({ tableSize: staged('md', true) }))
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('omits the staged table size while its eye is off', () => {
    expect(buildFieldTableSnippet(state({ tableSize: staged('lg') }))).not.toMatch(/^\s*size=/m)
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildFieldTableSnippet(state({ name: 'Ada' })), scope)
    expect(typeof component).toBe('function')
  })
})

describe('parseHeadersValue', () => {
  it('accepts exactly the five label keys with string values', () => {
    expect(
      parseHeadersValue({ prop: 'Field', type: 'Kind', default: 'Fallback', value: 'Entry', note: 'Remarks' }),
    ).toEqual({ prop: 'Field', type: 'Kind', default: 'Fallback', value: 'Entry', note: 'Remarks' })
  })

  it('rejects non-objects, missing keys, extra keys, and non-strings', () => {
    expect(parseHeadersValue(null)).toBeNull()
    expect(parseHeadersValue([])).toBeNull()
    expect(parseHeadersValue({ prop: 'Field' })).toBeNull()
    expect(
      parseHeadersValue({ prop: 'a', type: 'b', default: 'c', value: 'd', note: 'e', extra: 'f' }),
    ).toBeNull()
    expect(
      parseHeadersValue({ prop: 'a', type: 'b', default: 'c', value: 'd', note: 42 }),
    ).toBeNull()
  })
})

describe('parseHeadersJson', () => {
  it('parses a fully customized headers object', () => {
    expect(
      parseHeadersJson('{"prop":"Field","type":"Kind","default":"Fallback","value":"Entry","note":"Remarks"}'),
    ).toEqual({ prop: 'Field', type: 'Kind', default: 'Fallback', value: 'Entry', note: 'Remarks' })
  })

  it('rejects unparseable text and shapes the dialog cannot reproduce', () => {
    expect(parseHeadersJson('nope')).toBeNull()
    expect(parseHeadersJson('["prop"]')).toBeNull()
    expect(parseHeadersJson('{"prop":"Field"}')).toBeNull()
    // Empty strings render as scope refs, not literals, so the dialog blocks
    // them instead of applying data a reseed cannot reproduce exactly.
    expect(
      parseHeadersJson('{"prop":"","type":"Kind","default":"Fallback","value":"Entry","note":"Remarks"}'),
    ).toBeNull()
  })
})
