<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SearchInput from '$lib/components/SearchInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { STYLED_INPUT, STYLED_WRAPPER, buildSearchInputSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  // Style is a preset that fills the wrapper/input class fields below.
  let pgQuery = $state('')
  let pgPlaceholder = $state('')
  let pgSize = $state('')
  let pgStyled = $state('')
  let pgWrapperClass = $state('')
  let pgInputClass = $state('')

  const styledOptions = [{ value: 'yes', label: 'Styled' }]
  const sizeOptions = [
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
  ]

  const demoPlaceholder = $derived(pgPlaceholder || undefined)
  const demoSize = $derived((pgSize || undefined) as 'sm' | 'md' | 'lg' | undefined)
  const demoWrapperClass = $derived(pgWrapperClass || undefined)
  const demoInputClass = $derived(pgInputClass || undefined)

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      pgQuery = ''
    }
  }

  const isCustomized = $derived(
    pgPlaceholder !== '' || pgSize !== '' || pgStyled !== '' || pgWrapperClass !== '' || pgInputClass !== '',
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgQuery = ''
    pgPlaceholder = ''
    pgSize = ''
    pgStyled = ''
    pgWrapperClass = ''
    pgInputClass = ''
  }

  const code = $derived.by(() =>
    buildSearchInputSnippet({
      placeholder: pgPlaceholder,
      size: pgSize,
      wrapperClass: pgWrapperClass,
      inputClass: pgInputClass,
    }),
  )

  const props: PropRow[] = [
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable search text.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.' },
    { name: 'placeholder', type: 'string', defaultValue: "'Search...'", note: 'Native placeholder.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: "'sm'", note: 'Input and icon scale.' },
    { name: 'wrapperClass', type: 'string', defaultValue: "''", note: 'Extra classes for the outer wrapper.' },
    { name: 'inputClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the default input classes.' },
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    {
      name: 'onkeydown',
      type: '(event: KeyboardEvent) => void',
      defaultValue: '—',
      note: 'Keydown callback; Escape clears in this demo.',
    },
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
        placeholder="Search..."
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        buttonLabel={pgSize || 'Default'}
        activeValue={pgSize}
        ariaLabel="Size"
        options={sizeOptions}
        onSelect={value => (pgSize = value)}
        clearable
        clearLabel="Clear size"
        onClear={() => (pgSize = '')} />
    </FormField>
    <FormField label="Style">
      <SelectDropdown
        buttonLabel={pgStyled ? 'Styled' : 'Default'}
        activeValue={pgStyled}
        ariaLabel="Style"
        options={styledOptions}
        onSelect={value => {
          pgStyled = value
          pgWrapperClass = STYLED_WRAPPER
          pgInputClass = STYLED_INPUT
        }}
        clearable
        clearLabel="Clear style"
        onClear={() => {
          pgStyled = ''
          pgWrapperClass = ''
          pgInputClass = ''
        }} />
    </FormField>
    <FormField label="Wrapper class" htmlFor="pg-wrapperclass">
      <input
        id="pg-wrapperclass"
        bind:value={pgWrapperClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Input class" htmlFor="pg-inputclass">
      <input
        id="pg-inputclass"
        bind:value={pgInputClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="SearchInput" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{ query: pgQuery, handleKeydown, applyLabel: i18n.t('common.apply') }}>
    <div class="flex flex-col gap-1">
      <SearchInput
        bind:value={pgQuery}
        ariaLabel={i18n.t('common.apply')}
        onkeydown={handleKeydown}
        placeholder={demoPlaceholder}
        size={demoSize}
        wrapperClass={demoWrapperClass}
        inputClass={demoInputClass} />
      <span class="text-sm text-slate-400">value: {pgQuery || '—'}</span>
    </div>
  </ShowcaseSection>
</ShowcasePage>
