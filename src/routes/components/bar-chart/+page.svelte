<script lang="ts">
  import BarChart from '$lib/components/BarChart.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { flagOn, type TriState } from '$showcase/snippet-build'
  import { boolField, jsonField, resetToggle, sizeField, snippetToggle, textField } from '$showcase/snippet-field'
  import { parseSizeValue } from '$showcase/size-input'
  import { barHeight, buildBarChartSnippet, DEMO_COLUMNS, parseColumnsJson, parseColumnsValue } from './demo-snippet'

  // Customizer playground state. Every curated option starts at the component
  // default (the Value column shows it), so the cleared form applies no
  // overrides and Show-code omits the defaults. Clearing a Value unsets it;
  // Reset restores the defaults below.
  const INITIAL = {
    columns: DEMO_COLUMNS,
    columnsOn: true,
    size: 'md',
    sizeOn: false,
    height: '',
    heightOn: false,
    legend: 'yes' as TriState,
    legendOn: false,
    ariaLabel: 'Daily activity',
    ariaLabelOn: true,
    className: '',
    classNameOn: false,
  }
  let pg = $state(structuredClone(INITIAL))

  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const demoHeight = $derived(barHeight(pg.height, pg.heightOn))
  const demoLegend = $derived(pg.legendOn ? flagOn(pg.legend) : undefined)
  const demoAriaLabel = $derived(pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : undefined)
  const demoClassName = $derived(pg.classNameOn && pg.className ? pg.className : undefined)

  const code = $derived(
    buildBarChartSnippet({
      columns: pg.columns,
      size: pg.size,
      sizeOn: pg.sizeOn,
      height: pg.height,
      heightOn: pg.heightOn,
      legend: pg.legend,
      legendOn: pg.legendOn,
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      className: pg.className,
      classNameOn: pg.classNameOn,
    }),
  )

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  // Editable rows first (primitives and plain data A–Z), then the function
  // props (A–Z). The chart requires `columns`, so its eye resets to the demo
  // data instead of omitting the prop.
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the chart image.', value: pg.ariaLabel, onChange: v => (pg.ariaLabel = v), clearable: true, enabled: pg.ariaLabelOn, setEnabled: v => (pg.ariaLabelOn = v) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes on the chart root.', value: pg.className, onChange: v => (pg.className = v), editorDefaultValue: '', clearable: true, enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
    jsonField({
      name: 'columns',
      type: 'ChartColumn[]',
      note: 'Series data: each column has a label and its segments (a segment label feeds the legend, a column tip the tooltip). The eye resets to the demo columns.',
      value: JSON.stringify(pg.columns, null, 2),
      onChange: (draft: string) => {
        const parsed = parseColumnsJson(draft)
        if (parsed) {
          pg.columns = parsed
          pg.columnsOn = true
        }
      },
      dialog: {
        valid: (draft: string) => parseColumnsJson(draft) != null,
        invalidMessage: 'Invalid columns JSON. Use an array of { label, segments: [{ value, tone?, label? }], tip? } objects.',
      },
      toggle: resetToggle(pg.columnsOn, enabled => (pg.columnsOn = enabled), () => (pg.columns = structuredClone(DEMO_COLUMNS))),
      sync: { kind: 'scriptJson', parseJson: parseColumnsValue, setJson: value => (pg.columns = value as typeof pg.columns) },
    }),
    { name: 'height', type: 'number | string?', defaultValue: '—', note: 'Plot-box height override; a number is px, a string is used verbatim.', editor: 'number', clearable: true, value: pg.height, onChange: value => { pg.height = value; pg.heightOn = true; }, toggle: snippetToggle(pg.heightOn, enabled => (pg.heightOn = enabled)), sync: { kind: 'number', pattern: /^\d+$/ } },
    boolField({ name: 'legend', defaultValue: 'true', note: 'Render the legend when a segment carries a label.', value: pg.legend, onChange: v => (pg.legend = v as TriState), enabled: pg.legendOn, setEnabled: v => (pg.legendOn = v) }),
    sizeField({ note: 'Chart scale; the plot, columns, axis, and legend all follow it.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'format', type: '(value: number) => string', defaultValue: 'String', note: 'Legend total formatter; the demo uses the default.' },
  ])
</script>

<ShowcasePage {fields} title="BarChart" {code} onReset={clearPlayground} sync={{ tag: 'BarChart' }}>
  <div class="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-4">
    <BarChart
      columns={pg.columns}
      size={demoSize}
      height={demoHeight}
      legend={demoLegend}
      ariaLabel={demoAriaLabel}
      className={demoClassName} />
  </div>
</ShowcasePage>
