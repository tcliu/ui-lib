<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Checkbox from '$lib/components/Checkbox.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { STYLED_BOX, STYLED_LABEL, STYLED_WRAPPER, buildCheckboxSnippet, type TriState } from './demo-snippet'
  import { parseSizeValue } from '$lib/showcase/size-input'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  // Style is a preset that fills the three class fields below.
  let pgChecked = $state(true)
  let pgLastChange = $state('—')
  let pgLabel = $state('')
  let pgSize = $state('')
  let pgDisabled = $state<TriState>('')
  let pgIndeterminate = $state<TriState>('')
  let pgStyled = $state('')
  let pgLabelClass = $state('')
  let pgWrapperClass = $state('')
  let pgBoxClass = $state('')

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoSize = $derived(parseSizeValue(pgSize))
  const disabled = $derived(flagOn(pgDisabled))
  const indeterminate = $derived(flagOn(pgIndeterminate))

  const sizeOptions = [{ value: 'sm', label: 'sm' }]
  const styledOptions = [{ value: 'yes', label: 'Styled' }]
  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(
    pgLabel !== '' ||
      pgSize !== '' ||
      pgDisabled !== '' ||
      pgIndeterminate !== '' ||
      pgStyled !== '' ||
      pgLabelClass !== '' ||
      pgWrapperClass !== '' ||
      pgBoxClass !== '',
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgChecked = true
    pgLastChange = '—'
    pgLabel = ''
    pgSize = ''
    pgDisabled = ''
    pgIndeterminate = ''
    pgStyled = ''
    pgLabelClass = ''
    pgWrapperClass = ''
    pgBoxClass = ''
  }

  const code = $derived.by(() =>
    buildCheckboxSnippet({
      label: pgLabel,
      size: pgSize,
      disabled: pgDisabled,
      indeterminate: pgIndeterminate,
      labelClass: pgLabelClass,
      wrapperClass: pgWrapperClass,
      boxClass: pgBoxClass,
    }),
  )

  const props: PropRow[] = [
    { name: 'checked', type: 'boolean', defaultValue: '—', note: 'Bindable checked state.' },
    { name: 'label', type: 'string', defaultValue: '—', note: 'Visible label; also the accessible name.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name when no visible label.' },
    { name: 'name', type: 'string', defaultValue: '—', note: 'Native input name.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input.' },
    { name: 'indeterminate', type: 'boolean', defaultValue: 'false', note: 'Mixed state glyph.' },
    {
      name: 'stopPropagation',
      type: 'boolean',
      defaultValue: 'true',
      note: 'Stops the click bubbling to clickable rows.',
    },
    { name: 'size', type: "'sm' | 'md' | number", defaultValue: "'md'", note: 'Box and label size; numbers settle on the nearest tier.' },
    { name: 'labelClass', type: 'string', defaultValue: '—', note: 'Extra classes for the label text.' },
    { name: 'wrapperClass', type: 'string', defaultValue: "''", note: 'Extra classes for the wrapping label.' },
    { name: 'boxClass', type: 'string', defaultValue: "''", note: 'Extra classes for the box span.' },
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input element.' },
    {
      name: 'onChange',
      type: '(checked: boolean) => void',
      defaultValue: '—',
      note: 'Called with the next checked value.',
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
    <FormField label="Label" htmlFor="pg-label">
      <input
        id="pg-label"
        bind:value={pgLabel}
        placeholder="Apply"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
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
    <FormField label="Indeterminate">
      <SelectDropdown
        buttonLabel={triLabel(pgIndeterminate)}
        activeValue={pgIndeterminate}
        ariaLabel="Indeterminate"
        options={yesNoOptions}
        onSelect={value => (pgIndeterminate = value as TriState)}
        clearable
        clearLabel="Clear indeterminate"
        onClear={() => (pgIndeterminate = '')} />
    </FormField>
    <FormField label="Style">
      <SelectDropdown
        buttonLabel={pgStyled ? 'Styled' : 'Default'}
        activeValue={pgStyled}
        ariaLabel="Style"
        options={styledOptions}
        onSelect={value => {
          pgStyled = value
          pgLabelClass = STYLED_LABEL
          pgWrapperClass = STYLED_WRAPPER
          pgBoxClass = STYLED_BOX
        }}
        clearable
        clearLabel="Clear style"
        onClear={() => {
          pgStyled = ''
          pgLabelClass = ''
          pgWrapperClass = ''
          pgBoxClass = ''
        }} />
    </FormField>
    <FormField label="Label class" htmlFor="pg-labelclass">
      <input
        id="pg-labelclass"
        bind:value={pgLabelClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Wrapper class" htmlFor="pg-wrapperclass">
      <input
        id="pg-wrapperclass"
        bind:value={pgWrapperClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Box class" htmlFor="pg-boxclass">
      <input
        id="pg-boxclass"
        bind:value={pgBoxClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Checkbox" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{ checked: pgChecked, lastChange: pgLastChange, applyLabel: i18n.t('common.apply') }}>
    <Checkbox
      bind:checked={pgChecked}
      label={pgLabel || i18n.t('common.apply')}
      size={demoSize}
      {disabled}
      {indeterminate}
      labelClass={pgLabelClass || undefined}
      wrapperClass={pgWrapperClass || undefined}
      boxClass={pgBoxClass || undefined}
      onChange={checked => (pgLastChange = String(checked))} />
    <p class="text-sm text-slate-400">checked: {pgChecked}, lastChange: {pgLastChange}</p>
  </ShowcaseSection>
</ShowcasePage>
