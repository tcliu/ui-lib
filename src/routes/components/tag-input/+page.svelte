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

  // An alternate palette, to show the `palette` prop overriding the built-in
  // per-tag colours.
  const ALT_PALETTE = [
    'border-amber-700 bg-amber-950/50 text-amber-200',
    'border-teal-700 bg-teal-950/50 text-teal-200',
    'border-fuchsia-700 bg-fuchsia-950/50 text-fuchsia-200',
  ]

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgValue = $state([...initialTags])
  let pgPlaceholder = $state('')
  let pgPalette = $state('')
  let pgDisabled = $state<TriState>('')

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const disabled = $derived(flagOn(pgDisabled))

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]
  const paletteOptions = [{ value: 'alt', label: 'Alt palette' }]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(pgPlaceholder !== '' || pgPalette !== '' || pgDisabled !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgValue = [...initialTags]
    pgPlaceholder = ''
    pgPalette = ''
    pgDisabled = ''
  }

  const code = $derived.by(() =>
    buildTagInputSnippet({
      placeholder: pgPlaceholder,
      palette: pgPalette,
      disabled: pgDisabled,
    }),
  )

  const props: PropRow[] = [
    { name: 'value', type: 'string[]', defaultValue: '[]', note: 'Selected tags.' },
    { name: 'availableTags', type: 'string[]', defaultValue: '[]', note: 'Suggestions offered while typing.' },
    { name: 'onChange', type: '(next: string[]) => void', defaultValue: '—', note: 'Called with the new tag list.' },
    {
      name: 'onQueryChange',
      type: '(query: string) => void',
      defaultValue: '—',
      note: 'Called on every keystroke; supply externally filtered availableTags.',
    },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Placeholder text.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input.' },
    { name: 'inputId', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'chipClass', type: 'string', defaultValue: '—', note: 'Uniform classes for every chip; wins over the palette.' },
    {
      name: 'chipClassFor',
      type: '(tag: string) => string',
      defaultValue: '—',
      note: 'Per-tag chip classes; wins over chipClass.',
    },
    {
      name: 'palette',
      type: 'readonly string[]',
      defaultValue: 'built-in',
      note: 'Per-tag colour classes; replaces the built-in palette.',
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
    <FormField label="Palette">
      <SelectDropdown
        buttonLabel={pgPalette ? 'Alt palette' : 'Default'}
        activeValue={pgPalette}
        ariaLabel="Palette"
        options={paletteOptions}
        onSelect={value => (pgPalette = value)}
        clearable
        clearLabel="Clear palette"
        onClear={() => (pgPalette = '')} />
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
  </div>
{/snippet}

<ShowcasePage name="TagInput" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{ value: pgValue, availableTags, altPalette: ALT_PALETTE }}>
    <TagInput
      value={pgValue}
      {availableTags}
      placeholder={pgPlaceholder || 'Add a tag'}
      palette={pgPalette === 'alt' ? ALT_PALETTE : undefined}
      {disabled}
      onChange={next => (pgValue = next)} />
    <span class="text-sm text-slate-400">tags: {pgValue.join(', ')}</span>
  </ShowcaseSection>
</ShowcasePage>
