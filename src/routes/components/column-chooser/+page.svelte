<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import ColumnChooser from '$lib/components/ColumnChooser.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { CHOOSER_LABEL, CHOOSER_RESET_LABEL, DEMO_COLUMNS, buildColumnChooserSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  const columns = DEMO_COLUMNS

  // Hidden keys drive the chooser's unchecked rows; the demo owns this state and
  // feeds it to the component, exactly as DataTable does.
  let hidden = $state(new Set<string>())

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgLabel = $state('')
  let pgResetLabel = $state('')

  const chooserLabel = $derived(pgLabel || CHOOSER_LABEL)
  const resetLabel = $derived(pgResetLabel || CHOOSER_RESET_LABEL)

  const isCustomized = $derived(pgLabel !== '' || pgResetLabel !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  // Fresh empty set behind a helper: assigning `new Set()` inline to snippet
  // state makes the compiler emit a legacy `init()` call, which throws when the
  // playground mounts the snippet at the root.
  function clearedColumns(): Set<string> {
    return new Set<string>()
  }

  function handleToggleColumn(key: string, checked: boolean): void {
    const next = new Set(hidden)
    if (checked) {
      next.delete(key)
    } else {
      next.add(key)
    }
    hidden = next
  }

  function handleResetColumns(): void {
    hidden = clearedColumns()
  }

  function clearPlayground(): void {
    pgLabel = ''
    pgResetLabel = ''
    hidden = clearedColumns()
  }

  const code = $derived.by(() => buildColumnChooserSnippet({ label: pgLabel, resetLabel: pgResetLabel }))

  const props: PropRow[] = [
    { name: 'label', type: 'string', defaultValue: '—', note: 'Accessible name and tooltip for the trigger.' },
    {
      name: 'resetLabel',
      type: 'string',
      defaultValue: '—',
      note: 'Accessible name and tooltip for the reset button.',
    },
    {
      name: 'columns',
      type: 'ChooserColumn[]',
      defaultValue: '—',
      note: 'Entries with key, header, and checked state.',
    },
    {
      name: 'onToggle',
      type: '(key: string, checked: boolean) => void',
      defaultValue: '—',
      note: 'Fires when a column checkbox changes.',
    },
    { name: 'onReset', type: '() => void', defaultValue: '—', note: 'Fires when the reset button is pressed.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Trigger label" htmlFor="pg-chooser-label">
      <input
        id="pg-chooser-label"
        bind:value={pgLabel}
        placeholder="Choose columns"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Reset label" htmlFor="pg-chooser-reset">
      <input
        id="pg-chooser-reset"
        bind:value={pgResetLabel}
        placeholder="Reset columns"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="ColumnChooser" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{
      hidden,
      chooserLabel: CHOOSER_LABEL,
      resetLabel: CHOOSER_RESET_LABEL,
      handleToggleColumn,
      handleResetColumns,
    }}>
    <ColumnChooser
      label={chooserLabel}
      {resetLabel}
      columns={columns.map(column => ({
        key: column.key,
        header: column.header,
        checked: !hidden.has(column.key),
      }))}
      onToggle={handleToggleColumn}
      onReset={handleResetColumns} />
    <span class="text-sm text-slate-400">hidden: {hidden.size}</span>
  </ShowcaseSection>
</ShowcasePage>
