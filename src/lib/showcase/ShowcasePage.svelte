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
    // Right-aligned controls on the component-name row (e.g. the code toggle
    // when a page hosts it beside the title instead of in its section).
    actions?: Snippet
    wide?: boolean
  }

  let { name, children, props, actions, wide = false }: Props = $props()
  const i18n = getI18nContext()
  // Unique per instance so two mounted pages never collide on the related
  // nav's label id.
  const relatedId = $props.id()
  const relatedLabelId = `${relatedId}-related`

  // Each related chip takes the next color so a page's row reads as distinct
  // pills; the palette cycles if a component ever has more relations. The
  // shared base (shape + hover) is repeated so every entry is a literal class
  // string Tailwind can see.
  const RELATED_CHIP_CLASSES = [
    'rounded-full border border-cyan-700/60 bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-amber-700/60 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-violet-700/60 bg-violet-500/15 px-2 py-0.5 text-xs text-violet-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-emerald-700/60 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-rose-700/60 bg-rose-500/15 px-2 py-0.5 text-xs text-rose-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-sky-700/60 bg-sky-500/15 px-2 py-0.5 text-xs text-sky-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-indigo-700/60 bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-teal-700/60 bg-teal-500/15 px-2 py-0.5 text-xs text-teal-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-fuchsia-700/60 bg-fuchsia-500/15 px-2 py-0.5 text-xs text-fuchsia-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-orange-700/60 bg-orange-500/15 px-2 py-0.5 text-xs text-orange-200 transition hover:brightness-110 motion-reduce:transition-none',
  ]

  // The routed slug drives relatedness, so a page needs no extra prop. A
  // non-component route (or an unrelated slug) yields no related row.
  const related = $derived.by(() => {
    const match = /^\/components\/([^/]+)/.exec(page.url.pathname)
    return match ? getRelatedComponents(match[1]) : []
  })
</script>

<div class={`mx-auto flex w-full flex-col gap-6 px-4 py-6 ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}>
  <div class="flex flex-col gap-3">
    <header class="flex flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <h1 class="text-base font-semibold tracking-tight sm:text-lg">{name}</h1>
        {#if actions}
          {@render actions()}
        {/if}
      </div>
      {#if related.length > 0}
        <nav aria-labelledby={relatedLabelId} class="flex flex-wrap items-center gap-2">
          <span id={relatedLabelId} class="text-xs text-slate-500">{i18n.t('showcase.related')}</span>
          {#each related as component, index (component.slug)}
            <a
              href={`/components/${component.slug}`}
              class="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40">
              <Chip label={component.name} chipClass={RELATED_CHIP_CLASSES[index % RELATED_CHIP_CLASSES.length]} />
            </a>
          {/each}
        </nav>
      {/if}
    </header>
    {@render children()}
  </div>
  {#if props}
    <section aria-labelledby="showcase-props-heading">
      <h2 id="showcase-props-heading" class="mb-3 text-md font-semibold text-slate-100">
        {i18n.t('showcase.props')}
      </h2>
      {@render props()}
    </section>
  {/if}
</div>
