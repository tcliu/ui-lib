<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import DateRangePicker from '$lib/components/DateRangePicker.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildDateRangePickerSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Empty strings render the unset range, so the
  // cleared form applies no overrides.
  let pgFrom = $state('')
  let pgTo = $state('')

  const isCustomized = $derived(pgFrom !== '' || pgTo !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgFrom = ''
    pgTo = ''
  }

  const code = $derived.by(() => buildDateRangePickerSnippet({ from: pgFrom, to: pgTo }))

  const props: PropRow[] = [
    { name: 'from', type: 'string', defaultValue: "''", note: 'Range start as YYYY-MM-DD; invalid reads as unset.' },
    { name: 'to', type: 'string', defaultValue: "''", note: 'Range end as YYYY-MM-DD; invalid reads as unset.' },
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
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon className="h-4 w-4" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="From" htmlFor="pg-from">
      <input
        id="pg-from"
        bind:value={pgFrom}
        placeholder="YYYY-MM-DD"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="To" htmlFor="pg-to">
      <input
        id="pg-to"
        bind:value={pgTo}
        placeholder="YYYY-MM-DD"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="DateRangePicker" props={propsSnippet}>
  <ShowcaseSection title={sectionTitle} {code} footer={settingsPanel} scope={{ from: pgFrom, to: pgTo }}>
    <div class="flex flex-col gap-1">
      <DateRangePicker from={pgFrom} to={pgTo} onFrom={value => (pgFrom = value)} onTo={value => (pgTo = value)} />
      <span class="text-sm text-slate-400">range: {pgFrom || '—'} – {pgTo || '—'}</span>
    </div>
  </ShowcaseSection>
</ShowcasePage>
