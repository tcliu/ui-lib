<script lang="ts">
  import BarChart from '#lib/components/BarChart.svelte'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { type TriState } from '#showcase/playground/snippet-build.js'
  import { boolField, jsonField, sizeField, textField } from '#showcase/playground/snippet-field.js'
  import { parseSizeValue } from '#showcase/playground/size-input.js'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { barHeight, buildBarChartSnippet, DEMO_COLUMNS, parseColumnsJson, parseColumnsValue } from './demo-snippet'

  // Customizer playground state. Every curated option starts at the component
  // default (the Value column shows it), so the cleared form applies no
  // overrides and Show-code omits the defaults. Clearing a Value unsets it;
  // Reset restores the defaults below.
  const INITIAL = {
    // The chart requires `columns`, so its eye resets to the demo data instead
    // of omitting the prop.
    columns: staged(DEMO_COLUMNS, true),
    size: staged('md'),
    height: staged(''),
    legend: staged('yes' as TriState),
    ariaLabel: staged('Daily activity', true),
    className: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))

  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoHeight = $derived(barHeight(pg.height.value, pg.height.on))
  const demoLegend = $derived(appliedFlag(pg.legend))
  const demoAriaLabel = $derived(applied(pg.ariaLabel) || undefined)
  const demoClassName = $derived(applied(pg.className) || undefined)

  const code = $derived(
    buildBarChartSnippet({
      columns: pg.columns,
      size: pg.size,
      height: pg.height,
      legend: pg.legend,
      ariaLabel: pg.ariaLabel,
      className: pg.className,
    }),
  )

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  // Editable rows first (primitives and plain data A–Z), then the function
  // props (A–Z). The chart requires `columns`, so its eye resets to the demo
  // data instead of omitting the prop.
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the chart image.', clearable: true, ...eye(pg.ariaLabel) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes on the chart root.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    jsonField({
      name: 'columns',
      type: 'ChartColumn[]',
      note: 'Series data: each column has a label and its segments (a segment label feeds the legend, a column tip the tooltip). The eye resets to the demo columns.',
      value: JSON.stringify(pg.columns.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseColumnsJson(draft)
        if (parsed) stage(pg.columns, parsed)
      },
      dialog: {
        valid: (draft: string) => parseColumnsJson(draft) != null,
        invalidMessage: 'Invalid columns JSON. Use an array of { label, segments: [{ value, tone?, label? }], tip? } objects.',
      },
      toggle: eyeResetToggle(pg.columns, () => (pg.columns.value = structuredClone(DEMO_COLUMNS))),
      sync: { kind: 'scriptJson', parseJson: parseColumnsValue, setJson: value => (pg.columns.value = value as typeof pg.columns.value) },
    }),
    { name: 'height', type: 'number | string?', defaultValue: '—', note: 'Plot-box height override; a number is px, a string is used verbatim.', editor: 'number', clearable: true, ...eye(pg.height), onChange: value => stage(pg.height, value), toggle: eyeToggle(pg.height), sync: { kind: 'number', pattern: /^\d+$/ } },
    boolField({ name: 'legend', defaultValue: 'true', note: 'Render the legend when a segment carries a label.', ...eyeFlag(pg.legend) }),
    sizeField({ note: 'Chart scale; the plot, columns, axis, and legend all follow it.', ...eye(pg.size) }),
    { name: 'format', type: '(value: number) => string', defaultValue: 'String', note: 'Legend total formatter; the demo uses the default.' },
  ])
</script>

<ShowcasePage {fields} title="BarChart" {code} onReset={clearPlayground} sync={{ tag: 'BarChart' }}>
  <div class="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-4">
    <BarChart
      columns={pg.columns.value}
      size={demoSize}
      height={demoHeight}
      legend={demoLegend}
      ariaLabel={demoAriaLabel}
      className={demoClassName} />
  </div>
</ShowcasePage>
