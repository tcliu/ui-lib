<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import Tabs from '$lib/components/Tabs.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/playground/size-input'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import { applied, eye, eyeToggle, stage, staged } from '$showcase/playground/staged'
  import { textField, sizeField } from '$showcase/playground/snippet-field'
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
  const INITIAL = {
    routePath: '#overview',
    routeMode: '',
    className: staged(''),
    ariaLabel: staged('Components', true),
    pathname: staged(''),
    size: staged('md'),
  }
  let pg = $state(structuredClone(INITIAL))

  const modeOptions = [{ value: 'yes', label: 'Route mode' }]

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
    { value: 'xl', label: 'xl' },
  ]

  const overviewPath = $derived(pg.routeMode ? '#overview' : 'overview')
  const detailsPath = $derived(pg.routeMode ? '#details' : 'details')
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildTabsSnippet({ routeMode: pg.routeMode, className: pg.className, ariaLabel: pg.ariaLabel, pathname: pg.pathname, size: pg.size }),
  )

  // The page owns the preview so the shell can host the code toggle (and the
  // playground Reset) in the sticky title row while it renders the demo and
  // the editor below. Scope keys are demo-owned names that never collide
  // with the preamble's shared imports.
  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The tab list
  // and its snippets are demo data with no prop row.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string?', defaultValue: "'Tabs'", editorDefaultValue: 'Tabs', note: 'Accessible name for the nav.', editor: 'text', clearable: true, ...eye(pg.ariaLabel), onChange: value => stage(pg.ariaLabel, value), placeholder: 'Tabs', toggle: eyeToggle(pg.ariaLabel), sync: { kind: 'scopeText', scopeRef: 'componentsLabel' } },
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes appended to the header row.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    textField({ name: 'pathname', type: 'string?', defaultValue: '—', note: 'Route mode: active path drives link rendering.', clearable: true, ...eye(pg.pathname) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels. Scales the nav and tab text and chrome.', ...eye(pg.size) }),
    // Read-only: the generic demo state object has no literal editor.
    { name: 'state', type: 'TState', defaultValue: '—', note: 'Passed to the toolbar/content snippets.' },
    { name: 'tabs', type: 'Tab<TState>[]', defaultValue: '—', note: 'Label, path, optional toolbar snippet, content snippet.' },
  ])

  // The seed covers every override except the route interaction state (the
  // snippet reads it from scope), so only path edits need a scope refresh;
  // everything else reseeds. The refresh preserves the editor text by
  // recompiling the draft.
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
        buttonLabel={pg.routeMode ? 'Route mode' : 'Default'}
        activeValue={pg.routeMode}
        ariaLabel="Mode"
        options={modeOptions}
        onSelect={value => (pg.routeMode = value)}
        clearable
        clearLabel="Clear mode"
        onClear={() => (pg.routeMode = '')} />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        activeValue={pg.size.value}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => stage(pg.size, value)}
        clearable
        clearLabel="Clear size"
        onClear={() => {
          pg.size.value = 'md'
          pg.size.on = false
        }} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage
    {fields}
    title="Tabs"
    {code}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{
      overviewContent,
      overviewToolbar,
      detailsContent,
      demoState,
      routePath: pg.routePath,
      defaultLabel: i18n.t('showcase.default'),
      customizedLabel: i18n.t('showcase.customized'),
      componentsLabel: i18n.t('showcase.components'),
    }}

    sync={{ tag: 'Tabs' }}
    scopeRefresh={() => [pg.routePath]}
  >
    {#if pg.routeMode}
      <Button onClick={() => (pg.routePath = pg.routePath === '#overview' ? '#details' : '#overview')}>
        pathname: {pg.routePath}
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
      pathname={applied(pg.pathname) || (pg.routeMode ? pg.routePath : undefined)}
      className={applied(pg.className) || undefined}
      ariaLabel={applied(pg.ariaLabel) || i18n.t('showcase.components')}
      size={demoSize} />
  </ShowcasePage>
