<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import ChipDropdown from '$lib/components/ChipDropdown.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildChipDropdownSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  interface Option {
    value: string
    label: string
  }

  const options: Option[] = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'archived', label: 'Archived' },
  ]

  function labelFor(list: Option[], current: string): string {
    return list.find(option => option.value === current)?.label ?? current
  }

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgValue = $state('active')
  let pgVariant = $state('')
  let pgFilterable = $state<TriState>('')
  let pgDisabled = $state<TriState>('')
  let pgAlign = $state('')
  let pgFilterPlaceholder = $state('')

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoVariant = $derived(
    (pgVariant || undefined) as 'sky' | 'violet' | 'amber' | 'fuchsia' | 'emerald' | undefined,
  )
  const filterable = $derived(flagOn(pgFilterable))
  const disabled = $derived(flagOn(pgDisabled))
  const demoAlign = $derived((pgAlign || undefined) as 'left' | 'right' | undefined)

  const variantOptions = ['sky', 'violet', 'amber', 'fuchsia', 'emerald'].map(value => ({ value, label: value }))
  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]
  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(
    pgVariant !== '' || pgFilterable !== '' || pgDisabled !== '' || pgAlign !== '' || pgFilterPlaceholder !== '',
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgValue = 'active'
    pgVariant = ''
    pgFilterable = ''
    pgDisabled = ''
    pgAlign = ''
    pgFilterPlaceholder = ''
  }

  const code = $derived.by(() =>
    buildChipDropdownSnippet({
      variant: pgVariant,
      filterable: pgFilterable,
      disabled: pgDisabled,
      align: pgAlign,
      filterPlaceholder: pgFilterPlaceholder,
    }),
  )

  const props: PropRow[] = [
    { name: 'label', type: 'string', defaultValue: '—', note: 'Trigger chip text; usually the selected label.' },
    { name: 'options', type: '{ value: string; label: string }[]', defaultValue: '—', note: 'Selectable chips.' },
    { name: 'activeValue', type: 'string', defaultValue: "''", note: 'Committed value; marked in the panel.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the trigger.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the trigger.' },
    {
      name: 'variant',
      type: "'sky' | 'violet' | 'amber' | 'fuchsia' | 'emerald'",
      defaultValue: "'violet'",
      note: 'Chip color scheme.',
    },
    { name: 'buttonClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the trigger chip classes.' },
    { name: 'filterable', type: 'boolean', defaultValue: 'false', note: 'Adds a search field to the panel.' },
    { name: 'filterPlaceholder', type: 'string', defaultValue: "'Search…'", note: 'Search input placeholder.' },
    {
      name: 'emptyText',
      type: 'string',
      defaultValue: "'No results.'",
      note: 'Shown when the filtered panel is empty.',
    },
    { name: 'onSelect', type: '(value: string) => void', defaultValue: '—', note: 'Called with the chosen value.' },
    { name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger.' },
    { name: 'autoPlace', type: 'boolean', defaultValue: 'true', note: 'Flips the panel when crowded.' },
    { name: 'panelClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the floating panel classes.' },
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
    <FormField label="Variant">
      <SelectDropdown
        buttonLabel={pgVariant || 'Default'}
        activeValue={pgVariant}
        ariaLabel="Variant"
        options={variantOptions}
        onSelect={value => (pgVariant = value)}
        clearable
        clearLabel="Clear variant"
        onClear={() => (pgVariant = '')} />
    </FormField>
    <FormField label="Filterable">
      <SelectDropdown
        buttonLabel={triLabel(pgFilterable)}
        activeValue={pgFilterable}
        ariaLabel="Filterable"
        options={yesNoOptions}
        onSelect={value => (pgFilterable = value as TriState)}
        clearable
        clearLabel="Clear filterable"
        onClear={() => (pgFilterable = '')} />
    </FormField>
    <FormField label="Disabled">
      <SelectDropdown
        buttonLabel={triLabel(pgDisabled)}
        activeValue={pgDisabled}
        ariaLabel="Disabled"
        options={yesNoOptions}
        onSelect={value => (pgDisabled = value as TriState)}
        clearable
        clearLabel="Clear disabled"
        onClear={() => (pgDisabled = '')} />
    </FormField>
    <FormField label="Align">
      <SelectDropdown
        buttonLabel={pgAlign || 'Default'}
        activeValue={pgAlign}
        ariaLabel="Align"
        options={alignOptions}
        onSelect={value => (pgAlign = value)}
        clearable
        clearLabel="Clear align"
        onClear={() => (pgAlign = '')} />
    </FormField>
    <FormField label="Filter placeholder" htmlFor="pg-filter-placeholder">
      <input
        id="pg-filter-placeholder"
        bind:value={pgFilterPlaceholder}
        placeholder="Search…"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="ChipDropdown" props={propsSnippet}>
  <ShowcaseSection title={sectionTitle} {code} footer={settingsPanel} scope={{ options, value: pgValue, labelFor }}>
    <ChipDropdown
      label={labelFor(options, pgValue)}
      activeValue={pgValue}
      ariaLabel="Set status"
      variant={demoVariant}
      {filterable}
      {disabled}
      align={demoAlign}
      filterPlaceholder={pgFilterPlaceholder || undefined}
      {options}
      onSelect={next => (pgValue = next)} />
    <span class="text-sm text-slate-400">value: {pgValue}</span>
  </ShowcaseSection>
</ShowcasePage>
