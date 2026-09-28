<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import TagInput from '$lib/components/TagInput.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildTagInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  const initialTags = ['svelte', 'kit']
  const availableTags = ['svelte', 'kit', 'icons', 'forms', 'tables']

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgValue = $state([...initialTags])
  let pgPlaceholder = $state('')
  let pgColored = $state('')
  let pgDisabled = $state<TriState>('')
  let pgChipClass = $state('')

  function colorFor(tag: string): string {
    return tag === 'svelte'
      ? 'border-orange-700 bg-orange-950/50 text-orange-200'
      : 'border-slate-600 bg-slate-800 text-slate-200'
  }

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const disabled = $derived(flagOn(pgDisabled))
  const chipClassFor = $derived(pgColored ? colorFor : undefined)

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]
  const colorOptions = [{ value: 'yes', label: 'Colored chips' }]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(pgPlaceholder !== '' || pgColored !== '' || pgDisabled !== '' || pgChipClass !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgValue = [...initialTags]
    pgPlaceholder = ''
    pgColored = ''
    pgDisabled = ''
    pgChipClass = ''
  }

  const code = $derived.by(() =>
    buildTagInputSnippet({
      placeholder: pgPlaceholder,
      colored: pgColored,
      disabled: pgDisabled,
      chipClass: pgChipClass,
    }),
  )

  const props: PropRow[] = [
    { name: 'value', type: 'string[]', defaultValue: '[]', note: 'Selected tags.' },
    { name: 'availableTags', type: 'string[]', defaultValue: '[]', note: 'Suggestions offered while typing.' },
    { name: 'onChange', type: '(next: string[]) => void', defaultValue: '—', note: 'Called with the new tag list.' },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Placeholder text.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input.' },
    { name: 'inputId', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'chipClass', type: 'string', defaultValue: 'built-in', note: 'Base classes for every chip.' },
    {
      name: 'chipClassFor',
      type: '(tag: string) => string',
      defaultValue: '—',
      note: 'Per-tag chip classes; wins over chipClass.',
    },
    { name: 'chip', type: 'Snippet<[tag, remove]>', defaultValue: '—', note: 'Custom chip renderer.' },
    { name: 'option', type: 'Snippet<[tag]>', defaultValue: '—', note: 'Custom suggestion renderer.' },
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
        placeholder="Add a tag"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Chips">
      <SelectDropdown
        buttonLabel={pgColored ? 'Colored chips' : 'Default'}
        activeValue={pgColored}
        ariaLabel="Chips"
        options={colorOptions}
        onSelect={value => (pgColored = value)}
        clearable
        clearLabel="Clear chips"
        onClear={() => (pgColored = '')} />
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
    <FormField label="Chip class" htmlFor="pg-chipclass">
      <input
        id="pg-chipclass"
        bind:value={pgChipClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="TagInput" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{ value: pgValue, availableTags, colorFor }}>
    <TagInput
      value={pgValue}
      {availableTags}
      placeholder={pgPlaceholder || 'Add a tag'}
      {chipClassFor}
      chipClass={pgChipClass || undefined}
      {disabled}
      onChange={next => (pgValue = next)} />
    <span class="text-sm text-slate-400">tags: {pgValue.join(', ')}</span>
  </ShowcaseSection>
</ShowcasePage>
