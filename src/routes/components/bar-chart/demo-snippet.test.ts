import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
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
    columns: DEMO_COLUMNS,
    size: '',
    sizeOn: false,
    height: '',
    heightOn: false,
    legend: '',
    legendOn: false,
    ariaLabel: '',
    ariaLabelOn: false,
    className: '',
    classNameOn: false,
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
      state({ columns: [{ label: 'Solo', segments: [{ value: 7, tone: 'rose', label: 'Pings' }] }] }),
    )
    expect(source).toContain('"label": "Solo"')
    expect(source).toContain('"tone": "rose"')
    expect(source).not.toContain('"label": "Mon"')
  })

  it('omits the component defaults (the Value column prefills them)', () => {
    const source = buildBarChartSnippet(state({ size: 'md', sizeOn: true, legend: 'yes', legendOn: true }))
    expect(source).not.toContain('size=')
    expect(source).not.toContain('legend=')
    expect(source).not.toContain('height=')
  })

  it('emits a non-default size, a numeric height, and No legend', () => {
    const source = buildBarChartSnippet(
      state({
        size: 'lg',
        sizeOn: true,
        height: '180',
        heightOn: true,
        legend: 'no',
        legendOn: true,
      }),
    )
    expect(source).toContain('size="lg"')
    expect(source).toContain('height={180}')
    expect(source).toContain('legend={false}')
  })

  it('emits a numeric size as an expression and omits a non-integer height', () => {
    const source = buildBarChartSnippet(state({ size: '20', sizeOn: true, height: '12.5', heightOn: true }))
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
        ariaLabel: 'Daily activity',
        ariaLabelOn: true,
        className: 'mt-2',
        classNameOn: true,
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
