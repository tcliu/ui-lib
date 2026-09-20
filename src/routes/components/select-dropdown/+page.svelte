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
  import { FILTERABLE_CONTROL, buildSelectDropdownSnippet, type TriState } from './demo-snippet'

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

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgValue = $state('two')
  let pgSize = $state('')
  let pgFilterable = $state<TriState>('')
  let pgControlClass = $state('')
  let pgClearable = $state<TriState>('')
  let pgAlign = $state('')

  function labelFor(list: Option[], current: string): string {
    return list.find(option => option.value === current)?.label ?? current
  }

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoSize = $derived((pgSize || undefined) as 'xs' | 'sm' | 'md' | 'lg' | undefined)
  const filterable = $derived(flagOn(pgFilterable))
  const clearable = $derived(flagOn(pgClearable))
  const demoAlign = $derived((pgAlign || undefined) as 'left' | 'right' | undefined)
  const demoControlClass = $derived(pgControlClass || undefined)

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
  ]
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
    pgSize !== '' || pgFilterable !== '' || pgControlClass !== '' || pgClearable !== '' || pgAlign !== ''
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgValue = 'two'
    pgSize = ''
    pgFilterable = ''
    pgControlClass = ''
    pgClearable = ''
    pgAlign = ''
  }

  const code = $derived.by(() =>
    buildSelectDropdownSnippet({
      size: pgSize,
      filterable: pgFilterable,
      controlClass: pgControlClass,
      clearable: pgClearable,
      align: pgAlign,
    })
  )

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
    { name: 'clearable', type: 'boolean', defaultValue: 'false', note: 'Appends a cross button that clears the value.' },
    { name: 'clearLabel', type: 'string', defaultValue: "'Clear selection'", note: 'Accessible name for the clear button.' },
    { name: 'onClear', type: '() => void', defaultValue: 'onSelect(\'\')', note: 'Clear handler; selects empty when omitted.' },
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
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>
      Reset
    </Button>
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
    <FormField label="Filterable">
      <SelectDropdown
        buttonLabel={triLabel(pgFilterable)}
        activeValue={pgFilterable}
        ariaLabel="Filterable"
        options={yesNoOptions}
        onSelect={value => {
          pgFilterable = value as TriState
          if (value === 'yes' && pgControlClass === '') {
            pgControlClass = FILTERABLE_CONTROL
          }
        }}
        clearable
        clearLabel="Clear filterable"
        onClear={() => (pgFilterable = '')} />
    </FormField>
    <FormField label="Control class" htmlFor="pg-controlclass">
      <input
        id="pg-controlclass"
        bind:value={pgControlClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Clearable">
      <SelectDropdown
        buttonLabel={triLabel(pgClearable)}
        activeValue={pgClearable}
        ariaLabel="Clearable"
        options={yesNoOptions}
        onSelect={value => (pgClearable = value as TriState)}
        clearable
        clearLabel="Clear clearable"
        onClear={() => (pgClearable = '')} />
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
  </div>
{/snippet}

<ShowcasePage name="SelectDropdown" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    code={code}
    footer={settingsPanel}
    scope={{ options, value: pgValue, labelFor }}>
    <SelectDropdown
      buttonLabel={labelFor(options, pgValue)}
      activeValue={pgValue}
      ariaLabel="default"
      size={demoSize}
      filterable={filterable}
      controlClass={demoControlClass}
      clearable={clearable}
      align={demoAlign}
      {options}
      onSelect={next => (pgValue = next)} />
    <span class="text-sm text-slate-400">value: {pgValue}</span>
  </ShowcaseSection>
</ShowcasePage>
