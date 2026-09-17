<script lang="ts">
  import type { Snippet } from 'svelte'
  import { getI18nContext } from '$lib/i18n.svelte'

  interface Props {
    name: string
    children: Snippet
    props?: Snippet
  }

  let { name, children, props }: Props = $props()
  const i18n = getI18nContext()
</script>

<div class="flex h-dvh flex-col bg-slate-950 text-slate-100">
  <header class="flex shrink-0 items-center gap-3 border-b border-slate-800 px-3 py-3 sm:px-4">
    <a
      href="/"
      class="rounded-md border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none transition hover:border-cyan-500 hover:text-cyan-300 focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/40 motion-reduce:transition-none">
      {i18n.t('showcase.backToIndex')}
    </a>
    <h1 class="text-base font-semibold tracking-tight sm:text-lg">{name}</h1>
  </header>

  <main class="min-h-0 flex-1 overflow-y-auto" tabindex="-1">
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      {@render children()}
      {#if props}
        <section aria-labelledby="showcase-props-heading">
          <h2 id="showcase-props-heading" class="mb-3 text-md font-semibold text-slate-100">
            {i18n.t('showcase.props')}
          </h2>
          {@render props()}
        </section>
      {/if}
    </div>
  </main>
</div>
