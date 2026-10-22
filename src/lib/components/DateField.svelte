<script lang="ts">
  // The date field: one editable text field (the shared `TextInput`) plus a
  // portalled month-grid popover. The calendar icon sits inside the field and
  // opens the panel; typed text is filtered to the characters the `format`
  // pattern can contain and parsed strictly on commit (filter and revert, never
  // an error state). With `time`, the panel gains an hour/minute row and the
  // value carries a time. `DateInput` composes one field for a single date, or
  // two for a range pair, so the calendar lives here once.
  import { tick } from 'svelte'
  import { createFocusoutClose } from '$lib/actions/use-focusout-close'
  import { useDropdown } from '$lib/actions/use-dropdown.svelte'
  import { positionPanel } from '$lib/position-panel.svelte'
  import CalendarIcon from '$lib/icons/CalendarIcon.svelte'
  import CaretLeftIcon from '$lib/icons/CaretLeftIcon.svelte'
  import CaretRightIcon from '$lib/icons/CaretRightIcon.svelte'
  import CloseIcon from '$lib/icons/CloseIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import type { SizeInput } from '$lib/size-scale'
  import Button from './Button.svelte'
  import NumberInput from './NumberInput.svelte'
  import TextInput from './TextInput.svelte'
  import { dimensionMetrics, sizeVarAction } from './size-metrics'
  import {
    DATETIME_VALUE_FORMAT,
    DEFAULT_DATE_FORMAT,
    dayAtTime,
    formatDate,
    parsePattern,
    patternWidth,
    todayIso,
    valueDay,
    type DateFieldSibling,
    type DateSpan,
  } from './date-input-core'
  import { PICKER_RATIOS, type DateInputTheme } from './date-input-metrics'
  import { createCalendarGrid } from './use-calendar-grid.svelte'
  import { createDateTextField } from './use-date-text-field.svelte'
  import { createTimeSegments } from './use-time-segments.svelte'

  const i18n = getI18nContext()

  interface Props {
    value?: string
    onChange?: (value: string) => void
    size?: SizeInput
    // Display pattern, and the pattern the typed text is parsed against
    // (`DateInput` resolves the default from `time` and passes it here).
    format: string
    // Edit a date-time: the panel gains an hour/minute row and the value is
    // serialized as `${date}T${HH:mm:ss}`.
    time?: boolean
    // Person-facing name of this field ("Select date", "From"), used to label
    // it and as its default placeholder.
    label: string
    // Accessible name for the calendar affordance inside the field.
    actionLabel: string
    theme?: DateInputTheme
    // Keep the panel open after a pick, so the time can be set.
    closeOnSelect?: boolean
    // The pair's other end (a range field): the day it holds and the action
    // that takes the focus there. A field that is filled while the other end
    // is empty hands the focus over, so the range continues in the next field.
    sibling?: DateFieldSibling
    // The span the calendar highlights: the days between the two bounds read
    // as one highlighted range, its ends as the selected days.
    highlight?: DateSpan
  }

  let {
    value = '',
    onChange,
    size = 'md',
    format,
    time = false,
    label,
    actionLabel,
    theme = {},
    closeOnSelect = true,
    sibling,
    highlight,
  }: Props = $props()

  const metrics = $derived(dimensionMetrics(size, PICKER_RATIOS))

  // A value that does not parse strictly under `valueFormat` reads as unset
  // rather than poisoning comparisons.
  const valueFormat = $derived(time ? DATETIME_VALUE_FORMAT : DEFAULT_DATE_FORMAT)
  const committed = $derived(parsePattern(value, valueFormat, i18n.locale))
  const single = $derived(committed ? committed.format(DEFAULT_DATE_FORMAT) : '')
  // A value carrying a time means a pick keeps that time when only the day
  // changes.
  const hasTime = $derived(/[Hhms]/.test(valueFormat))
  const hasValue = $derived(!!committed)
  // The day the closed or freshly opened grid anchors on: the field's own
  // value, else the pair's other end (the calendar opens on the month the
  // range already sits in), else today.
  const anchorDay = $derived(single || sibling?.day || todayIso())
  // The highlighted span: the two bounds and the days between them.
  const spanStart = $derived(highlight?.from ?? '')
  const spanEnd = $derived(highlight?.to ?? '')
  // The rendered text for the committed value, used by the field and the summary.
  const committedText = $derived(committed ? formatDate(value, format, i18n.locale) : '')

  let open = $state(false)
  let containerRef = $state<HTMLDivElement | null>(null)
  let panelRef = $state<HTMLDivElement | null>(null)
  let fieldRef = $state<HTMLInputElement | null>(null)

  // The month grid: view cursor, roving focus, day nodes, and the re-anchor
  // rules that keep it on the committed value.
  const grid = createCalendarGrid({
    getOpen: () => open,
    getSingle: () => single,
    getAnchorDay: () => anchorDay,
    getLocale: () => i18n.locale,
  })

  // The editable field: its draft text and the filter/parse/revert commit.
  const field = createDateTextField({
    getValue: () => value,
    getValueFormat: () => valueFormat,
    getFormat: () => format,
    getLocale: () => i18n.locale,
    getCommittedText: () => committedText,
    getHasValue: () => hasValue,
    getSingle: () => single,
    getOpen: () => open,
    onChange: next => commitValue(next),
    previewTo: day => grid.anchorView(day),
    openPanel: () => openPanel(),
  })

  // The field's own text (also the panel summary), and its accessible name: the
  // in-field name, plus the committed text once there is one.
  const fieldText = $derived(committedText || label)
  const fieldAriaLabel = $derived(committedText ? `${label}: ${committedText}` : label)
  const panelAriaLabel = $derived(i18n.t('date.calendar'))
  const clearLabel = $derived(i18n.t('date.clear'))
  // The footer's clear cross rides a trimmed share of the icon slot (the share
  // the other affordance glyphs take), so it reads lighter than the calendar
  // glyph it sits beside.
  const clearIconSize = $derived(metrics.icon * 0.8)
  // The field hugs its own text rather than growing to fill the row: the
  // pattern's width in `ch` (of the input's own font) plus the chrome the input
  // actually carries — its own horizontal padding and the calendar gutter — so
  // the value sits close to the affordance instead of leaving slack beside it.
  const fieldWidth = $derived(
    `calc(${patternWidth(format)}ch + var(--input-pad-x) + var(--pick-pad-x) + var(--pick-icon) + var(--pick-gap) + 2px)`,
  )

  const isSelected = (day: string) => day === (field.previewDay || single)
  // The span's own ends read as the selected days; the days between them read
  // as one highlighted range.
  const isSpanEnd = (day: string) => !!spanStart && !!spanEnd && (day === spanStart || day === spanEnd)
  const inSpan = (day: string) => !!spanStart && !!spanEnd && day > spanStart && day < spanEnd
  // The whole highlighted span: its two bounds and the days between them. AT
  // reads every one of them as a selected cell, so the range is not carried by
  // the tint alone.
  const isRangeDay = (day: string) => isSpanEnd(day) || inSpan(day)

  function close(restoreFocus = false) {
    if (!open) return
    open = false
    // A draft is not a value: dropping the preview restores the value's highlight.
    field.previewDay = ''
    if (restoreFocus) void tick().then(() => fieldRef?.focus())
  }

  function openPanel() {
    const anchor = anchorDay
    grid.anchorView(anchor)
    open = true
    // The panel is rendered after the flush; focus the selected (or today's)
    // day once its button exists.
    void tick().then(() => grid.focusDayNode(anchor))
  }

  // Take the focus and open the panel: the pair's other end hands the focus
  // here once this field is filled, so the calendar opens where the range
  // continues. The anchor day is the one the pair hands over (the end that was
  // filled), else this field's own value, else today.
  export function focusAndOpen(day?: string) {
    grid.anchorView(day || anchorDay)
    open = true
    // The panel is rendered after the flush; the focus stays in the field, so
    // the user can keep typing into it.
    void tick().then(() => fieldRef?.focus())
  }

  // Commit a value. A field that is filled while the pair's other end is still
  // empty hands the focus over to it: the range continues in the next field.
  function commitValue(next: string, handOff = true) {
    onChange?.(next)
    if (!handOff || !next || !sibling || sibling.day) return
    // The calendar goes with the focus, so only one panel stays open.
    close()
    sibling.focusAndOpen(valueDay(next, valueFormat, i18n.locale))
  }

  function toggle() {
    if (open) close()
    else openPanel()
  }

  function selectDay(day: string) {
    // A field whose value carries a time keeps it when only the day changes.
    // A pick that keeps the panel open (the time row) does not hand the focus
    // over: the user is still working in this field.
    commitValue(dayAtTime(day, hasTime ? committed : null).format(valueFormat), closeOnSelect)
    if (closeOnSelect) close(true)
    else grid.setFocusDay(day)
  }

  function clear() {
    onChange?.('')
  }

  // The time row (rendered in the panel when `time`): the committed value's own
  // segments, edited through the shared carry-on-step helper.
  const timeSegments = createTimeSegments(
    () => value,
    next => onChange?.(next),
  )

  const handleFocusOut = createFocusoutClose(
    () => open,
    () => ({ container: containerRef, panel: panelRef }),
    () => close(),
  )

  useDropdown(() => ({
    isOpen: () => open,
    container: () => containerRef,
    onOutsideClick: () => close(),
    onEscape: () => {
      close(true)
    },
    panel: () => panelRef,
  }))
</script>

{#snippet calendarGlyph()}
  <CalendarIcon />
{/snippet}

{#snippet clearGlyph()}
  <CloseIcon />
{/snippet}

{#snippet calendarButton()}
  <!-- The field's right-hand affordance: it opens the panel from inside the
       field (the input's gutter class reserves the room it occupies). -->
  <span class="absolute inset-y-0 right-[var(--pick-pad-x)] flex items-center">
    <Button
      variant="ghost"
      size={metrics.icon}
      icon={calendarGlyph}
      ariaLabel={actionLabel}
      preventFocusSteal
      onClick={toggle} />
  </span>
{/snippet}

<div class="relative" bind:this={containerRef} onfocusout={handleFocusOut}>
  <!-- The field is the shared text field (its own `--input-*` chrome), with the
       calendar icon inside it and its text validated against `format` on
       commit. `DateInput` supplies the `--pick-*` set this gutter reads, and the
       field hugs the pattern's own text.
  -->
  <TextInput
    bind:inputRef={fieldRef}
    bind:value={field.draft}
    ariaLabel={fieldAriaLabel}
    aria-haspopup="dialog"
    aria-expanded={open}
    autocomplete="off"
    placeholder={label}
    {size}
    inputStyle="width:{fieldWidth}"
    className="pr-[calc(var(--pick-pad-x)+var(--pick-icon)+var(--pick-gap))]"
    trailing={calendarButton}
    oninput={field.onFieldInput}
    onblur={field.commitFieldText}
    onkeydown={field.onFieldKeydown} />

  {#if open}
    <!-- The panel is portalled to `document.body` by `positionPanel`, so it
         cannot inherit the root's `--pick-*` set; `sizeVarAction` writes the
         same variables onto the panel itself, so it resizes with `size`. -->
    <div
      bind:this={panelRef}
      role="dialog"
      aria-label={panelAriaLabel}
      use:positionPanel={() => ({
        getTrigger: () => fieldRef,
        getOpen: () => open,
        align: 'left',
        autoPlace: true,
      })}
      use:sizeVarAction={{ prefix: 'pick', metrics }}
      class="fixed top-0 left-0 z-40 w-[var(--pick-panel-width)] max-w-[calc(100vw-1rem)] rounded-[var(--pick-panel-radius)] border border-slate-700 bg-slate-900/95 p-[var(--pick-panel-pad)] shadow-2xl shadow-slate-950/60 backdrop-blur">
      <div class="mb-[var(--pick-block-gap)] flex items-center justify-between gap-[var(--pick-tight-gap)]">
        <button
          type="button"
          aria-label={i18n.t('date.prevMonth')}
          onclick={grid.prevMonth}
          class={`flex h-[var(--pick-nav-size)] w-[var(--pick-nav-size)] items-center justify-center rounded-[var(--pick-radius)] transition outline-none motion-reduce:transition-none ${theme.navButton ?? 'text-slate-400 hover:bg-slate-800 hover:text-cyan-300'}`}>
          <CaretLeftIcon size={metrics.icon} />
        </button>
        <span class="text-[length:var(--pick-sm-font)] font-semibold text-slate-200">{grid.monthLabel}</span>
        <button
          type="button"
          aria-label={i18n.t('date.nextMonth')}
          onclick={grid.nextMonth}
          class={`flex h-[var(--pick-nav-size)] w-[var(--pick-nav-size)] items-center justify-center rounded-[var(--pick-radius)] transition outline-none motion-reduce:transition-none ${theme.navButton ?? 'text-slate-400 hover:bg-slate-800 hover:text-cyan-300'}`}>
          <CaretRightIcon size={metrics.icon} />
        </button>
      </div>

      <div
        bind:this={grid.gridRef}
        class="grid grid-cols-7 gap-[var(--pick-tight-gap)]"
        role="grid"
        aria-label={panelAriaLabel}
        aria-multiselectable={highlight ? 'true' : undefined}>
        <div class="contents" role="row">
          {#each grid.weekdayLabels as label}
            <div
              role="columnheader"
              class={`py-[var(--pick-tight-pad-y)] text-center text-[length:var(--pick-head-font)] font-semibold uppercase ${theme.columnHeader ?? 'text-slate-500'}`}>
              {label}
            </div>
          {/each}
        </div>
        {#each grid.weeks as week}
          <div class="contents" role="row">
            {#each week as cell, ci (cell.day ?? `blank-${ci}`)}
              <div
                role="gridcell"
                aria-selected={cell.day ? isSelected(cell.day) || isRangeDay(cell.day) : undefined}
                class="flex justify-center">
                {#if cell.day}
                  {@const selected = isSelected(cell.day)}
                  {@const spanBound = isSpanEnd(cell.day)}
                  {@const between = inSpan(cell.day)}
                  <button
                    type="button"
                    use:grid.dayRef={cell.day}
                    tabindex={cell.day === grid.focusDay ? 0 : -1}
                    aria-label={cell.aria}
                    aria-current={cell.day === todayIso() ? 'date' : undefined}
                    onclick={() => selectDay(cell.day as string)}
                    onkeydown={event => grid.onDayKeydown(event, cell.day as string)}
                    class={`flex h-[var(--pick-cell-size)] w-[var(--pick-cell-size)] items-center justify-center rounded-[var(--pick-radius)] text-[length:var(--pick-sm-font)] transition outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 motion-reduce:transition-none ${
                      selected || spanBound
                        ? 'bg-cyan-500 font-semibold text-onaccent'
                        : between
                            ? `underline decoration-dotted underline-offset-2 ${theme.rangeSpan ?? 'bg-cyan-500/15 text-cyan-100'}`
                            : cell.day === todayIso()
                                ? `font-semibold ${theme.today ?? 'text-cyan-300'} hover:bg-slate-800`
                                : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}>
                    {grid.numberFormat.format(cell.label)}
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>

      {#if time}
        <!-- The hour/minute/second row: each field's panel can set its own
             time, so `time` and a range pair coexist. The boxes are steppable
             and carry no min/max, so a step past a segment's own range carries
             into the next unit (rolling the date at the top of the day)
             instead of stopping at the edge; each shows its two digits. -->
        <div class="mt-[var(--pick-block-gap)] flex items-center gap-[var(--pick-tight-gap)] border-t border-slate-800 pt-[var(--pick-block-gap)]">
          <NumberInput
            value={timeSegments.hourText}
            {size}
            ariaLabel={i18n.t('time.hour')}
            oninput={event => timeSegments.setSegment('hour', (event.target as HTMLInputElement).value)} />
          <span aria-hidden="true" class="text-[length:var(--pick-sm-font)] text-slate-500">:</span>
          <NumberInput
            value={timeSegments.minuteText}
            {size}
            ariaLabel={i18n.t('time.minute')}
            oninput={event => timeSegments.setSegment('minute', (event.target as HTMLInputElement).value)} />
          <span aria-hidden="true" class="text-[length:var(--pick-sm-font)] text-slate-500">:</span>
          <NumberInput
            value={timeSegments.secondText}
            {size}
            ariaLabel={i18n.t('time.second')}
            oninput={event => timeSegments.setSegment('second', (event.target as HTMLInputElement).value)} />
        </div>
      {/if}

      <div class="mt-[var(--pick-block-gap)] flex items-center justify-between gap-[var(--pick-tight-gap)] border-t border-slate-800 pt-[var(--pick-block-gap)]">
        <span class={`min-w-0 truncate text-[length:var(--pick-sm-font)] ${theme.metaText ?? 'text-slate-500'}`}>{fieldText}</span>
        <!-- The clear affordance is the field's own cross (the shared icon-only
             `Button`), not a text label: it reads as "clear" anywhere in the
             suite, and its accessible name still spells it out. -->
        <Button
          variant="ghost"
          size={clearIconSize}
          icon={clearGlyph}
          ariaLabel={clearLabel}
          tooltip={clearLabel}
          disabled={!hasValue}
          onClick={clear} />
      </div>
    </div>
  {/if}
</div>
