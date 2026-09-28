<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import Tooltip from '$lib/components/Tooltip.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { STYLED_CLASS, buildTooltipSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the component
  // default renders), so the cleared form applies no overrides. Style is a
  // preset that fills the class field below.
  let explicitTrigger = $state<HTMLButtonElement | null>(null)
  let pgAlign = $state('')
  let pgStyled = $state('')
  let pgClass = $state('')

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]
  const styleOptions = [{ value: 'yes', label: 'Styled' }]

  const demoAlign = $derived((pgAlign || undefined) as 'center' | 'left' | 'right' | undefined)
  const demoClass = $derived(pgClass || undefined)

  const isCustomized = $derived(pgAlign !== '' || pgStyled !== '' || pgClass !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgAlign = ''
    pgStyled = ''
    pgClass = ''
  }

  const code = $derived.by(() => buildTooltipSnippet({ align: pgAlign, className: pgClass }))

  const props: PropRow[] = [
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Tooltip text/content.' },
    {
      name: 'align',
      type: "'center' | 'left' | 'right'",
      defaultValue: "'center'",
      note: 'Horizontal alignment to the trigger.',
    },
    { name: 'class', type: 'string', defaultValue: "''", note: 'Extra classes for the tooltip box.' },
    {
      name: 'trigger',
      type: 'HTMLElement | null',
      defaultValue: 'null',
      note: 'Explicit trigger; falls back to the anchor parent.',
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
    <FormField label="Style">
      <SelectDropdown
        buttonLabel={pgStyled ? 'Styled' : 'Default'}
        activeValue={pgStyled}
        ariaLabel="Style"
        options={styleOptions}
        onSelect={value => {
          pgStyled = value
          pgClass = STYLED_CLASS
        }}
        clearable
        clearLabel="Clear style"
        onClear={() => {
          pgStyled = ''
          pgClass = ''
        }} />
    </FormField>
    <FormField label="Class" htmlFor="pg-class">
      <input
        id="pg-class"
        bind:value={pgClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Tooltip" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{ explicitTrigger: null, applyLabel: i18n.t('common.apply') }}>
    <Button bind:buttonEl={explicitTrigger}>{i18n.t('common.apply')}</Button>
    <Tooltip trigger={explicitTrigger} align={demoAlign} class={demoClass}>{i18n.t('common.apply')}</Tooltip>
  </ShowcaseSection>
</ShowcasePage>
