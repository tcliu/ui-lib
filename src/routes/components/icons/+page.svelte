<script lang="ts">
  import type { Component } from 'svelte'
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import CheckIcon from '$lib/icons/CheckIcon.svelte'
  import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte'
  import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte'
  import ChevronRightIcon from '$lib/icons/ChevronRightIcon.svelte'
  import ChevronUpIcon from '$lib/icons/ChevronUpIcon.svelte'
  import CloseIcon from '$lib/icons/CloseIcon.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import ColumnsIcon from '$lib/icons/ColumnsIcon.svelte'
  import CopyIcon from '$lib/icons/CopyIcon.svelte'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import EyeIcon from '$lib/icons/EyeIcon.svelte'
  import EyeSlashIcon from '$lib/icons/EyeSlashIcon.svelte'
  import ForestIcon from '$lib/icons/ForestIcon.svelte'
  import GlobeIcon from '$lib/icons/GlobeIcon.svelte'
  import KebabIcon from '$lib/icons/KebabIcon.svelte'
  import MenuIcon from '$lib/icons/MenuIcon.svelte'
  import PaletteIcon from '$lib/icons/PaletteIcon.svelte'
  import PlusIcon from '$lib/icons/PlusIcon.svelte'
  import RefreshIcon from '$lib/icons/RefreshIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import SaveIcon from '$lib/icons/SaveIcon.svelte'
  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import SettingsIcon from '$lib/icons/SettingsIcon.svelte'
  import SortAscIcon from '$lib/icons/SortAscIcon.svelte'
  import SortDescIcon from '$lib/icons/SortDescIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildIconsSnippet, ICON_ENTRIES, iconClassFor, iconLabel } from './demo-snippet'

  const i18n = getI18nContext()

  // One component per `ICON_ENTRIES` name; the gallery renders from that single
  // list instead of a hand-written copy that can drift from the generated
  // snippet.
  const ICON_COMPONENTS: Record<string, Component> = {
    Check: CheckIcon,
    ChevronDown: ChevronDownIcon,
    ChevronLeft: ChevronLeftIcon,
    ChevronRight: ChevronRightIcon,
    ChevronUp: ChevronUpIcon,
    Close: CloseIcon,
    Code: CodeIcon,
    Columns: ColumnsIcon,
    Copy: CopyIcon,
    Delete: DeleteIcon,
    Eye: EyeIcon,
    EyeSlash: EyeSlashIcon,
    Forest: ForestIcon,
    Globe: GlobeIcon,
    Kebab: KebabIcon,
    Menu: MenuIcon,
    Palette: PaletteIcon,
    Plus: PlusIcon,
    Refresh: RefreshIcon,
    Reset: ResetIcon,
    Save: SaveIcon,
    Search: SearchIcon,
    Settings: SettingsIcon,
    SortAsc: SortAscIcon,
    SortDesc: SortDescIcon,
  }

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

  const demoSize = $derived((pgSize || undefined) as 'xs' | 'sm' | 'md' | 'lg' | undefined)
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
      type: "'xs' | 'sm' | 'md' | 'lg'",
      defaultValue: "'md'",
      note: 'Width/height attributes (12/16/20/24px); composes with className.',
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
