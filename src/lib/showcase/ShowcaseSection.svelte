<script lang="ts">
  import type { Snippet } from 'svelte'
  import Button from '$lib/components/Button.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import CodeSnippet from './CodeSnippet.svelte'

  interface Props {
    title: string
    children: Snippet
    code?: string
    scope?: Record<string, unknown>
  }

  let { title, children, code, scope }: Props = $props()
  const i18n = getI18nContext()

  let open = $state(false)
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
        ariaLabel={open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
        ariaExpanded={open}
        tooltip={open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
        onClick={() => (open = !open)} />
    {/if}
  </div>
  <div class="flex flex-wrap items-start gap-4">
    {@render children()}
  </div>
  {#if code && open}
    <div class="mt-4">
      <CodeSnippet {code} {scope} />
    </div>
  {/if}
</section>
