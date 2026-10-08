<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import DateRangePicker from '$lib/components/DateRangePicker.svelte'
  import Resizable from '$lib/components/Resizable.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { extractScriptValue } from '$lib/showcase/snippet-attributes'
  import { splitLeadingScript } from '$lib/showcase/snippet-source'
  import {
    buildDateRangePickerSnippet,
    DATE_STAGE_CONTENT,
    DATE_STAGE_DEFAULT_WIDTH,
    DATE_STAGE_HOST,
    DATE_STAGE_MIN_WIDTH,
    DATE_STAGE_PANE,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Empty strings render the unset range, so the
  // cleared form applies no overrides.
  let pgFrom = $state('')
  let pgTo = $state('')
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(DATE_STAGE_DEFAULT_WIDTH)

  function clearPlayground() {
    pgFrom = ''
    pgTo = ''
    pgStageWidth = DATE_STAGE_DEFAULT_WIDTH
  }

  const code = $derived.by(() => buildDateRangePickerSnippet({ from: pgFrom, to: pgTo }))

  // The page owns the preview so its code toggle can sit in the component-title
  // row (ShowcasePage's `actions`) while the section renders the demo and the
  // editor below.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({}),
    onCompiled: syncPlaygroundFromSnippet,
  })

  // Write a compiled snippet's seeded range back into playground state, so
  // snippet edits show up in the Value column. Only the builder's script-local
  // shape maps; hand-written state the page did not author never syncs.
  // `syncSeed` then holds the regenerated seed back so the editor keeps the
  // user's text.
  function syncPlaygroundFromSnippet(source: string) {
    const declarations = splitLeadingScript(source).declarations
    const from = extractScriptValue(declarations, 'from')
    if (from !== null) {
      pgFrom = from
    }
    const to = extractScriptValue(declarations, 'to')
    if (to !== null) {
      pgTo = to
    }
    preview.syncSeed()
  }

  // Editable rows first (A–Z), then the function props (A–Z).
  const props: PropRow[] = [
    { name: 'from', type: 'string', defaultValue: "''", note: 'Range start as YYYY-MM-DD; invalid reads as unset.' },
    { name: 'to', type: 'string', defaultValue: "''", note: 'Range end as YYYY-MM-DD; invalid reads as unset.' },
    {
      name: 'onFrom',
      type: '(value: string) => void',
      defaultValue: '—',
      note: 'Called with the picked start (or reset).',
    },
    {
      name: 'onTo',
      type: '(value: string) => void',
      defaultValue: '—',
      note: 'Called with the picked end (or reset).',
    },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet codeIcon()}
  <CodeIcon size="sm" />
{/snippet}

{#snippet pageActions()}
  <Button
    variant="ghost"
    size="sm"
    icon={codeIcon}
    ariaLabel={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    ariaExpanded={preview.open}
    tooltip={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    onClick={() => preview.toggle()} />
{/snippet}

{#snippet propValue(row: PropRow)}
  {#if row.name === 'from'}
    <TextInput bind:value={pgFrom} ariaLabel="from value" placeholder="YYYY-MM-DD" />
  {:else if row.name === 'to'}
    <TextInput bind:value={pgTo} ariaLabel="to value" placeholder="YYYY-MM-DD" />
  {:else}
    <span class="text-slate-500">—</span>
  {/if}
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} value={propValue} />
{/snippet}

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; this panel
    keeps only Reset (and any future composite preset that drives several props
    at once). -->
  <Buttons className="flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
{/snippet}

<ShowcasePage name="DateRangePicker" props={propsSnippet} actions={pageActions} wide>
  <ShowcaseSection
    title="DateRangePicker"
    {code}
    {preview}
    showHeader={false}
    bordered={false}
    footer={settingsPanel}
    scope={{}}>
    <div class={DATE_STAGE_HOST}>
      <Resizable
        width={pgStageWidth}
        minWidth={DATE_STAGE_MIN_WIDTH}
        maxWidth="parent"
        onResize={nextWidth => (pgStageWidth = nextWidth)}>
        <div class={DATE_STAGE_PANE}>
          <div class={DATE_STAGE_CONTENT}>
            <DateRangePicker
              from={pgFrom}
              to={pgTo}
              onFrom={value => (pgFrom = value)}
              onTo={value => (pgTo = value)} />
            <span class="text-sm text-slate-400">range: {pgFrom || '—'} – {pgTo || '—'}</span>
          </div>
        </div>
      </Resizable>
    </div>
  </ShowcaseSection>
</ShowcasePage>
