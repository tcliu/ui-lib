<script lang="ts">
  import type { Snippet } from 'svelte'
  import { page } from '$app/state'
  import Chip from '$lib/components/Chip.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import { getRelatedComponents } from '$lib/showcase-components'

  interface Props {
    name: string
    children: Snippet
    props?: Snippet
    wide?: boolean
  }

  let { name, children, props, wide = false }: Props = $props()
  const i18n = getI18nContext()

  // The routed slug drives relatedness, so a page needs no extra prop. A
  // non-component route (or an unrelated slug) yields no related row.
  const related = $derived.by(() => {
    const match = /^\/components\/([^/]+)/.exec(page.url.pathname)
    return match ? getRelatedComponents(match[1]) : []
  })
</script>

<div class={`mx-auto flex w-full flex-col gap-6 px-4 py-6 ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}>
  <header class="flex flex-col gap-2">
    <h1 class="text-base font-semibold tracking-tight sm:text-lg">{name}</h1>
    {#if related.length > 0}
      <nav aria-labelledby="showcase-related-label" class="flex flex-wrap items-center gap-2">
        <span id="showcase-related-label" class="text-xs text-slate-500">{i18n.t('showcase.related')}</span>
        {#each related as component (component.slug)}
          <a
            href={`/components/${component.slug}`}
            class="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40">
            <Chip
              label={component.name}
              chipClass="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-cyan-200 transition hover:border-cyan-500/60 hover:text-cyan-100 motion-reduce:transition-none" />
          </a>
        {/each}
      </nav>
    {/if}
  </header>
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
