<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Combobox, { type ComboboxOption } from '$lib/components/Combobox.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildComboboxSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  const pool: ComboboxOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
    { value: 'fig', label: 'Fig' },
  ]

  const initialSelected: ComboboxOption[] = [pool[0]]

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgSelected = $state<ComboboxOption[]>([...initialSelected])
  let pgSuggestions = $state<ComboboxOption[]>(pool.filter(option => option.value !== pool[0].value))
  let pgPlaceholder = $state('')

  function filterSuggestions(query: string) {
    const needle = query.trim().toLowerCase()
    pgSuggestions = pool.filter(
      option =>
        !pgSelected.some(selected => selected.value === option.value) &&
        (needle === '' || option.label.toLowerCase().includes(needle)),
    )
  }

  function addOption(option: ComboboxOption) {
    if (!pgSelected.some(selected => selected.value === option.value)) {
      pgSelected = [...pgSelected, option]
    }
    filterSuggestions('')
  }

  function removeOption(value: string) {
    pgSelected = pgSelected.filter(selected => selected.value !== value)
    filterSuggestions('')
  }

  const isCustomized = $derived(pgPlaceholder !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgSelected = [...initialSelected]
    pgSuggestions = pool.filter(option => option.value !== pool[0].value)
    pgPlaceholder = ''
  }

  const code = $derived.by(() => buildComboboxSnippet({ placeholder: pgPlaceholder }))

  const props: PropRow[] = [
    { name: 'selected', type: 'ComboboxOption[]', defaultValue: '—', note: 'Chosen options rendered as chips.' },
    {
      name: 'suggestions',
      type: 'ComboboxOption[]',
      defaultValue: '—',
      note: 'Dropdown options for the current query.',
    },
    {
      name: 'onQueryChange',
      type: '(query: string) => void',
      defaultValue: '—',
      note: 'Called on every keystroke; caller filters suggestions.',
    },
    {
      name: 'onAdd',
      type: '(item: ComboboxOption) => void',
      defaultValue: '—',
      note: 'Called when an option is picked or Enter creates one.',
    },
    { name: 'onRemove', type: '(value: string) => void', defaultValue: '—', note: 'Called when a chip is removed.' },
    {
      name: 'placeholder',
      type: 'string',
      defaultValue: 'locale',
      note: 'Input placeholder while nothing is selected.',
    },
    { name: 'id', type: 'string', defaultValue: '—', note: 'Native input id; prefixes the listbox ids.' },
    { name: 'chip', type: 'Snippet<[option, remove]>', defaultValue: '—', note: 'Custom chip renderer.' },
    { name: 'option', type: 'Snippet<[suggestion]>', defaultValue: '—', note: 'Custom suggestion renderer.' },
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
    <FormField label="Placeholder" htmlFor="pg-placeholder">
      <input
        id="pg-placeholder"
        bind:value={pgPlaceholder}
        placeholder="Select or type..."
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Combobox" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{
      selected: pgSelected,
      suggestions: pgSuggestions,
      filterSuggestions,
      addOption,
      removeOption,
    }}>
    <div class="flex flex-col gap-1">
      <Combobox
        selected={pgSelected}
        suggestions={pgSuggestions}
        onQueryChange={filterSuggestions}
        onAdd={addOption}
        onRemove={removeOption}
        placeholder={pgPlaceholder || undefined} />
      <span class="text-sm text-slate-400">
        selected: {pgSelected.map(option => option.label).join(', ') || '—'}
      </span>
    </div>
  </ShowcaseSection>
</ShowcasePage>
