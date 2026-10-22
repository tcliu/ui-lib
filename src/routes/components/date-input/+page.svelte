<script lang="ts">
  import DateInput from '$lib/components/DateInput.svelte'
  import { DEFAULT_DATE_FORMAT } from '$lib/components/date-input-core'
  import { DATE_STAGE_CONTENT, DATE_STAGE_DEFAULT_WIDTH, DATE_STAGE_MIN_WIDTH } from '$lib/showcase/date-stage'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { flagOn, type TriState } from '$lib/showcase/snippet-build'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { boolField, resetToggle, sizeField, textField } from '$lib/showcase/snippet-field'
  import { buildDateInputSnippet } from './demo-snippet'

  // Customizer playground state. The single value and the range pair are
  // committed state seeded from the empty value (the component default, shown in
  // the Value column), so the cleared form applies no overrides. `range` and
  // `time` start at their defaults, so the cleared form is one plain date field;
  // clearing a Value unsets it, and Reset restores the defaults. Stage width is
  // interaction state, not a curated option; Reset restores it.
  const INITIAL = {
    value: '',
    valueOn: true,
    from: '',
    fromOn: true,
    to: '',
    toOn: true,
    range: 'no' as TriState,
    rangeOn: false,
    time: 'no' as TriState,
    timeOn: false,
    format: DEFAULT_DATE_FORMAT,
    formatOn: false,
    placeholder: '',
    placeholderOn: false,
    closeOnSelect: 'no' as TriState,
    closeOnSelectOn: false,
    highlightRange: 'no' as TriState,
    highlightRangeOn: false,
    size: 'md',
    sizeOn: false,
    stageWidth: DATE_STAGE_DEFAULT_WIDTH,
  }
  let pg = $state(structuredClone(INITIAL))

  const demoFormat = $derived(pg.formatOn && pg.format ? pg.format : undefined)
  const demoPlaceholder = $derived(pg.placeholderOn && pg.placeholder ? pg.placeholder : undefined)
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  // The flags drive which prop set the demo and Show-code carry: an eye off
  // omits the prop, keeping the committed value for re-applying.
  const demoRange = $derived(pg.rangeOn ? flagOn(pg.range) : undefined)
  const demoTime = $derived(pg.timeOn ? flagOn(pg.time) : undefined)
  const demoCloseOnSelect = $derived(pg.closeOnSelectOn ? flagOn(pg.closeOnSelect) : undefined)
  const demoHighlightRange = $derived(pg.highlightRangeOn ? flagOn(pg.highlightRange) : undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildDateInputSnippet({
      value: pg.value,
      from: pg.from,
      to: pg.to,
      range: pg.rangeOn ? pg.range : '',
      time: pg.timeOn ? pg.time : '',
      format: pg.format,
      formatOn: pg.formatOn,
      placeholder: pg.placeholder,
      placeholderOn: pg.placeholderOn,
      closeOnSelect: pg.closeOnSelectOn ? pg.closeOnSelect : '',
      highlightRange: pg.highlightRangeOn ? pg.highlightRange : '',
      size: pg.size,
      sizeOn: pg.sizeOn,
    }),
  )

  // Editable rows first (A–Z), then the read-only data and function props. The
  // single value and the two range ends are valid primitives, so the converted
  // page keeps its editable Value column and the demo stays driveable there;
  // the `theme` object stays a read-only row.
  const fields: SyncableFieldConfig[] = $derived([
    boolField({ name: 'closeOnSelect', defaultValue: 'auto', note: 'Close the panel after a day pick; unset follows the control default (closes unless `time` is on).', value: pg.closeOnSelect, onChange: v => (pg.closeOnSelect = v as TriState), enabled: pg.closeOnSelectOn, setEnabled: v => (pg.closeOnSelectOn = v) }),
    textField({ name: 'format', type: 'string?', defaultValue: "'YYYY-MM-DD'", note: 'Field pattern, dayjs tokens (YYYY, MM, DD, HH, mm, …); typed text is parsed against it and [bracketed] text is literal. Defaults to YYYY-MM-DD, or YYYY-MM-DD HH:mm:ss while `time` is on.', value: pg.format, onChange: v => (pg.format = v), editorDefaultValue: DEFAULT_DATE_FORMAT, clearable: true, placeholder: DEFAULT_DATE_FORMAT, enabled: pg.formatOn, setEnabled: v => (pg.formatOn = v) }),
    {
      name: 'from',
      type: 'string',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Range start as YYYY-MM-DD (a date-time while `time` is on); an invalid date reads as unset. Applies while `range` is on; the eye resets to the default.',
      editor: 'text',
      clearable: true,
      value: pg.from,
      onChange: value => {
        pg.from = value
        pg.fromOn = true
      },
      toggle: resetToggle(
        pg.fromOn,
        enabled => (pg.fromOn = enabled),
        () => (pg.from = ''),
      ),
      sync: { kind: 'script', attr: 'from', unsetAbsent: true },
    },
    boolField({ name: 'highlightRange', defaultValue: 'false', note: 'Highlight the days between the two ends in each end’s calendar, so the range reads as one span; the ends stay the selected days. Applies while `range` is on.', value: pg.highlightRange, onChange: v => (pg.highlightRange = v as TriState), enabled: pg.highlightRangeOn, setEnabled: v => (pg.highlightRangeOn = v) }),
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Prompt shown while the single field is empty; defaults to the shared message. A range pair names each field after its own end.', value: pg.placeholder, onChange: v => (pg.placeholder = v), clearable: true, enabled: pg.placeholderOn, setEnabled: v => (pg.placeholderOn = v) }),
    boolField({ name: 'range', defaultValue: 'false', note: 'Render a from/to pair of independent fields, each behaving as the single field with its own calendar.', value: pg.range, onChange: v => (pg.range = v as TriState), enabled: pg.rangeOn, setEnabled: v => (pg.rangeOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels. Scales every field and its calendar.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    boolField({ name: 'time', defaultValue: 'false', note: 'Edit a date-time: every panel gains an hour/minute/second row, and a range pairs two date-time fields. A segment stepped past its range carries into the next unit (23:59:59 + 1s rolls the date).', value: pg.time, onChange: v => (pg.time = v as TriState), enabled: pg.timeOn, setEnabled: v => (pg.timeOn = v) }),
    {
      name: 'to',
      type: 'string',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Range end as YYYY-MM-DD (a date-time while `time` is on); an invalid date reads as unset. Applies while `range` is on; the eye resets to the default.',
      editor: 'text',
      clearable: true,
      value: pg.to,
      onChange: value => {
        pg.to = value
        pg.toOn = true
      },
      toggle: resetToggle(
        pg.toOn,
        enabled => (pg.toOn = enabled),
        () => (pg.to = ''),
      ),
      sync: { kind: 'script', attr: 'to', unsetAbsent: true },
    },
    {
      name: 'value',
      type: 'string',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Selected date as YYYY-MM-DD (a date-time while `time` is on); an invalid date reads as unset. Applies while `range` is off. Typing is validated on commit (a valid date writes back, anything else reverts); the eye resets to the default.',
      editor: 'text',
      clearable: true,
      value: pg.value,
      onChange: value => {
        pg.value = value
        pg.valueOn = true
      },
      toggle: resetToggle(
        pg.valueOn,
        enabled => (pg.valueOn = enabled),
        () => (pg.value = ''),
      ),
      sync: { kind: 'script', attr: 'value', unsetAbsent: true },
    },
    {
      name: 'theme',
      type: 'DateInputTheme',
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
          from={pg.from}
          to={pg.to}
          onFrom={value => (pg.from = value)}
          onTo={value => (pg.to = value)}
          closeOnSelect={demoCloseOnSelect}
          highlightRange={demoHighlightRange}
          format={demoFormat}
          size={demoSize} />
        <span class="text-sm text-slate-400">range: {pg.from || '—'} – {pg.to || '—'}</span>
      {:else}
        <DateInput
          range={demoRange}
          time={demoTime}
          value={pg.value}
          onChange={value => (pg.value = value)}
          closeOnSelect={demoCloseOnSelect}
          highlightRange={demoHighlightRange}
          format={demoFormat}
          placeholder={demoPlaceholder}
          size={demoSize} />
        <span class="text-sm text-slate-400">value: {pg.value || '—'}</span>
      {/if}
    </div>
  </ShowcasePage>
