<script lang="ts">
  import DateRangePicker from '$lib/components/DateRangePicker.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { resetToggle } from '$lib/showcase/snippet-field'
  import {
    buildDateRangePickerSnippet,
    DATE_STAGE_CONTENT,
    DATE_STAGE_DEFAULT_WIDTH,
    DATE_STAGE_MIN_WIDTH,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. The two range ends are committed state seeded
  // from the empty range (the component default, shown in the Value column),
  // so the cleared form applies no overrides. Clearing a Value unsets it;
  // Reset restores the defaults below. Stage width is
  // interaction state, not a curated option; Reset restores it.
  const INITIAL = {
    from: '',
    fromOn: true,
    to: '',
    toOn: true,
    stageWidth: DATE_STAGE_DEFAULT_WIDTH,
  }
  let pg = $state(structuredClone(INITIAL))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() => buildDateRangePickerSnippet({ from: pg.from, to: pg.to }))

  
  // Editable rows first (A–Z), then the read-only data and function props.
  // The two range ends are the valid `from`/`to` primitives, so the converted
  // page keeps its editable Value column and the demo stays driveable there;
  // the `theme` object stays a read-only row.
  const fields: SyncableFieldConfig[] = $derived([
    {
      name: 'from',
      type: 'string',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Range start as YYYY-MM-DD; an invalid date reads as unset; the eye resets to the default.',
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
    {
      name: 'to',
      type: 'string',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Range end as YYYY-MM-DD; an invalid date reads as unset; the eye resets to the default.',
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
      name: 'theme',
      type: 'DateRangePickerTheme',
      defaultValue: '—',
      note: 'Optional per-part color overrides; omitted keys keep the app palette.',
    },
    {
      name: 'onFrom',
      type: '(value: string) => void',
      defaultValue: '—',
      note: 'Called with the picked start (or reset).',
    },
    {
      name: 'onTo',
      type: '(value: string) => void',
      defaultValue: '—',
      note: 'Called with the picked end (or reset).',
    },
  ])

</script>

<ShowcasePage
    {fields}
    title="DateRangePicker"
    {code}
    onReset={clearPlayground}
    stage={{ minWidth: DATE_STAGE_MIN_WIDTH }}
    bind:stageWidth={pg.stageWidth}

    sync={{ tag: 'DateRangePicker' }}
    scope={{}}
  >
    <div class={DATE_STAGE_CONTENT}>
      <DateRangePicker
        from={pg.from}
        to={pg.to}
        onFrom={value => (pg.from = value)}
        onTo={value => (pg.to = value)} />
      <span class="text-sm text-slate-400">range: {pg.from || '—'} – {pg.to || '—'}</span>
    </div>
  </ShowcasePage>
