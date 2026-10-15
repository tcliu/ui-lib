<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import Tabs from '$lib/components/Tabs.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetToggle } from '$lib/showcase/snippet-field'
  import { buildTabsSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  interface DemoState {
    note: string
  }

  const demoState: DemoState = { note: 'shared state' }

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgRouteMode` is demo-only branching with no prop row, so it keeps a
  // settings panel below; `pgRoutePath` is interaction state.
  let pgRoutePath = $state('#overview')
  let pgRouteMode = $state('')
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)
  let pgAriaLabel = $state('Components')
  let pgAriaLabelOn = $state(true)
  let pgPathname = $state('')
  let pgPathnameOn = $state(false)

  const modeOptions = [{ value: 'yes', label: 'Route mode' }]

  const overviewPath = $derived(pgRouteMode ? '#overview' : 'overview')
  const detailsPath = $derived(pgRouteMode ? '#details' : 'details')

  function clearPlayground() {
    pgRoutePath = '#overview'
    pgRouteMode = ''
    pgClassName = ''
    pgClassNameOn = false
    pgAriaLabel = 'Components'
    pgAriaLabelOn = true
    pgPathname = ''
    pgPathnameOn = false
  }

  const code = $derived.by(() =>
    buildTabsSnippet({ routeMode: pgRouteMode, className: pgClassName, classNameOn: pgClassNameOn, ariaLabel: pgAriaLabel, ariaLabelOn: pgAriaLabelOn, pathname: pgPathname, pathnameOn: pgPathnameOn }),
  )

  // The page owns the preview so the shell can host the code toggle (and the
  // playground Reset) in the sticky title row while it renders the demo and
  // the editor below. Scope keys are demo-owned names that never collide
  // with the preamble's shared imports.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      overviewContent,
      overviewToolbar,
      detailsContent,
      demoState,
      routePath: pgRoutePath,
      defaultLabel: i18n.t('showcase.default'),
      customizedLabel: i18n.t('showcase.customized'),
      componentsLabel: i18n.t('showcase.components'),
    }),
    sync: { tag: 'Tabs', getFields: () => syncFields },
  })

  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The tab list
  // and its snippets are demo data with no prop row.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string?', defaultValue: "'Tabs'", editorDefaultValue: 'Tabs', note: 'Accessible name for the nav; the eye stages the customization.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, placeholder: 'Tabs', toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'componentsLabel' } },
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes appended to the header row; the eye stages the customization.', editor: 'text', clearable: true, value: pgClassName, onChange: value => { pgClassName = value; pgClassNameOn = true; }, toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'pathname', type: 'string?', defaultValue: '—', note: 'Route mode: active path drives link rendering; the eye stages the customization.', editor: 'text', clearable: true, value: pgPathname, onChange: value => { pgPathname = value; pgPathnameOn = true; }, toggle: snippetToggle(pgPathnameOn, enabled => (pgPathnameOn = enabled)), sync: { kind: 'text' } },
    // Read-only: the generic demo state object has no literal editor.
    { name: 'state', type: 'TState', defaultValue: '—', note: 'Passed to the toolbar/content snippets.' },
    { name: 'tabs', type: 'Tab<TState>[]', defaultValue: '—', note: 'Label, path, optional toolbar snippet, content snippet.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // The seed covers every override except the route interaction state (the
  // snippet reads it from scope), so only path edits need a scope refresh;
  // everything else reseeds. The refresh preserves the editor text by
  // recompiling the draft.
  useScopeRefresh(preview, () => [pgRoutePath])
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

{#snippet settingsPanel()}
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
  </div>
{/snippet}

<ShowcasePage
    {fields}
    title="Tabs"
    {code}
    {preview}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{
      overviewContent,
      overviewToolbar,
      detailsContent,
      demoState,
      routePath: pgRoutePath,
      defaultLabel: i18n.t('showcase.default'),
      customizedLabel: i18n.t('showcase.customized'),
      componentsLabel: i18n.t('showcase.components'),
    }}
>
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
      pathname={pgPathnameOn && pgPathname ? pgPathname : (pgRouteMode ? pgRoutePath : undefined)}
      className={pgClassNameOn && pgClassName ? pgClassName : undefined}
      ariaLabel={pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : i18n.t('showcase.components')} />
  </ShowcasePage>
