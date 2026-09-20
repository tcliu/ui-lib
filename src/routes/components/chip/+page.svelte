<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Chip from '$lib/components/Chip.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { DEFAULT_CHIP_CLASS, buildChipSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgMode = $state('')
  let pgLabel = $state('')
  let pgChipClass = $state('')
  let pgActive = $state<TriState>('')
  let pgRemoved = $state(false)

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const modeOptions = [
    { value: 'removable', label: 'Removable' },
    { value: 'toggle', label: 'Toggle' },
  ]
  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const demoLabel = $derived(pgLabel || i18n.t('showcase.default'))
  const demoChipClass = $derived(pgChipClass || DEFAULT_CHIP_CLASS)
  const active = $derived(flagOn(pgActive))
  const chipActive = $derived(pgActive === 'yes')

  const isCustomized = $derived(pgMode !== '' || pgLabel !== '' || pgChipClass !== '' || pgActive !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgMode = ''
    pgLabel = ''
    pgChipClass = ''
    pgActive = ''
    pgRemoved = false
  }

  const code = $derived.by(() =>
    buildChipSnippet({ mode: pgMode, label: pgLabel, chipClass: pgChipClass, active: pgActive })
  )

  const props: PropRow[] = [
    { name: 'label', type: 'string', defaultValue: '—', note: 'Pill text.' },
    { name: 'chipClass', type: 'string', defaultValue: '—', note: 'Color and shape classes.' },
    { name: 'style', type: 'string', defaultValue: "''", note: 'Inline style for the pill.' },
    { name: 'ariaLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the remove button.' },
    { name: 'removeButtonClass', type: 'string', defaultValue: "''", note: 'Extra classes for the remove button.' },
    { name: 'removeButtonStyle', type: 'string', defaultValue: "''", note: 'Inline style for the remove button.' },
    { name: 'tooltip', type: 'string', defaultValue: '—', note: 'Tooltip text for the pill.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the remove/toggle button.' },
    { name: 'onRemove', type: '() => void', defaultValue: '—', note: 'Renders the remove button.' },
    { name: 'active', type: 'boolean', defaultValue: 'false', note: 'Pressed state in toggle mode.' },
    { name: 'onclick', type: '() => void', defaultValue: '—', note: 'Renders the toggle button instead of the static pill.' },
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
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>
      Reset
    </Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Mode">
      <SelectDropdown
        buttonLabel={pgMode ? (pgMode === 'removable' ? 'Removable' : 'Toggle') : 'Static'}
        activeValue={pgMode}
        ariaLabel="Mode"
        options={modeOptions}
        onSelect={value => (pgMode = value)}
        clearable
        clearLabel="Clear mode"
        onClear={() => {
          pgMode = ''
          pgRemoved = false
        }} />
    </FormField>
    <FormField label="Label" htmlFor="pg-label">
      <input
        id="pg-label"
        bind:value={pgLabel}
        placeholder="Default"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Chip class" htmlFor="pg-chipclass">
      <input
        id="pg-chipclass"
        bind:value={pgChipClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Active">
      <SelectDropdown
        buttonLabel={triLabel(pgActive)}
        activeValue={pgActive}
        ariaLabel="Active"
        options={yesNoOptions}
        onSelect={value => (pgActive = value as TriState)}
        clearable
        clearLabel="Clear active"
        onClear={() => (pgActive = '')} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Chip" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    code={code}
    footer={settingsPanel}
    scope={{ defaultLabel: i18n.t('showcase.default'), chipActive, removed: pgRemoved }}>
    {#if pgMode === 'removable'}
      {#if !pgRemoved}
        <Chip label={demoLabel} chipClass={demoChipClass} onRemove={() => (pgRemoved = true)} />
      {/if}
    {:else if pgMode === 'toggle'}
      <Chip
        label={demoLabel}
        chipClass={demoChipClass}
        {active}
        onclick={() => (pgActive = pgActive === 'yes' ? 'no' : 'yes')} />
    {:else}
      <Chip label={demoLabel} chipClass={demoChipClass} />
    {/if}
  </ShowcaseSection>
</ShowcasePage>
