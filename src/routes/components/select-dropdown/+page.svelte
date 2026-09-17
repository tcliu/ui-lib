<script lang="ts">
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  interface Option {
    value: string
    label: string
  }

  const options: Option[] = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
    { value: 'three', label: 'Three' },
  ]

  const fruits: Option[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'apricot', label: 'Apricot' },
    { value: 'banana', label: 'Banana' },
    { value: 'blueberry', label: 'Blueberry' },
    { value: 'cherry', label: 'Cherry' },
  ]

  const sizes = ['xs', 'sm', 'md', 'lg'] as const
  let value = $state('two')
  let filterValue = $state('apple')
  let sizeValue = $state('three')
  let emptyValue = $state('')

  function labelFor(list: Option[], current: string): string {
    return list.find(option => option.value === current)?.label ?? current
  }

  const codeDefault = `<SelectDropdown
  buttonLabel={labelFor(options, value)}
  activeValue={value}
  ariaLabel="default"
  options={options}
  onSelect={next => (value = next)} />
<span class="text-sm text-slate-400">value: {value}</span>`

  const codeCustomized = `<SelectDropdown
  buttonLabel={labelFor(fruits, filterValue)}
  activeValue={filterValue}
  ariaLabel="filterable"
  filterable
  options={fruits}
  controlClass="w-40 rounded-md border border-slate-700 bg-slate-950 pl-3 pr-7 py-2 text-sm text-slate-100 outline-none transition motion-reduce:transition-none hover:border-cyan-500 focus-visible:border-cyan-500"
  onSelect={next => (filterValue = next)} />

{#each sizes as size (size)}
  <SelectDropdown
    buttonLabel={labelFor(options, sizeValue)}
    activeValue={sizeValue}
    {size}
    ariaLabel={size}
    {options}
    onSelect={next => (sizeValue = next)} />
{/each}

<SelectDropdown
  buttonLabel={noOptionsLabel}
  activeValue={emptyValue}
  ariaLabel="empty"
  options={[]}
  emptyLabel={noOptionsLabel}
  onSelect={next => (emptyValue = next)} />

<SelectDropdown
  buttonLabel={labelFor(options, value)}
  activeValue={value}
  ariaLabel="right aligned"
  align="right"
  autoPlace={false}
  panelClass="fixed left-0 top-0 z-40 w-40 rounded-lg border border-cyan-500/40 bg-slate-900/95 p-1 shadow-2xl shadow-slate-950/60 backdrop-blur"
  buttonClass="inline-flex min-w-24 cursor-pointer items-center justify-between gap-2 rounded-md border border-cyan-500/40 bg-slate-950 pl-3 pr-2 py-2 text-slate-100 outline-none transition motion-reduce:transition-none hover:border-cyan-400 focus-visible:border-cyan-400 text-sm"
  optionClass="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-300 outline-none transition motion-reduce:transition-none hover:bg-slate-800 hover:text-cyan-200"
  {options}
  onSelect={next => (value = next)} />`

  const props: PropRow[] = [
    { name: 'buttonLabel', type: 'string', defaultValue: '—', note: 'Trigger label text.' },
    { name: 'options', type: '{ value: string; label: string }[]', defaultValue: '—', note: 'Selectable options.' },
    { name: 'activeValue', type: 'string', defaultValue: "''", note: 'Committed value; marked in the panel.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the control.' },
    { name: 'filterable', type: 'boolean', defaultValue: 'false', note: 'Renders a combobox input with filtering.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'sm'", note: 'Control scale.' },
    { name: 'onSelect', type: '(value: string) => void', defaultValue: '—', note: 'Called with the chosen value.' },
    { name: 'buttonClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the trigger button classes.' },
    { name: 'controlClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the filterable input classes.' },
    { name: 'optionClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the option row classes.' },
    { name: 'emptyLabel', type: 'string', defaultValue: '—', note: 'Shown when the filtered list is empty.' },
    { name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger.' },
    { name: 'autoPlace', type: 'boolean', defaultValue: 'true', note: 'Flips the panel when crowded.' },
    { name: 'panelClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the floating panel classes.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="SelectDropdown" props={propsSnippet}>
  <ShowcaseSection
    title={i18n.t('showcase.default')}
    code={codeDefault}
    scope={{ options, value, labelFor }}>
    <SelectDropdown
      buttonLabel={labelFor(options, value)}
      activeValue={value}
      ariaLabel="default"
      {options}
      onSelect={next => (value = next)} />
    <span class="text-sm text-slate-400">value: {value}</span>
  </ShowcaseSection>

  <ShowcaseSection
    title={i18n.t('showcase.customized')}
    code={codeCustomized}
    scope={{ fruits, filterValue, sizeValue, emptyValue, options, value, labelFor, sizes, noOptionsLabel: i18n.t('dropdown.noOptions') }}>
    <SelectDropdown
      buttonLabel={labelFor(fruits, filterValue)}
      activeValue={filterValue}
      ariaLabel="filterable"
      filterable
      options={fruits}
      controlClass="w-40 rounded-md border border-slate-700 bg-slate-950 pl-3 pr-7 py-2 text-sm text-slate-100 outline-none transition motion-reduce:transition-none hover:border-cyan-500 focus-visible:border-cyan-500"
      onSelect={next => (filterValue = next)} />
    {#each sizes as size (size)}
      <SelectDropdown
        buttonLabel={labelFor(options, sizeValue)}
        activeValue={sizeValue}
        {size}
        ariaLabel={size}
        {options}
        onSelect={next => (sizeValue = next)} />
    {/each}
    <SelectDropdown
      buttonLabel={i18n.t('dropdown.noOptions')}
      activeValue={emptyValue}
      ariaLabel="empty"
      options={[]}
      emptyLabel={i18n.t('dropdown.noOptions')}
      onSelect={next => (emptyValue = next)} />
    <SelectDropdown
      buttonLabel={labelFor(options, value)}
      activeValue={value}
      ariaLabel="right aligned"
      align="right"
      autoPlace={false}
      panelClass="fixed left-0 top-0 z-40 w-40 rounded-lg border border-cyan-500/40 bg-slate-900/95 p-1 shadow-2xl shadow-slate-950/60 backdrop-blur"
      buttonClass="inline-flex min-w-24 cursor-pointer items-center justify-between gap-2 rounded-md border border-cyan-500/40 bg-slate-950 pl-3 pr-2 py-2 text-slate-100 outline-none transition motion-reduce:transition-none hover:border-cyan-400 focus-visible:border-cyan-400 text-sm"
      optionClass="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-300 outline-none transition motion-reduce:transition-none hover:bg-slate-800 hover:text-cyan-200"
      {options}
      onSelect={next => (value = next)} />
  </ShowcaseSection>
</ShowcasePage>
