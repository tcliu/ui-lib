<script lang="ts">
  import { onDestroy, untrack, type Snippet } from 'svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FieldTable, { type FieldConfig } from '$lib/components/FieldTable.svelte'
  import LazyCodeEditor from '$lib/components/LazyCodeEditor.svelte'
  import Resizable from '$lib/components/Resizable.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import CopyIcon from '$lib/icons/CopyIcon.svelte'
  import EyeIcon from '$lib/icons/EyeIcon.svelte'
  import EyeSlashIcon from '$lib/icons/EyeSlashIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import RelatedNav from './RelatedNav.svelte'
  import { docsHeaders } from './docs-headers'
  import { SnippetPreview } from './use-snippet-preview.svelte'
  import { syncFieldsOf, type SyncField } from './snippet-sync'
  import { useScopeRefresh } from './use-scope-refresh.svelte'

  // Optional resizable demo stage. The page supplies only its demo content and
  // the frame bounds; the shell owns the host/Resizable/pane chrome, so the
  // harness is written once instead of per page. The frame wraps the live
  // instance too, so the live mount is the pane rather than a sibling node.
  interface StageConfig {
    minWidth: number
    maxWidth?: number | 'parent'
  }

  interface Props {
    title: string
    children: Snippet
    code?: string
    scope?: Record<string, unknown>
    // Renders the demo inside the shared resizable stage frame.
    stage?: StageConfig
    // Stage width; a page binds it so its Reset can restore the seeded width.
    stageWidth?: number
    // Optional config panel pinned directly under the demo, with no
    // separator between them. It stays mounted while the live snippet swaps
    // the demo, so snippet reproductions keep comparing demo text only.
    configPanel?: Snippet
    // Caller-owned preview; the shell renders the code toggle and the
    // playground reset (when `onReset` is given) in the title row.
    preview?: SnippetPreview
    // Clears the page's playground state from the header Reset, which the
    // shell renders beside the code toggle. Omitted when a page has no
    // playground state to reset.
    onReset?: () => void
    // The converted page's props-table rows; the shell renders them as the
    // shared FieldTable, so every page carries the same section chrome.
    fields?: FieldConfig[]
    // Snippet write-back for the shell-owned preview: the tag whose
    // attributes sync, plus an optional `getFields` when the page appends
    // rows beyond `fields` (the shell derives `syncFieldsOf(fields)` else).
    sync?: { tag: string | null; getFields?: () => SyncField[] }
    // Recompile the live preview when a `scope` key the seed does not cover
    // changes; `scopeRefreshWhen` optionally gates it.
    scopeRefresh?: () => unknown
    scopeRefreshWhen?: () => boolean
  }

  let {
    title,
    children,
    code,
    scope,
    stage,
    stageWidth = $bindable(0),
    configPanel,
    preview: externalPreview,
    onReset,
    fields,
    sync,
    scopeRefresh,
    scopeRefreshWhen,
  }: Props = $props()
  const i18n = getI18nContext()

  // The stage chrome: the same hook/host/pane classes the container-sensitive
  // pages used to spell inline, kept here so the harness is written once.
  const FRAME_ROW = 'flex flex-wrap items-start gap-4'
  const FRAME_HOST = 'w-full overflow-hidden'
  const FRAME_PANE = 'flex w-full min-w-0 flex-wrap items-start gap-4'

  // Only build an owned preview when the caller passes none. The preview prop
  // is read once at init (`untrack`), so no redundant preview registers effects.
  const preview =
    untrack(() => externalPreview) ??
    untrack(
      () =>
        new SnippetPreview({
          getSeed: () => code ?? '',
          getScope: () => scope ?? {},
          ...(sync
            ? { sync: { tag: sync.tag, getFields: () => sync.getFields?.() ?? syncFieldsOf(fields ?? []) } }
            : {}),
        }),
    )

  // The shell owns the scope refresh so a page only declares the keys it
  // reads; a no-op when the page passes no `scopeRefresh`.
  useScopeRefresh(preview, () => scopeRefresh?.(), () => scopeRefreshWhen?.() ?? true)

  let feedback = $state('')
  let copyTimer: ReturnType<typeof setTimeout> | null = null
  // Demo visibility is interaction state (defaults on), owned here so every
  // page gets the toggle without repeating it.
  let showDemo = $state(true)

  // The stage frame needs an explicit height, so the shell fits it to the
  // content: a ResizeObserver tracks the pane while drags set it directly. A
  // width drag reflows the content taller and the frame follows; a height
  // drag leaves the content box unchanged, so it sticks until the content
  // itself changes.
  let stageHeight = $state(0)
  let stageContentEl = $state<HTMLElement | null>(null)

  $effect(() => {
    const content = preview.live ? preview.liveEl : stageContentEl
    if (!stage || !content) return
    const fit = () => {
      stageHeight = content.offsetHeight
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(content)
    return () => observer.disconnect()
  })

  onDestroy(() => {
    if (copyTimer) {
      clearTimeout(copyTimer)
      copyTimer = null
    }
  })

  function flash(message: string) {
    feedback = message
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copyTimer = null
      feedback = ''
    }, 1500)
  }

  function resetEditor() {
    preview.draft = code ?? ''
  }

  function copyEditor() {
    const writeText = navigator.clipboard?.writeText
    if (!writeText) {
      flash(i18n.t('showcase.copyFailed'))
      return
    }
    writeText.call(navigator.clipboard, preview.draft).then(
      () => flash(i18n.t('showcase.copied')),
      () => flash(i18n.t('showcase.copyFailed')),
    )
  }
</script>

{#snippet resetIcon()}
  <ResetIcon />
{/snippet}

{#snippet codeIcon()}
  <CodeIcon />
{/snippet}

{#snippet copyIcon()}
  <CopyIcon />
{/snippet}

{#snippet demoVisibleIcon()}
  <EyeIcon />
{/snippet}

{#snippet demoHiddenIcon()}
  <EyeSlashIcon />
{/snippet}

{#snippet demoStage()}
  {#if stage}
    <!-- The shell owns the resize harness so every container-sensitive demo
      shares one frame and its Show-code snippet stays content-only. The pane is
      the live mount (below), so the frame survives the live compile. -->
    <div
      data-showcase-demo
      class={preview.live ? `${FRAME_ROW} [contain:paint]` : FRAME_ROW}
      style={showDemo ? undefined : 'display:none'}>
      <div class={FRAME_HOST}>
        <Resizable
          width={stageWidth}
          height={stageHeight}
          minWidth={stage.minWidth}
          maxWidth={stage.maxWidth ?? 'parent'}
          onResize={(nextWidth, nextHeight) => {
            stageWidth = nextWidth
            stageHeight = nextHeight
          }}>
          {#if !preview.live}
            <div class={FRAME_PANE} bind:this={stageContentEl}>
              {@render children()}
            </div>
          {:else}
            <!-- Live-only mount: `replaceChildren` here can never drop the
              `{#if}` anchors that the static branch needs to come back. -->
            <div class={FRAME_PANE} bind:this={preview.liveEl}></div>
          {/if}
        </Resizable>
      </div>
    </div>
  {:else if preview.live}
    <div
      bind:this={preview.liveEl}
      data-showcase-demo
      class="flex flex-wrap items-start gap-4 [contain:paint]"
      style={showDemo ? undefined : 'display:none'}></div>
  {:else}
    <div
      data-showcase-demo
      class="flex flex-wrap items-start gap-4"
      style={showDemo ? undefined : 'display:none'}>
      {@render children()}
    </div>
  {/if}
  {#if code && preview.open}
    <!-- Vertical cap only: x clips (icon-button hit areas overhang the row
      edge and would otherwise force a horizontal scrollbar). -->
    <div tabindex="-1" class="max-h-[60dvh] overflow-x-clip overflow-y-auto">
      {#if preview.error}
        <p
          role="alert"
          class="mb-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-200">
          {preview.error}
        </p>
      {/if}
      <section aria-label={i18n.t('showcase.code')}>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-slate-500">{i18n.t('showcase.codeNote')}</p>
          <span class="flex items-center gap-2">
            <span role="status" aria-live="polite" class="text-xs text-slate-400">{feedback}</span>
            <Button
              variant="ghost"
              icon={resetIcon}
              ariaLabel={i18n.t('common.reset')}
              tooltip={i18n.t('common.reset')}
              onClick={resetEditor} />
            <Button
              variant="ghost"
              icon={copyIcon}
              ariaLabel={i18n.t('showcase.copyCode')}
              tooltip={i18n.t('showcase.copyCode')}
              onClick={copyEditor} />
          </span>
        </div>
        <div class="mt-2">
          <LazyCodeEditor
            bind:content={preview.draft}
            docType="html"
            editorAriaLabel={i18n.t('showcase.code')}
            containerClass="h-64 overflow-hidden rounded-md border border-slate-700 bg-slate-950"
            editorClass="h-full" />
        </div>
      </section>
    </div>
  {/if}
{/snippet}

<!-- Page container: the above-tbody block (title, demo, editor, panel) is
  fixed at its natural height and only the props table's tbody below
  scrolls, so the page never scrolls in the main column — the body
  scrollport takes the leftover height. The code editor caps at 60dvh so a
  long file scrolls inside instead of crowding the table out. If the fixed
  block alone overflows a short viewport, the main column scrolls as a
  fallback. -->
<div
  data-showcase-block
  class="mx-auto flex h-full w-full flex-col gap-3 px-4 pt-6 max-w-7xl">
  <div class="flex flex-none flex-col gap-3">
    <header data-showcase-titlebar class="flex items-start justify-between gap-3">
      <h1 class="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          icon={showDemo ? demoVisibleIcon : demoHiddenIcon}
          ariaLabel={showDemo ? i18n.t('showcase.hideDemo') : i18n.t('showcase.showDemo')}
          ariaPressed={showDemo}
          tooltip={showDemo ? i18n.t('showcase.hideDemo') : i18n.t('showcase.showDemo')}
          onClick={() => (showDemo = !showDemo)} />
        {#if code || onReset}
          <Buttons>
            {#if code}
              <Button
                variant="ghost"
                icon={codeIcon}
                ariaLabel={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
                ariaExpanded={preview.open}
                tooltip={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
                onClick={() => preview.toggle()} />
            {/if}
            {#if onReset}
              <Button
                variant="ghost"
                icon={resetIcon}
                ariaLabel={i18n.t('common.reset')}
                tooltip={i18n.t('common.reset')}
                onClick={onReset} />
            {/if}
          </Buttons>
        {/if}
      </div>
    </header>
    <RelatedNav />
    {@render demoStage()}
    {#if configPanel}
      {@render configPanel()}
    {/if}
  </div>
  {#if fields}
    <!-- Props table only: the table below (FieldTable) scrolls in the
      leftover height. The section carries its accessible name directly (no
      visible heading), so `region` locators keep resolving "Props". -->
    <section
      data-showcase-props
      aria-label={i18n.t('showcase.props')}
      class="flex min-h-40 flex-1 flex-col">
      <FieldTable {fields} {...docsHeaders(i18n)} />
    </section>
  {/if}
</div>
