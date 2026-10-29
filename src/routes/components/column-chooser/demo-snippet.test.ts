import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$showcase/snippet-playground'
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
  return { triggerLabel: '', triggerLabelOn: true, resetAriaLabel: '', resetAriaLabelOn: true, columns: seedColumns(), size: '', sizeOn: true, ...overrides }
}

describe('buildColumnChooserSnippet', () => {
  it('emits content-only markup and omits unset overrides', () => {
    const source = buildColumnChooserSnippet(state())
    // The resize harness is ShowcasePage-owned chrome, never in the snippet.
    expect(source).not.toContain('<Resizable')
    expect(source).not.toContain('stageWidth')
    expect(source).toContain('let columns = $state([')
    expect(source).toContain('columns={columns}')
    expect(source).toContain('onToggle={handleToggleColumn}')
    expect(source).toContain('onReset={handleResetColumns}')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('routes the default labels through scope', () => {
    const source = buildColumnChooserSnippet(state())
    expect(source).toContain('triggerLabel={chooserLabel}')
    expect(source).toContain('resetAriaLabel={resetLabel}')
    expect(source).not.toContain(CHOOSER_LABEL)
    expect(source).not.toContain(CHOOSER_RESET_LABEL)
  })

  it('bakes custom labels in as literals', () => {
    const source = buildColumnChooserSnippet(state({ triggerLabel: 'Team columns', resetAriaLabel: 'Show all' }))
    expect(source).toContain('triggerLabel="Team columns"')
    expect(source).toContain('resetAriaLabel="Show all"')
  })

  it('omits staged labels while their eye is off', () => {
    const source = buildColumnChooserSnippet(
      state({ triggerLabel: 'Team columns', triggerLabelOn: false, resetAriaLabel: 'Show all', resetAriaLabelOn: false }),
    )
    expect(source).toContain('triggerLabel={chooserLabel}')
    expect(source).toContain('resetAriaLabel={resetLabel}')
    expect(source).not.toContain('Team columns')
    expect(source).not.toContain('Show all')
  })
  it('escapes quotes in a custom label', () => {
    const source = buildColumnChooserSnippet(state({ triggerLabel: 'A "quoted" label' }))
    expect(source).toContain('triggerLabel="A &quot;quoted&quot; label"')
  })

  it('emits a named size as a string and a numeric size as an expression', () => {
    expect(buildColumnChooserSnippet(state({ size: 'lg', sizeOn: true }))).toContain('size="lg"')
    expect(buildColumnChooserSnippet(state({ size: '14', sizeOn: true }))).toContain('size={14}')
    expect(buildColumnChooserSnippet(state({ size: 'huge', sizeOn: true }))).not.toMatch(/^\s*size=/m)
  })

  it('omits the component size default (the Value column prefills it)', () => {
    expect(buildColumnChooserSnippet(state({ size: 'md', sizeOn: true }))).not.toMatch(/^\s*size=/m)
  })

  it('omits the staged size while its eye is off', () => {
    expect(buildColumnChooserSnippet(state({ size: 'lg', sizeOn: false }))).not.toMatch(/^\s*size=/m)
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

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildColumnChooserSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
