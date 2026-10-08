<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import Resizable from '$lib/components/Resizable.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import {
    RESIZABLE_CONTENT,
    RESIZABLE_DEFAULT_HEIGHT,
    RESIZABLE_DEFAULT_WIDTH,
    RESIZABLE_SCROLLPORT,
    buildResizableSnippet,
    parseBound,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every bound starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgMinWidth = $state('')
  let pgMinHeight = $state('')
  let pgMaxWidth = $state('')
  let pgMaxHeight = $state('')
  // Size is interaction state, not a curated option, so it stays out of
  // isCustomized.
  let pgWidth = $state(RESIZABLE_DEFAULT_WIDTH)
  let pgHeight = $state(RESIZABLE_DEFAULT_HEIGHT)

  const minWidth = $derived(parseBound(pgMinWidth) ?? undefined)
  const minHeight = $derived(parseBound(pgMinHeight) ?? undefined)
  const maxWidth = $derived(parseBound(pgMaxWidth) ?? undefined)
  const maxHeight = $derived(parseBound(pgMaxHeight) ?? undefined)

  // Drag deltas are fractional, so round to the nearest pixel for display.
  const sizeLabel = $derived(`${Math.round(pgWidth)} × ${Math.round(pgHeight)}`)

  // Customized only when a bound actually applies: invalid text parses to
  // undefined and leaves the demo at its defaults.
  const isCustomized = $derived(
    minWidth !== undefined || minHeight !== undefined || maxWidth !== undefined || maxHeight !== undefined,
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground(): void {
    pgMinWidth = ''
    pgMinHeight = ''
    pgMaxWidth = ''
    pgMaxHeight = ''
    pgWidth = RESIZABLE_DEFAULT_WIDTH
    pgHeight = RESIZABLE_DEFAULT_HEIGHT
  }

  const code = $derived.by(() =>
    buildResizableSnippet({
      minWidth: pgMinWidth,
      minHeight: pgMinHeight,
      maxWidth: pgMaxWidth,
      maxHeight: pgMaxHeight,
    }),
  )

  const props: PropRow[] = [
    {
      name: 'width',
      type: 'number',
      defaultValue: '—',
      note: 'Container width in pixels; drive it from onResize.',
    },
    {
      name: 'height',
      type: 'number',
      defaultValue: 'auto',
      note: 'Container height in pixels; drive it from onResize. Omitted, the frame hugs its content and only the width handle renders.',
    },
    {
      name: 'minWidth',
      type: 'number',
      defaultValue: '0',
      note: 'Lower clamp for the container width.',
    },
    {
      name: 'minHeight',
      type: 'number',
      defaultValue: '0',
      note: 'Lower clamp for the container height.',
    },
    {
      name: 'maxWidth',
      type: "number | 'parent'",
      defaultValue: 'unbounded',
      note: "Upper clamp for the container width; 'parent' bounds it to the parent's content box.",
    },
    {
      name: 'maxHeight',
      type: "number | 'parent'",
      defaultValue: 'unbounded',
      note: "Upper clamp for the container height; 'parent' bounds it to the parent's content box.",
    },
    {
      name: 'onResize',
      type: '(width: number, height: number | undefined) => void',
      defaultValue: '—',
      note: 'Fires while dragging and on arrow-key nudges (`height` is `undefined` in width-only mode).',
    },
    {
      name: 'onResizeEnd',
      type: '() => void',
      defaultValue: '—',
      note: 'Fires after a drag or keyboard nudge completes.',
    },
    {
      name: 'resizeWidthLabel',
      type: 'string',
      defaultValue: "i18n 'resizable.resizeWidth'",
      note: 'Accessible name for the right-edge handle.',
    },
    {
      name: 'resizeHeightLabel',
      type: 'string',
      defaultValue: "i18n 'resizable.resizeHeight'",
      note: 'Accessible name for the bottom-edge handle.',
    },
    {
      name: 'resizeBothLabel',
      type: 'string',
      defaultValue: "i18n 'resizable.resizeBoth'",
      note: 'Accessible name for the corner handle.',
    },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the container.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Content rendered inside the container.' },
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
    <FormField label="Min width" htmlFor="pg-resizable-min-width">
      <input
        id="pg-resizable-min-width"
        bind:value={pgMinWidth}
        placeholder="0"
        inputmode="numeric"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Min height" htmlFor="pg-resizable-min-height">
      <input
        id="pg-resizable-min-height"
        bind:value={pgMinHeight}
        placeholder="0"
        inputmode="numeric"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Max width" htmlFor="pg-resizable-max-width">
      <input
        id="pg-resizable-max-width"
        bind:value={pgMaxWidth}
        placeholder="Unbounded"
        inputmode="numeric"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Max height" htmlFor="pg-resizable-max-height">
      <input
        id="pg-resizable-max-height"
        bind:value={pgMaxHeight}
        placeholder="Unbounded"
        inputmode="numeric"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Resizable" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{
      initialWidth: pgWidth,
      initialHeight: pgHeight,
      contentLabel: sizeLabel,
    }}>
    <div class={RESIZABLE_SCROLLPORT} tabindex="-1">
      <Resizable
        width={pgWidth}
        height={pgHeight}
        onResize={(nextWidth, nextHeight) => {
          pgWidth = nextWidth
          if (nextHeight !== undefined) pgHeight = nextHeight
        }}
        {minWidth}
        {minHeight}
        {maxWidth}
        {maxHeight}>
        <div class={RESIZABLE_CONTENT}>{sizeLabel}</div>
      </Resizable>
    </div>
  </ShowcaseSection>
</ShowcasePage>
