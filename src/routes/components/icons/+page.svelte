<script lang="ts">
  import CheckIcon from '$lib/icons/CheckIcon.svelte'
  import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte'
  import ChevronDownSmallIcon from '$lib/icons/ChevronDownSmallIcon.svelte'
  import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte'
  import ChevronRightIcon from '$lib/icons/ChevronRightIcon.svelte'
  import ChevronUpSmallIcon from '$lib/icons/ChevronUpSmallIcon.svelte'
  import CloseIcon from '$lib/icons/CloseIcon.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
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

  const i18n = getI18nContext()

  const codeDefault = `<div class="grid grid-cols-4 gap-3 sm:grid-cols-8">
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><CheckIcon className="h-5 w-5 text-slate-200" />Check</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ChevronDownIcon className="h-5 w-5 text-slate-200" />ChevronDown</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ChevronDownSmallIcon className="h-5 w-5 text-slate-200" />ChevronDownSmall</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ChevronLeftIcon className="h-5 w-5 text-slate-200" />ChevronLeft</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ChevronRightIcon className="h-5 w-5 text-slate-200" />ChevronRight</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ChevronUpSmallIcon className="h-5 w-5 text-slate-200" />ChevronUpSmall</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><CloseIcon className="h-5 w-5 text-slate-200" />Close</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><CodeIcon className="h-5 w-5 text-slate-200" />Code</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><CopyIcon className="h-5 w-5 text-slate-200" />Copy</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><DeleteIcon className="h-5 w-5 text-slate-200" />Delete</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><EyeIcon className="h-5 w-5 text-slate-200" />Eye</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><EyeSlashIcon className="h-5 w-5 text-slate-200" />EyeSlash</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ForestIcon className="h-5 w-5 text-slate-200" />Forest</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><GlobeIcon className="h-5 w-5 text-slate-200" />Globe</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><KebabIcon className="h-5 w-5 text-slate-200" />Kebab</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><MenuIcon className="h-5 w-5 text-slate-200" />Menu</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><PaletteIcon className="h-5 w-5 text-slate-200" />Palette</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><PlusIcon className="h-5 w-5 text-slate-200" />Plus</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><RefreshIcon className="h-5 w-5 text-slate-200" />Refresh</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ResetIcon className="h-5 w-5 text-slate-200" />Reset</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><SaveIcon className="h-5 w-5 text-slate-200" />Save</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><SearchIcon className="h-5 w-5 text-slate-200" />Search</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><SettingsIcon className="h-5 w-5 text-slate-200" />Settings</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><SortAscIcon className="h-5 w-5 text-slate-200" />SortAsc</span>
  <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><SortDescIcon className="h-5 w-5 text-slate-200" />SortDesc</span>
</div>`

  const codeCustomized = `<CheckIcon className="h-6 w-6 text-emerald-400" />
<CopyIcon className="h-8 w-8 text-cyan-400" />
<CloseIcon className="h-4 w-4 text-rose-400" />`

  const props: PropRow[] = [
    { name: 'className', type: 'string', defaultValue: "''", note: 'Size and color classes for the SVG.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="Icons" props={propsSnippet}>
  <ShowcaseSection title={i18n.t('showcase.default')} code={codeDefault}>
    <div class="grid grid-cols-4 gap-3 sm:grid-cols-8">
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><CheckIcon className="h-5 w-5 text-slate-200" />Check</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ChevronDownIcon className="h-5 w-5 text-slate-200" />ChevronDown</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ChevronDownSmallIcon className="h-5 w-5 text-slate-200" />ChevronDownSmall</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ChevronLeftIcon className="h-5 w-5 text-slate-200" />ChevronLeft</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ChevronRightIcon className="h-5 w-5 text-slate-200" />ChevronRight</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ChevronUpSmallIcon className="h-5 w-5 text-slate-200" />ChevronUpSmall</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><CloseIcon className="h-5 w-5 text-slate-200" />Close</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><CodeIcon className="h-5 w-5 text-slate-200" />Code</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><CopyIcon className="h-5 w-5 text-slate-200" />Copy</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><DeleteIcon className="h-5 w-5 text-slate-200" />Delete</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><EyeIcon className="h-5 w-5 text-slate-200" />Eye</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><EyeSlashIcon className="h-5 w-5 text-slate-200" />EyeSlash</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ForestIcon className="h-5 w-5 text-slate-200" />Forest</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><GlobeIcon className="h-5 w-5 text-slate-200" />Globe</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><KebabIcon className="h-5 w-5 text-slate-200" />Kebab</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><MenuIcon className="h-5 w-5 text-slate-200" />Menu</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><PaletteIcon className="h-5 w-5 text-slate-200" />Palette</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><PlusIcon className="h-5 w-5 text-slate-200" />Plus</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><RefreshIcon className="h-5 w-5 text-slate-200" />Refresh</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><ResetIcon className="h-5 w-5 text-slate-200" />Reset</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><SaveIcon className="h-5 w-5 text-slate-200" />Save</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><SearchIcon className="h-5 w-5 text-slate-200" />Search</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><SettingsIcon className="h-5 w-5 text-slate-200" />Settings</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><SortAscIcon className="h-5 w-5 text-slate-200" />SortAsc</span>
      <span class="flex flex-col items-center gap-1 text-xs text-slate-400"><SortDescIcon className="h-5 w-5 text-slate-200" />SortDesc</span>
    </div>
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')} code={codeCustomized}>
    <CheckIcon className="h-6 w-6 text-emerald-400" />
    <CopyIcon className="h-8 w-8 text-cyan-400" />
    <CloseIcon className="h-4 w-4 text-rose-400" />
  </ShowcaseSection>
</ShowcasePage>
