import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$showcase/playground/snippet-playground'
import { staged } from '$showcase/playground/staged'
import {
  barHeight,
  buildBarChartSnippet,
  DEMO_COLUMNS,
  parseColumnsJson,
  parseColumnsValue,
  type BarChartSnippetState,
} from './demo-snippet'

function state(overrides: Partial<BarChartSnippetState> = {}): BarChartSnippetState {
  return {
    columns: staged(DEMO_COLUMNS, true),
    size: staged(''),
    height: staged(''),
    legend: staged(''),
    ariaLabel: staged(''),
    className: staged(''),
    ...overrides,
  }
}

describe('buildBarChartSnippet', () => {
  it('seeds the column data as script-local state', () => {
    const source = buildBarChartSnippet(state())
    expect(source.startsWith('<script>')).toBe(true)
    // `$state([…])` holding valid JSON: the Value cell parses this back, so the
    // seed must be JSON (quoted keys), not a JS object literal.
    expect(source).toContain('  let columns = $state([')
    for (const column of DEMO_COLUMNS) {
      expect(source).toContain(`"label": "${column.label}"`)
    }
    expect(source).toContain('columns={columns}')
  })

  it('emits edited columns in place of the demo data', () => {
    const source = buildBarChartSnippet(
      state({ columns: staged([{ label: 'Solo', segments: [{ value: 7, tone: 'rose', label: 'Pings' }] }]) }),
    )
    expect(source).toContain('"label": "Solo"')
    expect(source).toContain('"tone": "rose"')
    expect(source).not.toContain('"label": "Mon"')
  })

  it('omits the component defaults (the Value column prefills them)', () => {
    const source = buildBarChartSnippet(state({ size: staged('md', true), legend: staged('yes', true) }))
    expect(source).not.toContain('size=')
    expect(source).not.toContain('legend=')
    expect(source).not.toContain('height=')
  })

  it('emits a non-default size, a numeric height, and No legend', () => {
    const source = buildBarChartSnippet(
      state({
        size: staged('lg', true),
        height: staged('180', true),
        legend: staged('no', true),
      }),
    )
    expect(source).toContain('size="lg"')
    expect(source).toContain('height={180}')
    expect(source).toContain('legend={false}')
  })

  it('emits a numeric size as an expression and omits a non-integer height', () => {
    const source = buildBarChartSnippet(state({ size: staged('20', true), height: staged('12.5', true) }))
    expect(source).toContain('size={20}')
    expect(source).not.toContain('height=')
  })

  it('shares the positive-integer height guard with the live demo', () => {
    // The page passes this result to the component, so it must fall back for
    // exactly the values the snippet omits (zero, negatives, decimals, blank).
    expect(barHeight('180', true)).toBe(180)
    expect(barHeight('0', true)).toBeUndefined()
    expect(barHeight('-1', true)).toBeUndefined()
    expect(barHeight('12.5', true)).toBeUndefined()
    expect(barHeight('', true)).toBeUndefined()
    expect(barHeight('180', false)).toBeUndefined()
  })

  it('emits ariaLabel and className only while set', () => {
    const set = buildBarChartSnippet(
      state({
        ariaLabel: staged('Daily activity', true),
        className: staged('mt-2', true),
      }),
    )
    expect(set).toContain('ariaLabel="Daily activity"')
    expect(set).toContain('className="mt-2"')
    const unset = buildBarChartSnippet(state())
    expect(unset).not.toContain('ariaLabel=')
    expect(unset).not.toContain('className=')
  })

  it('wraps the chart in the demo panel', () => {
    expect(buildBarChartSnippet(state())).toContain(
      '<div class="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-4">',
    )
  })

  it('parses the columns editor draft', () => {
    expect(
      parseColumnsJson('[{"label": "A", "segments": [{"value": 1, "tone": "sky", "label": "S"}], "tip": "A"}]'),
    ).toEqual([{ label: 'A', segments: [{ value: 1, tone: 'sky', label: 'S' }], tip: 'A' }])
    // A column keeps only the facets the demo can reproduce, so the dialog
    // rejects anything else instead of dropping data silently.
    expect(parseColumnsJson('not json')).toBeNull()
    expect(parseColumnsJson('{"label": "A"}')).toBeNull()
    expect(parseColumnsJson('[{"label": "A"}]')).toBeNull()
    expect(parseColumnsJson('[{"label": "A", "segments": [{"value": "1"}]}]')).toBeNull()
    expect(parseColumnsJson('[{"label": "A", "segments": [{"value": 1, "tone": "pink"}]}]')).toBeNull()
    expect(parseColumnsJson('[{"label": "A", "segments": [], "tip": 2}]')).toBeNull()
  })

  it('validates unknown data into columns', () => {
    expect(parseColumnsValue([{ label: 'A', segments: [] }])).toEqual([{ label: 'A', segments: [] }])
    expect(parseColumnsValue('nope')).toBeNull()
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildBarChartSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
