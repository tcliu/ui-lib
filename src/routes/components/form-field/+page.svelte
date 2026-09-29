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
  import { STYLED_CLASS, buildFormFieldSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides. Wrapper is a
  // preset that fills the className field below.
  let pgValue = $state('')
  let pgLabel = $state('')
  let pgHtmlFor = $state('')
  let pgStyled = $state('')
  let pgClassName = $state('')

  const styledOptions = [{ value: 'yes', label: 'Styled wrapper' }]

  const demoLabel = $derived(pgLabel || i18n.t('showcase.default'))
  const demoHtmlFor = $derived(pgHtmlFor || undefined)
  const demoClassName = $derived(pgClassName || undefined)

  const isCustomized = $derived(pgLabel !== '' || pgHtmlFor !== '' || pgStyled !== '' || pgClassName !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgValue = ''
    pgLabel = ''
    pgHtmlFor = ''
    pgStyled = ''
    pgClassName = ''
  }

  const code = $derived.by(() => buildFormFieldSnippet({ label: pgLabel, htmlFor: pgHtmlFor, className: pgClassName }))

  const props: PropRow[] = [
    { name: 'label', type: 'string', defaultValue: '—', note: 'Visible field label.' },
    { name: 'htmlFor', type: 'string', defaultValue: '—', note: 'Associates the label with a control id.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the field wrapper.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'The control(s) under the label.' },
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
        placeholder="Default"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Control id" htmlFor="pg-htmlfor">
      <input
        id="pg-htmlfor"
        bind:value={pgHtmlFor}
        placeholder="form-field-demo"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Wrapper">
      <SelectDropdown
        buttonLabel={pgStyled ? 'Styled wrapper' : 'Default'}
        activeValue={pgStyled}
        ariaLabel="Wrapper"
        options={styledOptions}
        onSelect={value => {
          pgStyled = value
          pgClassName = STYLED_CLASS
        }}
        clearable
        clearLabel="Clear wrapper"
        onClear={() => {
          pgStyled = ''
          pgClassName = ''
        }} />
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

<ShowcasePage name="FormField" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{ value: pgValue, defaultLabel: i18n.t('showcase.default') }}>
    <FormField label={demoLabel} htmlFor={demoHtmlFor} className={demoClassName}>
      <input
        id={demoHtmlFor}
        type="text"
        bind:value={pgValue}
        class="w-56 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus-visible:border-cyan-500" />
    </FormField>
  </ShowcaseSection>
</ShowcasePage>
