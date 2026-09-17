<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Tabs from '$lib/components/Tabs.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  interface DemoState {
    note: string
  }

  const demoState: DemoState = { note: 'shared state' }

  let routePath = $state('#overview')

  const codeDefault = `<Tabs
  tabs={[
    { label: 'Default', path: 'overview', content: overviewContent, toolbar: overviewToolbar },
    { label: 'Customized', path: 'details', content: detailsContent },
  ]}
  state={demoState}
  ariaLabel="Components" />`

  const codeRouteMode = `<Button onClick={() => (routePath = routePath === '#overview' ? '#details' : '#overview')}>
  pathname: {routePath}
</Button>
<Tabs
  tabs={[
    { label: 'Overview', path: '#overview', content: overviewContent },
    { label: 'Details', path: '#details', content: detailsContent },
  ]}
  state={demoState}
  pathname={routePath} />`

  const codeCustomized = `<Tabs
  tabs={[{ label: 'Apply', path: 'apply', content: overviewContent }]}
  state={demoState}
  headerClass="flex w-full items-center gap-2 rounded-lg border border-cyan-500/40 p-2"
  class="text-cyan-300" />`

  const props: PropRow[] = [
    { name: 'tabs', type: 'Tab<TState>[]', defaultValue: '—', note: 'Label, path, optional toolbar snippet, content snippet.' },
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

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="Tabs" props={propsSnippet}>
  <ShowcaseSection
    title={i18n.t('showcase.default')}
    code={codeDefault}
    scope={{ overviewContent, overviewToolbar, detailsContent, demoState }}>
    <Tabs
      tabs={[
        {
          label: i18n.t('showcase.default'),
          path: 'overview',
          content: overviewContent,
          toolbar: overviewToolbar,
        },
        { label: i18n.t('showcase.customized'), path: 'details', content: detailsContent },
      ]}
      state={demoState}
      ariaLabel={i18n.t('showcase.components')} />
  </ShowcaseSection>

  <ShowcaseSection
    title={i18n.t('showcase.routeMode')}
    code={codeRouteMode}
    scope={{ routePath, overviewContent, detailsContent, demoState }}>
    <div class="flex flex-col gap-3">
      <Button onClick={() => (routePath = routePath === '#overview' ? '#details' : '#overview')}>
        pathname: {routePath}
      </Button>
      <Tabs
        tabs={[
          { label: 'Overview', path: '#overview', content: overviewContent },
          { label: 'Details', path: '#details', content: detailsContent },
        ]}
        state={demoState}
        pathname={routePath} />
    </div>
  </ShowcaseSection>

  <ShowcaseSection
    title={i18n.t('showcase.customized')}
    code={codeCustomized}
    scope={{ overviewContent, demoState }}>
    <Tabs
      tabs={[{ label: i18n.t('common.apply'), path: 'apply', content: overviewContent }]}
      state={demoState}
      headerClass="flex w-full items-center gap-2 rounded-lg border border-cyan-500/40 p-2"
      class="text-cyan-300" />
  </ShowcaseSection>
</ShowcasePage>
