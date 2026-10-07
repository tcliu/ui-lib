<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildIconsSnippet, ICON_COMPONENTS, ICON_ENTRIES, iconClassFor, iconLabel } from './demo-snippet'
  import { parseSizeValue } from '$lib/showcase/size-input'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgSize = $state('')
  let pgTint = $state('')
  let pgClassName = $state('')

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
  ]
  const tintOptions = [
    { value: 'text-cyan-400', label: 'cyan' },
    { value: 'text-emerald-400', label: 'emerald' },
    { value: 'text-amber-400', label: 'amber' },
    { value: 'text-rose-400', label: 'rose' },
  ]

  const demoSize = $derived(parseSizeValue(pgSize))
  const galleryClass = $derived(iconClassFor(pgTint, pgClassName))

  const isCustomized = $derived(pgSize !== '' || pgTint !== '' || pgClassName !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgSize = ''
    pgTint = ''
    pgClassName = ''
  }

  const code = $derived.by(() => buildIconsSnippet({ size: pgSize, tint: pgTint, className: pgClassName }))

  const props: PropRow[] = [
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | number",
      defaultValue: "'md'",
      note: 'Width/height attributes (12/16/20/24px for names, passthrough for numbers); composes with className.',
    },
    {
      name: 'className',
      type: 'string',
      defaultValue: "''",
      note: 'Color and extra classes; explicit size classes win over the size attributes.',
    },
    {
      name: 'variant',
      type: "'outline' | 'solid'",
      defaultValue: "'outline'",
      note: 'ChevronUpIcon/ChevronDownIcon only: outline stroke or solid fill.',
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
    <FormField label="Size">
      <SelectDropdown
        buttonLabel={pgSize || 'Default'}
        activeValue={pgSize}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => (pgSize = value)}
        clearable
        clearLabel="Clear size"
        onClear={() => (pgSize = '')} />
    </FormField>
    <FormField label="Tint">
      <SelectDropdown
        buttonLabel={tintOptions.find(option => option.value === pgTint)?.label ?? 'Default'}
        activeValue={pgTint}
        ariaLabel="Tint"
        options={tintOptions}
        onSelect={value => (pgTint = value)}
        clearable
        clearLabel="Clear tint"
        onClear={() => (pgTint = '')} />
    </FormField>
    <FormField label="Class name" htmlFor="pg-classname">
      <input
        id="pg-classname"
        bind:value={pgClassName}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Icons" props={propsSnippet}>
  <ShowcaseSection title={sectionTitle} {code} footer={settingsPanel}>
    <div class="grid grid-cols-4 gap-3 sm:grid-cols-8">
      {#each ICON_ENTRIES as entry (iconLabel(entry))}
        {@const Icon = ICON_COMPONENTS[entry.name]}
        <span class="flex flex-col items-center gap-1 text-xs text-slate-400"
          ><Icon size={demoSize} className={galleryClass} {...entry.variant ? { variant: entry.variant } : {}} />{iconLabel(entry)}</span>{' '}
      {/each}
    </div>
  </ShowcaseSection>
</ShowcasePage>
