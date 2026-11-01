<script lang="ts">
  import DateInput from '$lib/components/DateInput.svelte'
  import { DEFAULT_DATE_FORMAT } from '$lib/components/date-input-core'
  import { DATE_STAGE_CONTENT, DATE_STAGE_DEFAULT_WIDTH, DATE_STAGE_MIN_WIDTH } from '$showcase/shell/date-stage'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/playground/size-input'
  import type { TriState } from '$showcase/playground/snippet-build'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import { boolField, sizeField, textField } from '$showcase/playground/snippet-field'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, stage, staged } from '$showcase/playground/staged'
  import { buildDateInputSnippet } from './demo-snippet'

  // Customizer playground state. The single value and the range pair are
  // committed state seeded from the empty value (the component default, shown in
  // the Value column), so the cleared form applies no overrides. `range` and
  // `time` start at their defaults, so the cleared form is one plain date field;
  // clearing a Value unsets it, and Reset restores the defaults. Stage width is
  // interaction state, not a curated option; Reset restores it.
  const INITIAL = {
    value: staged('', true),
    from: staged('', true),
    to: staged('', true),
    range: staged('no' as TriState),
    time: staged('no' as TriState),
    format: staged(DEFAULT_DATE_FORMAT),
    placeholder: staged(''),
    closeOnSelect: staged('no' as TriState),
    highlightRange: staged('no' as TriState),
    size: staged('md'),
    stageWidth: DATE_STAGE_DEFAULT_WIDTH,
  }
  let pg = $state(structuredClone(INITIAL))

  const demoFormat = $derived(applied(pg.format) || undefined)
  const demoPlaceholder = $derived(applied(pg.placeholder) || undefined)
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  // The flags drive which prop set the demo and Show-code carry: an eye off
  // omits the prop, keeping the committed value for re-applying.
  const demoRange = $derived(appliedFlag(pg.range))
  const demoTime = $derived(appliedFlag(pg.time))
  const demoCloseOnSelect = $derived(appliedFlag(pg.closeOnSelect))
  const demoHighlightRange = $derived(appliedFlag(pg.highlightRange))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildDateInputSnippet({
      value: pg.value,
      from: pg.from,
      to: pg.to,
      range: pg.range,
      time: pg.time,
      format: pg.format,
      placeholder: pg.placeholder,
      closeOnSelect: pg.closeOnSelect,
      highlightRange: pg.highlightRange,
      size: pg.size,
    }),
  )

  // Editable rows first (A–Z), then the read-only data and function props. The
  // single value and the two range ends are valid primitives, so the converted
  // page keeps its editable Value column and the demo stays driveable there;
  // the `theme` object stays a read-only row.
  const fields: SyncableFieldConfig[] = $derived([
    boolField({ name: 'closeOnSelect', defaultValue: 'auto', note: 'Close the panel after a day pick; unset follows the control default (closes unless `time` is on).', ...eyeFlag(pg.closeOnSelect) }),
    textField({ name: 'format', type: 'string?', defaultValue: "'YYYY-MM-DD'", note: 'Field pattern, dayjs tokens (YYYY, MM, DD, HH, mm, …); typed text is parsed against it and [bracketed] text is literal. Defaults to YYYY-MM-DD, or YYYY-MM-DD HH:mm:ss while `time` is on.', editorDefaultValue: DEFAULT_DATE_FORMAT, clearable: true, placeholder: DEFAULT_DATE_FORMAT, ...eye(pg.format) }),
    {
      name: 'from',
      type: 'string?',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Range start as YYYY-MM-DD (a date-time while `time` is on); an invalid date reads as unset. Applies while `range` is on; the eye resets to the default.',
      editor: 'text',
      clearable: true,
      ...eye(pg.from),
      onChange: value => stage(pg.from, value),
      toggle: eyeResetToggle(pg.from, () => (pg.from.value = '')),
      sync: { kind: 'script', attr: 'from', unsetAbsent: true },
    },
    boolField({ name: 'highlightRange', defaultValue: 'false', note: 'Highlight the days between the two ends in each end’s calendar, so the range reads as one span; the ends stay the selected days. Applies while `range` is on.', ...eyeFlag(pg.highlightRange) }),
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Prompt shown while the single field is empty; defaults to the shared message. A range pair names each field after its own end.', clearable: true, ...eye(pg.placeholder) }),
    boolField({ name: 'range', defaultValue: 'false', note: 'Render a from/to pair of independent fields, each behaving as the single field with its own calendar.', ...eyeFlag(pg.range) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels. Scales every field and its calendar.', ...eye(pg.size) }),
    boolField({ name: 'time', defaultValue: 'false', note: 'Edit a date-time: every panel gains an hour/minute/second row, and a range pairs two date-time fields. A segment stepped past its range carries into the next unit (23:59:59 + 1s rolls the date).', ...eyeFlag(pg.time) }),
    {
      name: 'to',
      type: 'string?',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Range end as YYYY-MM-DD (a date-time while `time` is on); an invalid date reads as unset. Applies while `range` is on; the eye resets to the default.',
      editor: 'text',
      clearable: true,
      ...eye(pg.to),
      onChange: value => stage(pg.to, value),
      toggle: eyeResetToggle(pg.to, () => (pg.to.value = '')),
      sync: { kind: 'script', attr: 'to', unsetAbsent: true },
    },
    {
      name: 'value',
      type: 'string?',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Selected date as YYYY-MM-DD (a date-time while `time` is on); an invalid date reads as unset. Applies while `range` is off. Typing is validated on commit (a valid date writes back, anything else reverts); the eye resets to the default.',
      editor: 'text',
      clearable: true,
      ...eye(pg.value),
      onChange: value => stage(pg.value, value),
      toggle: eyeResetToggle(pg.value, () => (pg.value.value = '')),
      sync: { kind: 'script', attr: 'value', unsetAbsent: true },
    },
    {
      name: 'theme',
      type: 'DateInputTheme?',
      defaultValue: '—',
      note: 'Optional per-part color overrides; omitted keys keep the app palette.',
    },
    {
      name: 'onChange',
      type: '(value: string) => void',
      defaultValue: '—',
      note: 'Called with the picked date (or reset) while `range` is off.',
    },
    {
      name: 'onFrom',
      type: '(value: string) => void',
      defaultValue: '—',
      note: 'Called with the picked range start (or reset).',
    },
    {
      name: 'onTo',
      type: '(value: string) => void',
      defaultValue: '—',
      note: 'Called with the picked range end (or reset).',
    },
  ])
</script>

<ShowcasePage
    {fields}
    title="DateInput"
    {code}
    onReset={clearPlayground}
    stage={{ minWidth: DATE_STAGE_MIN_WIDTH }}
    bind:stageWidth={pg.stageWidth}

    sync={{ tag: 'DateInput' }}
    scope={{}}
  >
    <div class={DATE_STAGE_CONTENT}>
      {#if demoRange}
        <DateInput
          range
          time={demoTime}
          from={pg.from.value}
          to={pg.to.value}
          onFrom={value => (pg.from.value = value)}
          onTo={value => (pg.to.value = value)}
          closeOnSelect={demoCloseOnSelect}
          highlightRange={demoHighlightRange}
          format={demoFormat}
          size={demoSize} />
        <span class="text-sm text-slate-400">range: {pg.from.value || '—'} – {pg.to.value || '—'}</span>
      {:else}
        <DateInput
          range={demoRange}
          time={demoTime}
          value={pg.value.value}
          onChange={value => (pg.value.value = value)}
          closeOnSelect={demoCloseOnSelect}
          highlightRange={demoHighlightRange}
          format={demoFormat}
          placeholder={demoPlaceholder}
          size={demoSize} />
        <span class="text-sm text-slate-400">value: {pg.value.value || '—'}</span>
      {/if}
    </div>
  </ShowcasePage>
