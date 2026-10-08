import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import {
  buildColumnChooserSnippet,
  CHOOSER_LABEL,
  CHOOSER_RESET_LABEL,
  parseColumnsJson,
  parseColumnsValue,
  seedColumns,
  type ColumnChooserSnippetState,
} from './demo-snippet'

function state(overrides: Partial<ColumnChooserSnippetState> = {}): ColumnChooserSnippetState {
  return { label: '', resetLabel: '', columns: seedColumns(), ...overrides }
}

describe('buildColumnChooserSnippet', () => {
  it('seeds the column list as script-local state inside the resizable stage', () => {
    const source = buildColumnChooserSnippet(state())
    expect(source).toContain('<Resizable')
    expect(source).toContain('width={stageWidth}')
    expect(source).not.toContain('stageHeight')
    expect(source).toContain('let columns = $state([')
    expect(source).toContain('columns={columns}')
    expect(source).toContain('onToggle={handleToggleColumn}')
    expect(source).toContain('onReset={handleResetColumns}')
  })

  it('routes the default labels through scope', () => {
    const source = buildColumnChooserSnippet(state())
    expect(source).toContain('label={chooserLabel}')
    expect(source).toContain('resetLabel={resetLabel}')
    expect(source).not.toContain(CHOOSER_LABEL)
    expect(source).not.toContain(CHOOSER_RESET_LABEL)
  })

  it('bakes custom labels in as literals', () => {
    const source = buildColumnChooserSnippet(state({ label: 'Team columns', resetLabel: 'Show all' }))
    expect(source).toContain('label="Team columns"')
    expect(source).toContain('resetLabel="Show all"')
  })

  it('escapes quotes in a custom label', () => {
    const source = buildColumnChooserSnippet(state({ label: 'A "quoted" label' }))
    expect(source).toContain('label="A &quot;quoted&quot; label"')
  })

  it('seeds fresh checked entries per call', () => {
    const first = seedColumns()
    const second = seedColumns()
    expect(first).toEqual(second)
    expect(first).not.toBe(second)
    expect(first.every(column => column.checked)).toBe(true)
  })

  it('parses the columns editor draft', () => {
    expect(
      parseColumnsJson('[{"key": "id", "header": "ID"}, {"key": "name", "header": "Name", "checked": false}]'),
    ).toEqual([
      { key: 'id', header: 'ID', checked: true },
      { key: 'name', header: 'Name', checked: false },
    ])
    expect(parseColumnsJson('not json')).toBeNull()
    expect(parseColumnsJson('{"key": "id"}')).toBeNull()
    expect(parseColumnsJson('[42]')).toBeNull()
    expect(parseColumnsJson('[{"header": "ID"}]')).toBeNull()
    expect(parseColumnsJson('[{"key": "id", "header": "ID", "checked": "yes"}]')).toBeNull()
  })

  it('validates unknown data into chooser entries', () => {
    expect(parseColumnsValue([{ key: 'id', header: 'ID' }])).toEqual([{ key: 'id', header: 'ID', checked: true }])
    expect(parseColumnsValue('nope')).toBeNull()
  })

  it('compiles the generated stage snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildColumnChooserSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
