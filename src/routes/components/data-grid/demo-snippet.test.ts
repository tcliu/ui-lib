import { describe, expect, it } from 'vitest'
import { STAGE_PANE, STAGE_ROW } from '$showcase/resizable-stage'
import { staged } from '$showcase/staged'
import {
  DEMO_VALUE,
  buildDataGridSnippet,
  parseColumnLabelsJson,
  parseColumnLabelsValue,
  parseColumnWidthsJson,
  parseColumnWidthsValue,
  parseGridValue,
  parseGridValueJson,
  type DataGridSnippetState,
} from './demo-snippet'

function state(overrides: Partial<DataGridSnippetState> = {}): DataGridSnippetState {
  return {
    editable: staged('', true),
    showHeaders: staged('', true),
    hideHeaderToggle: staged('', true),
    columnLabels: staged([], true),
    initialColumnWidths: staged([], true),
    value: staged([], true),
    maxColumns: staged('', true),
    storageKey: staged(''),
    size: staged('', true),
    ...overrides,
  }
}

describe('buildDataGridSnippet', () => {
  it('omits every flag while unset', () => {
    const source = buildDataGridSnippet(state())
    expect(source).toContain('value={value}')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('showHeaders')
    expect(source).not.toContain('hideHeaderToggle')
  })

  it('emits a bare flag for yes only when it differs from the default', () => {
    const source = buildDataGridSnippet(
      state({ editable: staged('yes', true), showHeaders: staged('yes', true), hideHeaderToggle: staged('yes', true) }),
    )
    expect(source).toContain('\n      hideHeaderToggle\n')
    expect(source).not.toContain('\n      editable\n')
    expect(source).not.toContain('\n      showHeaders\n')
  })

  it('emits ={false} for no only when it differs from the default', () => {
    const source = buildDataGridSnippet(
      state({ editable: staged('no', true), showHeaders: staged('no', true), hideHeaderToggle: staged('no', true) }),
    )
    expect(source).toContain('editable={false}')
    expect(source).toContain('showHeaders={false}')
    expect(source).not.toMatch(/^\s*hideHeaderToggle=/m)
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildDataGridSnippet(
      state({
        editable: staged('yes', true),
        showHeaders: staged('yes', true),
        hideHeaderToggle: staged('no', true),
        size: staged('md', true),
      }),
    )
    expect(source).not.toContain('editable')
    expect(source).not.toContain('showHeaders')
    expect(source).not.toContain('hideHeaderToggle')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('omits the curated options while unset', () => {
    const source = buildDataGridSnippet(state())
    expect(source).not.toContain('columnLabels')
    expect(source).not.toContain('initialColumnWidths')
    expect(source).not.toContain('maxColumns')
    expect(source).not.toContain('storageKey')
    expect(source).not.toMatch(/^\s*size=/m)
  })

  it('seeds the label and width lists as script-local state when set', () => {
    const source = buildDataGridSnippet(
      state({ columnLabels: staged(['Key', 'Value'], true), initialColumnWidths: staged(['30%', '70%'], true) }),
    )
    expect(source).toContain('let columnLabels = $state(["Key","Value"]);')
    expect(source).toContain('columnLabels={columnLabels}')
    expect(source).toContain('let initialColumnWidths = $state(["30%","70%"]);')
    expect(source).toContain('initialColumnWidths={initialColumnWidths}')
  })

  it('omits the lists and cell binding while their eye toggle is off', () => {
    const source = buildDataGridSnippet(
      state({
        columnLabels: staged(['Key', 'Value']),
        initialColumnWidths: staged(['30%', '70%']),
        value: staged([], false),
      }),
    )
    expect(source).not.toContain('columnLabels')
    expect(source).not.toContain('initialColumnWidths')
    expect(source).not.toContain('value={value}')
    expect(source).not.toContain('onChange=')
    expect(source).not.toContain('<script>')
    expect(source).toContain('<DataGrid')
  })

  it('emits maxColumns and storageKey when set', () => {
    const source = buildDataGridSnippet(
      state({ maxColumns: staged('2', true), storageKey: staged('grid-widths', true) }),
    )
    expect(source).toContain('maxColumns={2}')
    expect(source).toContain('storageKey="grid-widths"')
  })

  it('omits the staged storageKey while the eye is off', () => {
    expect(buildDataGridSnippet(state({ storageKey: staged('grid-widths') }))).not.toContain('storageKey=')
  })

  it('omits the staged size while its eye is off', () => {
    expect(buildDataGridSnippet(state({ size: staged('lg') }))).not.toMatch(/^\s*size=/m)
  })

  it('omits staged boolean flags while their eye is off', () => {
    const source = buildDataGridSnippet(
      state({
        editable: staged('no'),
        showHeaders: staged('no'),
        hideHeaderToggle: staged('yes'),
      }),
    )
    expect(source).not.toContain('editable')
    expect(source).not.toContain('showHeaders')
    expect(source).not.toContain('hideHeaderToggle')
  })

  it('omits maxColumns while its eye is off', () => {
    expect(buildDataGridSnippet(state({ maxColumns: staged('2') }))).not.toContain('maxColumns')
    expect(buildDataGridSnippet(state({ maxColumns: staged('2', true) }))).toContain('maxColumns={2}')
  })
  it('omits maxColumns while unset or non-positive-integer', () => {
    expect(buildDataGridSnippet(state())).not.toContain('maxColumns')
    expect(buildDataGridSnippet(state({ maxColumns: staged('abc', true) }))).not.toContain('maxColumns')
    expect(buildDataGridSnippet(state({ maxColumns: staged('0', true) }))).not.toContain('maxColumns')
    expect(buildDataGridSnippet(state({ maxColumns: staged('-2', true) }))).not.toContain('maxColumns')
    expect(buildDataGridSnippet(state({ maxColumns: staged('2.5', true) }))).not.toContain('maxColumns')
  })

  it('emits a named size as a string and a numeric size as an expression', () => {
    expect(buildDataGridSnippet(state({ size: staged('lg', true) }))).toContain('size="lg"')
    expect(buildDataGridSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    expect(buildDataGridSnippet(state({ size: staged('huge', true) }))).not.toMatch(/^\s*size=/m)
  })

  it('parses column-labels editor drafts', () => {
    expect(parseColumnLabelsJson('["Key", "Value"]')).toEqual(['Key', 'Value'])
    expect(parseColumnLabelsJson('[]')).toEqual([])
    expect(parseColumnLabelsJson('not json')).toBeNull()
    expect(parseColumnLabelsJson('{"a": 1}')).toBeNull()
    expect(parseColumnLabelsJson('[42]')).toBeNull()
    expect(parseColumnLabelsValue(['a'])).toEqual(['a'])
    expect(parseColumnLabelsValue('nope')).toBeNull()
    expect(parseColumnLabelsValue([42])).toBeNull()
  })

  it('parses column-widths editor drafts', () => {
    expect(parseColumnWidthsJson('["30%", "70%"]')).toEqual(['30%', '70%'])
    expect(parseColumnWidthsJson('[]')).toEqual([])
    expect(parseColumnWidthsJson('not json')).toBeNull()
    expect(parseColumnWidthsJson('[42]')).toBeNull()
    expect(parseColumnWidthsValue(['100'])).toEqual(['100'])
    expect(parseColumnWidthsValue(null)).toBeNull()
  })

  it('parses grid-data editor drafts', () => {
    expect(parseGridValueJson('[["a", "b"], ["c"]]')).toEqual([['a', 'b'], ['c']])
    expect(parseGridValueJson('[]')).toEqual([])
    expect(parseGridValueJson('not json')).toBeNull()
    expect(parseGridValueJson('{"a": 1}')).toBeNull()
    expect(parseGridValueJson('["a"]')).toBeNull()
    expect(parseGridValueJson('[[42]]')).toBeNull()
    expect(parseGridValueJson('[[null]]')).toBeNull()
    expect(parseGridValue([['a']])).toEqual([['a']])
    expect(parseGridValue('nope')).toBeNull()
    expect(parseGridValue([42])).toBeNull()
  })

  it('copies grid-data rows so a commit never aliases the draft', () => {
    const raw = [['a', 'b']]
    const parsed = parseGridValue(raw)
    expect(parsed).toEqual([['a', 'b']])
    expect(parsed?.[0]).not.toBe(raw[0])
  })

  it('wraps the grid in the handle-less stage the page renders', () => {
    const source = buildDataGridSnippet(state())
    expect(source).not.toContain('stageWidth')
    expect(source).not.toContain('resizeLabel')
    expect(source).not.toContain('<Splitter')
    expect(source).toContain(`<div class="${STAGE_ROW}">`)
    expect(source).toContain(`<div class="${STAGE_PANE} h-72 w-full">`)
    expect(source).toContain('onChange={next => (value = next)}')
  })

  it('omits the script block while no list is seeded', () => {
    expect(buildDataGridSnippet(state())).not.toContain('<script>')
  })
})

describe('DEMO_VALUE', () => {
  it('starts with a header row and at least one data row', () => {
    expect(DEMO_VALUE[0]).toEqual(['Name', 'Role', 'Team'])
    expect(DEMO_VALUE.length).toBeGreaterThan(1)
    expect(DEMO_VALUE.every(row => row.length === DEMO_VALUE[0].length)).toBe(true)
  })
})
