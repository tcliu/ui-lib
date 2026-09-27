<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import Tabs from '$lib/components/Tabs.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { STYLED_HEADER, STYLED_TAB, buildTabsSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  interface DemoState {
    note: string
  }

  const demoState: DemoState = { note: 'shared state' }

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgRoutePath = $state('#overview')
  let pgRouteMode = $state('')
  let pgStyled = $state('')
  let pgHeaderClass = $state('')
  let pgTabClass = $state('')

  const modeOptions = [{ value: 'yes', label: 'Route mode' }]
  const styleOptions = [{ value: 'yes', label: 'Styled' }]

  const overviewPath = $derived(pgRouteMode ? '#overview' : 'overview')
  const detailsPath = $derived(pgRouteMode ? '#details' : 'details')

  const isCustomized = $derived(pgRouteMode !== '' || pgStyled !== '' || pgHeaderClass !== '' || pgTabClass !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgRoutePath = '#overview'
    pgRouteMode = ''
    pgStyled = ''
    pgHeaderClass = ''
    pgTabClass = ''
  }

  const code = $derived.by(() =>
    buildTabsSnippet({ routeMode: pgRouteMode, headerClass: pgHeaderClass, tabClass: pgTabClass }),
  )

  const props: PropRow[] = [
    {
      name: 'tabs',
      type: 'Tab<TState>[]',
      defaultValue: '—',
      note: 'Label, path, optional toolbar snippet, content snippet.',
    },
    { name: 'state', type: 'TState', defaultValue: '—', note: 'Passed to the toolbar/content snippets.' },
    { name: 'pathname', type: 'string', defaultValue: '—', note: 'Route mode: active path drives link rendering.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "'Tabs'", note: 'Accessible name for the nav.' },
    { name: 'class', type: 'string', defaultValue: "''", note: 'Extra classes for the header row.' },
    { name: 'headerClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the header row classes.' },
  ]
</script>

{#snippet overviewContent(state: DemoState)}
  <p class="text-sm text-slate-300">overview content — {state.note}</p>
{/snippet}

{#snippet overviewToolbar(state: DemoState)}
  <span class="text-sm text-slate-400">toolbar: {state.note}</span>
{/snippet}

{#snippet detailsContent(state: DemoState)}
  <p class="text-sm text-slate-300">details content — {state.note}</p>
{/snippet}

{#snippet resetIcon()}
  <ResetIcon className="h-4 w-4" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Mode">
      <SelectDropdown
        buttonLabel={pgRouteMode ? 'Route mode' : 'Default'}
        activeValue={pgRouteMode}
        ariaLabel="Mode"
        options={modeOptions}
        onSelect={value => (pgRouteMode = value)}
        clearable
        clearLabel="Clear mode"
        onClear={() => (pgRouteMode = '')} />
    </FormField>
    <FormField label="Style">
      <SelectDropdown
        buttonLabel={pgStyled ? 'Styled' : 'Default'}
        activeValue={pgStyled}
        ariaLabel="Style"
        options={styleOptions}
        onSelect={value => {
          pgStyled = value
          pgHeaderClass = STYLED_HEADER
          pgTabClass = STYLED_TAB
        }}
        clearable
        clearLabel="Clear style"
        onClear={() => {
          pgStyled = ''
          pgHeaderClass = ''
          pgTabClass = ''
        }} />
    </FormField>
    <FormField label="Header class" htmlFor="pg-headerclass">
      <input
        id="pg-headerclass"
        bind:value={pgHeaderClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Class" htmlFor="pg-class">
      <input
        id="pg-class"
        bind:value={pgTabClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Tabs" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{
      overviewContent,
      overviewToolbar,
      detailsContent,
      demoState,
      routePath: pgRoutePath,
      defaultLabel: i18n.t('showcase.default'),
      customizedLabel: i18n.t('showcase.customized'),
      componentsLabel: i18n.t('showcase.components'),
    }}>
    {#if pgRouteMode}
      <Button onClick={() => (pgRoutePath = pgRoutePath === '#overview' ? '#details' : '#overview')}>
        pathname: {pgRoutePath}
      </Button>
    {/if}
    <Tabs
      tabs={[
        {
          label: i18n.t('showcase.default'),
          path: overviewPath,
          content: overviewContent,
          toolbar: overviewToolbar,
        },
        { label: i18n.t('showcase.customized'), path: detailsPath, content: detailsContent },
      ]}
      state={demoState}
      pathname={pgRouteMode ? pgRoutePath : undefined}
      headerClass={pgHeaderClass || undefined}
      class={pgTabClass || undefined}
      ariaLabel={i18n.t('showcase.components')} />
  </ShowcaseSection>
</ShowcasePage>
