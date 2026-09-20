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
  import { STACKED_CLASS, buildButtonsSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides. Layout is a
  // preset that fills the className field below.
  let pgAlign = $state('')
  let pgStacked = $state('')
  let pgClassName = $state('')

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'center', label: 'center' },
    { value: 'right', label: 'right' },
  ]
  const layoutOptions = [{ value: 'yes', label: 'Stacked' }]

  const demoAlign = $derived((pgAlign || undefined) as 'left' | 'center' | 'right' | undefined)
  const demoClassName = $derived(pgClassName || undefined)

  const isCustomized = $derived(pgAlign !== '' || pgStacked !== '' || pgClassName !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgAlign = ''
    pgStacked = ''
    pgClassName = ''
  }

  const code = $derived.by(() => buildButtonsSnippet({ align: pgAlign, className: pgClassName }))

  const props: PropRow[] = [
    { name: 'align', type: "'left' | 'center' | 'right'", defaultValue: "'left'", note: 'Horizontal alignment of the default row.' },
    { name: 'className', type: 'string', defaultValue: '—', note: 'Replaces the default layout classes (align is ignored).' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Buttons to lay out.' },
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
    <FormField label="Layout">
      <SelectDropdown
        buttonLabel={pgStacked ? 'Stacked' : 'Default'}
        activeValue={pgStacked}
        ariaLabel="Layout"
        options={layoutOptions}
        onSelect={value => {
          pgStacked = value
          pgClassName = STACKED_CLASS
        }}
        clearable
        clearLabel="Clear layout"
        onClear={() => {
          pgStacked = ''
          pgClassName = ''
        }} />
    </FormField>
    <FormField label="Class name" htmlFor="pg-classname">
      <input
        id="pg-classname"
        bind:value={pgClassName}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Buttons" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    code={code}
    footer={settingsPanel}
    scope={{ okLabel: i18n.t('common.ok'), cancelLabel: i18n.t('common.cancel') }}>
    <Buttons align={demoClassName ? undefined : demoAlign} className={demoClassName}>
      <Button variant="primary">{i18n.t('common.ok')}</Button>
      <Button>{i18n.t('common.cancel')}</Button>
    </Buttons>
  </ShowcaseSection>
</ShowcasePage>
