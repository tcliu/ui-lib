<script lang="ts">
  // The date input: one editable field for a single date, or a `range` pair of
  // independent fields with a separator, each behaving exactly as the single
  // field does. `time` adds an hour/minute row to every field's panel, so a
  // range and a time coexist — a date-time range is two date-time fields.
  // `DateField` owns the field chrome and the calendar, so this layer only
  // decides how many fields to render and what each one is called.
  import { getI18nContext } from '$lib/i18n.svelte'
  import type { SizeInput } from '$lib/size-scale'
  import DateField from './DateField.svelte'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import {
    DEFAULT_DATE_FORMAT,
    DEFAULT_DATETIME_FORMAT,
    PICKER_RATIOS,
    type DateInputTheme,
  } from './date-input-core'

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
    placeholder,
    format,
    theme = {},
    closeOnSelect,
  }: Props = $props()

  const metrics = $derived(dimensionMetrics(size, PICKER_RATIOS))
  const inputStyle = $derived(sizeVarStyle('pick', metrics))
  const displayFormat = $derived(format ?? (time ? DEFAULT_DATETIME_FORMAT : DEFAULT_DATE_FORMAT))
  const closeOnPick = $derived(closeOnSelect ?? !time)
  const message = $derived(placeholder ?? i18n.t(time ? 'date.selectTime' : 'date.select'))
  const calendarLabel = $derived(i18n.t('date.calendar'))
  const fromLabel = $derived(i18n.t('range.from'))
  const toLabel = $derived(i18n.t('range.to'))
</script>

{#snippet dateField(fieldValue: string, onFieldChange: ((next: string) => void) | undefined, label: string, actionLabel: string)}
  <DateField
    value={fieldValue}
    onChange={onFieldChange}
    {size}
    format={displayFormat}
    {time}
    {label}
    {actionLabel}
    {theme}
    closeOnSelect={closeOnPick} />
{/snippet}

<!-- The root carries the `--pick-*` set the fields' gutters and their portalled
     panels read; each field is a flex item, so a single field fills the row. -->
<div class="flex items-center gap-[var(--pick-gap)]" style={inputStyle}>
  {#if range}
    {@render dateField(from, onFrom, fromLabel, `${fromLabel}: ${calendarLabel}`)}
    <span aria-hidden="true" class="text-[length:var(--pick-font)] text-slate-500">–</span>
    {@render dateField(to, onTo, toLabel, `${toLabel}: ${calendarLabel}`)}
  {:else}
    {@render dateField(value, onChange, message, calendarLabel)}
  {/if}
</div>
