<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import PasswordInput from '$lib/components/PasswordInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildPasswordInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgValue = $state('')
  let pgPlaceholder = $state('')
  let pgShowLabel = $state('')
  let pgHideLabel = $state('')
  let pgDisabled = $state<TriState>('')
  let pgRequired = $state<TriState>('')
  let pgClassName = $state('')

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const disabled = $derived(flagOn(pgDisabled))
  const required = $derived(flagOn(pgRequired))

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(
    pgPlaceholder !== '' ||
      pgShowLabel !== '' ||
      pgHideLabel !== '' ||
      pgDisabled !== '' ||
      pgRequired !== '' ||
      pgClassName !== '',
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgValue = ''
    pgPlaceholder = ''
    pgShowLabel = ''
    pgHideLabel = ''
    pgDisabled = ''
    pgRequired = ''
    pgClassName = ''
  }

  const code = $derived.by(() =>
    buildPasswordInputSnippet({
      placeholder: pgPlaceholder,
      showLabel: pgShowLabel,
      hideLabel: pgHideLabel,
      disabled: pgDisabled,
      required: pgRequired,
      className: pgClassName,
    }),
  )

  const props: PropRow[] = [
    { name: 'value', type: 'string', defaultValue: "''", note: 'Bindable field value.' },
    { name: 'id', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'name', type: 'string', defaultValue: '—', note: 'Native input name.' },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Placeholder text.' },
    { name: 'autocomplete', type: 'string', defaultValue: "'current-password'", note: 'Native autocomplete token.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the field and the toggle.' },
    { name: 'required', type: 'boolean', defaultValue: 'false', note: 'Native required flag.' },
    {
      name: 'showLabel',
      type: 'string',
      defaultValue: '—',
      note: 'Toggle label when hidden; falls back to the locale.',
    },
    {
      name: 'hideLabel',
      type: 'string',
      defaultValue: '—',
      note: 'Toggle label when visible; falls back to the locale.',
    },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the input.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Native input handler.' },
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
        placeholder="Password"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Show label" htmlFor="pg-show">
      <input
        id="pg-show"
        bind:value={pgShowLabel}
        placeholder="Show secret"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Hide label" htmlFor="pg-hide">
      <input
        id="pg-hide"
        bind:value={pgHideLabel}
        placeholder="Hide secret"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
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
    <FormField label="Required">
      <SelectDropdown
        buttonLabel={triLabel(pgRequired)}
        activeValue={pgRequired}
        ariaLabel="Required"
        options={yesNoOptions}
        onSelect={value => (pgRequired = value as TriState)}
        clearable
        clearLabel="Clear required"
        onClear={() => (pgRequired = '')} />
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

<ShowcasePage name="PasswordInput" props={propsSnippet}>
  <ShowcaseSection title={sectionTitle} {code} footer={settingsPanel} scope={{ value: pgValue }}>
    <PasswordInput
      bind:value={pgValue}
      placeholder={pgPlaceholder || 'Password'}
      showLabel={pgShowLabel || undefined}
      hideLabel={pgHideLabel || undefined}
      {disabled}
      {required}
      className={pgClassName || undefined} />
    <span class="text-sm text-slate-400">length: {pgValue.length}</span>
  </ShowcaseSection>
</ShowcasePage>
