<script lang="ts">
  // The date input: one editable field for a single date, or a `range` pair of
  // independent fields with a separator, each behaving exactly as the single
  // field does. `time` adds an hour/minute row to every field's panel, so a
  // range and a time coexist — a date-time range is two date-time fields.
  // `DateField` owns the field chrome and the calendar, so this layer decides
  // how many fields to render, what each one is called, and how the pair holds
  // its two days: one end hands the focus to the empty one, and the pair keeps
  // its days in order.
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import type { SizeInput } from '#lib/size-scale.js'
  import DateField from './DateField.svelte'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import {
    DATETIME_VALUE_FORMAT,
    DEFAULT_DATE_FORMAT,
    DEFAULT_DATETIME_FORMAT,
    compareValues,
    valueDay,
    type DateFieldHandle,
    type DateFieldSibling,
    type DateSpan,
  } from './date-input-core'
  import { PICKER_RATIOS, type DateInputTheme, type PickerRatioOverrides } from './date-input-metrics'
  import { withLine } from './text-input-metrics'

  const i18n = getI18nContext()

  interface Props {
    // Render a from/to pair of independent fields instead of one field.
    range?: boolean
    // Edit a date-time: every field's panel gains an hour/minute row and the
    // value is serialized as `${date}T${HH:mm:ss}`.
    time?: boolean
    // Single (`range` off).
    value?: string
    onChange?: (value: string) => void
    // Range (`range` on).
    from?: string
    to?: string
    onFrom?: (value: string) => void
    onTo?: (value: string) => void
    size?: SizeInput
    // Partial override of the field gutter and calendar ratios (font, paddings,
    // icon, gaps, panel width/padding, navigation and cell sizes); omitted keys
    // keep the shared defaults. The field text follows the same font and
    // paddings, and the line box follows `font`.
    ratios?: PickerRatioOverrides
    // Single-mode prompt and accessible name (defaults to the shared "Select
    // date" / "Select date and time" message); a range pair names each field
    // after its own end instead.
    placeholder?: string
    // Display pattern, and the pattern typed text is parsed against; defaults to
    // a date, or a date-time when `time` is set.
    format?: string
    theme?: DateInputTheme
    // Close the panel after a day pick; defaults to closing, except when a
    // field edits a time, where the pick only starts the entry.
    closeOnSelect?: boolean
    // Highlight the days between the two ends in each end's calendar, so the
    // range reads as one span (the ends stay the selected days).
    highlightRange?: boolean
  }

  let {
    range = false,
    time = false,
    value = '',
    onChange,
    from = '',
    to = '',
    onFrom,
    onTo,
    size = 'md',
    ratios,
    placeholder,
    format,
    theme = {},
    closeOnSelect,
    highlightRange = false,
  }: Props = $props()

  const resolvedRatios = $derived({ ...PICKER_RATIOS, ...ratios })
  // The picker's line box follows its font, so a font retune carries the panel
  // rows and the field's calendar affordance with it.
  const metrics = $derived(dimensionMetrics(size, withLine(resolvedRatios)))
  const inputStyle = $derived(sizeVarStyle('pick', metrics))
  const displayFormat = $derived(format ?? (time ? DEFAULT_DATETIME_FORMAT : DEFAULT_DATE_FORMAT))
  const closeOnPick = $derived(closeOnSelect ?? !time)
  const message = $derived(placeholder ?? i18n.t(time ? 'date.selectTime' : 'date.select'))
  const calendarLabel = $derived(i18n.t('date.calendar'))
  const fromLabel = $derived(i18n.t('range.from'))
  const toLabel = $derived(i18n.t('range.to'))

  // The pair's ends, so one field can hand the focus to the other: an end
  // that is filled while the other is empty passes the focus (and the open
  // calendar) to the empty one.
  let fromField = $state<DateFieldHandle | null>(null)
  let toField = $state<DateFieldHandle | null>(null)

  // The committed day of each end, under the value format the fields write
  // back (`YYYY-MM-DD`, or a date-time while `time` is on).
  const valueFormat = $derived(time ? DATETIME_VALUE_FORMAT : DEFAULT_DATE_FORMAT)
  const fromDay = $derived(valueDay(from, valueFormat, i18n.locale))
  const toDay = $derived(valueDay(to, valueFormat, i18n.locale))
  const fromSibling = $derived<DateFieldSibling>({
    day: toDay,
    focusAndOpen: day => toField?.focusAndOpen(day),
  })
  const toSibling = $derived<DateFieldSibling>({
    day: fromDay,
    focusAndOpen: day => fromField?.focusAndOpen(day),
  })
  // The highlighted span: the days between the two ends.
  const span = $derived<DateSpan | undefined>(
    range && highlightRange ? { from: fromDay, to: toDay } : undefined,
  )

  // The pair always holds its two instants in order. A commit that lands on
  // the wrong side of the other end exchanges the two values, so the range
  // never inverts — the same swap the old single-panel picker did, so a day
  // picked before the start becomes the start, and a clock stepped past the
  // other end hands the ends over. The values travel whole, so each end keeps
  // a value its own format can read.
  function commitFrom(next: string) {
    // The other end is read before the first write: a prop read after it would
    // already carry the value this commit writes.
    const other = to
    const order = compareValues(next, other, valueFormat, i18n.locale)
    if (order !== null && order > 0) {
      onFrom?.(other)
      onTo?.(next)
      return
    }
    onFrom?.(next)
  }

  function commitTo(next: string) {
    const other = from
    const order = compareValues(next, other, valueFormat, i18n.locale)
    if (order !== null && order < 0) {
      onFrom?.(next)
      onTo?.(other)
      return
    }
    onTo?.(next)
  }
</script>

<!-- The root carries the `--pick-*` set the fields' gutters and their portalled
     panels read; each field is a flex item, so a single field fills the row. -->
<div class="flex items-center gap-[var(--pick-gap)]" style={inputStyle}>
  {#if range}
    <!-- Each end is its own field with its own calendar; the pair hands the
         focus to the empty end as soon as the other one is filled. -->
    <DateField
      bind:this={fromField}
      value={from}
      onChange={commitFrom}
      {size}
      {ratios}
      format={displayFormat}
      {time}
      label={fromLabel}
      actionLabel={`${fromLabel}: ${calendarLabel}`}
      {theme}
      closeOnSelect={closeOnPick}
      sibling={fromSibling}
      highlight={span} />
    <span aria-hidden="true" class="text-[length:var(--pick-font)] text-slate-500">–</span>
    <DateField
      bind:this={toField}
      value={to}
      onChange={commitTo}
      {size}
      {ratios}
      format={displayFormat}
      {time}
      label={toLabel}
      actionLabel={`${toLabel}: ${calendarLabel}`}
      {theme}
      closeOnSelect={closeOnPick}
      sibling={toSibling}
      highlight={span} />
  {:else}
    <DateField
      value={value}
      onChange={onChange}
      {size}
      {ratios}
      format={displayFormat}
      {time}
      label={message}
      actionLabel={calendarLabel}
      {theme}
      closeOnSelect={closeOnPick} />
  {/if}
</div>
