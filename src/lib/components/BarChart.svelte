<script lang="ts">
  import type { SizeInput } from '#lib/size-scale.js'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import Tooltip from './Tooltip.svelte'
  import { CHART_TONES, TONE_CLASS, type ChartTone } from './chart-tones'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'

  // One column of the chart. One segment renders a plain bar; several render a
  // stacked bar, each segment growing by its value within the column.
  export interface ChartSegment {
    value: number
    // Palette tone; a segment naming none takes the next tone in cycle order
    // by its index within the column.
    tone?: ChartTone
    // Legend and tooltip label; a segment without one is left out of the legend.
    label?: string
  }

  export interface ChartColumn {
    // Axis label.
    label: string
    segments: ChartSegment[]
    // Plain-text hover hint; omitted, the column carries no tooltip.
    tip?: string
  }

  interface Props {
    columns: ChartColumn[]
    // Accessible name; falls back to the shared `chart.label` key.
    ariaLabel?: string
    size?: SizeInput
    // Plot-box footprint override; a number is px, a string is used verbatim
    // (e.g. `12rem`). Every other metric still scales with `size`.
    height?: number | string
    // Legend total formatter; defaults to `String`.
    format?: (value: number) => string
    // Show the legend when a segment carries a label; `false` hides it.
    legend?: boolean
    className?: string
  }

  let {
    columns,
    ariaLabel,
    size = 'md',
    height,
    format = String,
    legend = true,
    className = '',
  }: Props = $props()

  const i18n = getI18nContext()

  // Derived (not read inline) so a locale switch re-resolves the label.
  const resolvedAriaLabel = $derived(ariaLabel ?? i18n.t('chart.label'))

  // Every metric is a fixed ratio of the size dimension, calibrated so the
  // default `md` reproduces the ported chart: a 140px plot, a 56px max column
  // (4px min, 4px gap), a 10px axis label, a 12px legend and its 9px swatch,
  // and a 4px bar corner.
  const CHART_RATIOS = {
    plotHeight: 8.75,
    colMax: 3.5,
    colMin: 0.25,
    colGap: 0.25,
    axisFont: 0.625,
    axisLine: 0.75,
    axisGap: 0.25,
    legendFont: 0.75,
    legendLine: 1,
    legendGapX: 0.875,
    legendGapY: 0.25,
    legendGapTop: 0.625,
    swatch: 0.5625,
    swatchRadius: 0.125,
    swatchGap: 0.3125,
    barRadius: 0.25,
  }

  const metrics = $derived(dimensionMetrics(size, CHART_RATIOS))

  // The footprint override is its own concern (like a dialog's height variant),
  // so it replaces only the size-derived plot height; the metrics keep scaling.
  const heightVar = $derived.by(() => {
    if (typeof height === 'number' && Number.isFinite(height)) {
      return `--chart-plot-height:${Math.max(1, height)}px`
    }
    return typeof height === 'string' && height ? `--chart-plot-height:${height}` : ''
  })

  const chartStyle = $derived([sizeVarStyle('chart', metrics), heightVar].filter(Boolean).join(';'))

  // Column height as a percentage of the tallest column; a 2% floor keeps the
  // smallest column visible against the baseline.
  const rows = $derived.by(() => {
    const totals = columns.map(column => column.segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0))
    const max = Math.max(1, ...totals)
    return columns.map((column, index) => ({
      column,
      percent: Math.max(2, Math.round(((totals[index] ?? 0) / max) * 100)),
    }))
  })

  // Wide ranges hide every other label so a long series still fits a panel.
  const labelEvery = $derived(Math.max(1, Math.ceil(columns.length / 16)))

  const toneOf = (segment: ChartSegment, index: number): ChartTone =>
    segment.tone ?? CHART_TONES[index % CHART_TONES.length] ?? 'cyan'

  interface LegendRow {
    label: string
    tone: ChartTone
    total: number
  }

  // One legend row per distinct labelled segment, in first-seen order, summing
  // the value across every column; the first sighting fixes the row's tone.
  const legendRows = $derived.by(() => {
    const rows = new Map<string, LegendRow>()
    for (const column of columns) {
      column.segments.forEach((segment, index) => {
        if (!segment.label) {
          return
        }
        const existing = rows.get(segment.label)
        if (existing) {
          existing.total += segment.value
        } else {
          rows.set(segment.label, { label: segment.label, tone: toneOf(segment, index), total: segment.value })
        }
      })
    }
    return [...rows.values()]
  })

  const showLegend = $derived(legend && legendRows.length > 0)
</script>

<div class={`flex w-full flex-col ${className}`} style={chartStyle}>
  <div
    class="flex w-full items-end justify-center gap-[var(--chart-col-gap)]"
    style:height="var(--chart-plot-height)"
    role="img"
    aria-label={resolvedAriaLabel}>
    {#each rows as row, index (row.column.label + index)}
      <div class="group flex h-full min-w-[var(--chart-col-min)] flex-col justify-end [flex:0_1_var(--chart-col-max)]">
        {#if row.column.tip}
          <Tooltip {size}>{row.column.tip}</Tooltip>
        {/if}
        <div
          class="flex w-full flex-col overflow-hidden rounded-t-[var(--chart-bar-radius)]"
          style:height={`${row.percent}%`}>
          <!-- Positional list: keying by index keeps two same-labelled segments
            in one column (which the legend merges) from colliding. -->
          {#each row.column.segments as segment, segmentIndex (segmentIndex)}
            <span
              class={`block w-full grow basis-0 transition-colors duration-150 motion-reduce:transition-none ${TONE_CLASS[toneOf(segment, segmentIndex)].fill} ${TONE_CLASS[toneOf(segment, segmentIndex)].hover}`}
              style:flex-grow={Math.max(0, segment.value)}>
            </span>
          {/each}
        </div>
      </div>
    {/each}
  </div>
  <div
    class="mt-[var(--chart-axis-gap)] flex w-full justify-center gap-[var(--chart-col-gap)] text-[length:var(--chart-axis-font)] leading-[var(--chart-axis-line)] text-slate-400"
    aria-hidden="true">
    {#each rows as row, index (row.column.label + index)}
      <span
        class="min-w-[var(--chart-col-min)] overflow-hidden text-center whitespace-nowrap [flex:0_1_var(--chart-col-max)]"
        >{index % labelEvery === 0 ? row.column.label : ''}</span>
    {/each}
  </div>
  {#if showLegend}
    <div
      class="mt-[var(--chart-legend-gap-top)] flex flex-wrap gap-x-[var(--chart-legend-gap-x)] gap-y-[var(--chart-legend-gap-y)] text-[length:var(--chart-legend-font)] leading-[var(--chart-legend-line)] text-slate-400">
      {#each legendRows as row (row.label)}
        <span class="inline-flex items-center">
          <i
            class={`mr-[var(--chart-swatch-gap)] inline-block h-[var(--chart-swatch)] w-[var(--chart-swatch)] rounded-[var(--chart-swatch-radius)] ${TONE_CLASS[row.tone].fill}`}
            aria-hidden="true"></i>
          {row.label} {format(row.total)}
        </span>
      {/each}
    </div>
  {/if}
</div>
