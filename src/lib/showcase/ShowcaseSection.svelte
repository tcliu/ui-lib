<script lang="ts">
  import type { Snippet } from 'svelte'
  import Button from '$lib/components/Button.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import CodeSnippet from './CodeSnippet.svelte'
  import { SnippetPreview } from './use-snippet-preview.svelte'

  interface Props {
    title: string
    children: Snippet
    code?: string
    scope?: Record<string, unknown>
    // Static panel below the demo (and the code editor when open), separated
    // by a rule. It stays mounted while the live snippet swaps the demo, so
    // snippet reproductions keep comparing demo text only.
    footer?: Snippet
  }

  let { title, children, code, scope, footer }: Props = $props()
  const i18n = getI18nContext()

  const preview = new SnippetPreview({ getSeed: () => code ?? '', getScope: () => scope ?? {} })
</script>

{#snippet codeIcon()}
  <CodeIcon className="h-4 w-4" />
{/snippet}

<section aria-label={title} class="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
  <div class="mb-4 flex items-center justify-between gap-2">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
    {#if code}
      <Button
        variant="ghost"
        size="sm"
        icon={codeIcon}
        ariaLabel={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
        ariaExpanded={preview.open}
        tooltip={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
        onClick={() => preview.toggle()} />
    {/if}
  </div>
  {#if preview.live}
    <div bind:this={preview.liveEl} class="flex flex-wrap items-start gap-4 [contain:paint]"></div>
  {:else}
    <div class="flex flex-wrap items-start gap-4">
      {@render children()}
    </div>
  {/if}
  {#if code && preview.open}
    <div class="mt-4">
      {#if preview.error}
        <p
          role="alert"
          class="mb-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-200">
          {preview.error}
        </p>
      {/if}
      <CodeSnippet bind:draft={preview.draft} initial={code ?? ''} />
    </div>
  {/if}
  {#if footer}
    <hr class="my-4 border-slate-800" />
    {@render footer()}
  {/if}
</section>
