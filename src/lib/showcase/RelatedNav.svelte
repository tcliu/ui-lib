<script lang="ts">
  import { page } from '$app/state'
  import Chip from '$lib/components/Chip.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import { getRelatedComponents } from './showcase-components'

  const i18n = getI18nContext()
  // Unique per instance so two mounted navs never collide on the label id.
  const relatedId = $props.id()
  const relatedLabelId = `${relatedId}-related`

  // Each related chip takes the next color so a page's row reads as distinct
  // pills; the palette cycles if a component ever has more relations. The
  // shared base (shape + hover) is repeated so every entry is a literal class
  // string Tailwind can see.
  const RELATED_CHIP_CLASSES = [
    'rounded-full border border-cyan-700/60 bg-cyan-500/15 text-cyan-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-amber-700/60 bg-amber-500/15 text-amber-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-violet-700/60 bg-violet-500/15 text-violet-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-emerald-700/60 bg-emerald-500/15 text-emerald-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-rose-700/60 bg-rose-500/15 text-rose-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-sky-700/60 bg-sky-500/15 text-sky-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-indigo-700/60 bg-indigo-500/15 text-indigo-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-teal-700/60 bg-teal-500/15 text-teal-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-fuchsia-700/60 bg-fuchsia-500/15 text-fuchsia-200 transition hover:brightness-110 motion-reduce:transition-none',
    'rounded-full border border-orange-700/60 bg-orange-500/15 text-orange-200 transition hover:brightness-110 motion-reduce:transition-none',
  ]

  // The routed slug drives relatedness, so a nav needs no extra prop. A
  // non-component route (or an unrelated slug) yields no row.
  const related = $derived.by(() => {
    const match = /^\/components\/([^/]+)/.exec(page.url.pathname)
    return match ? getRelatedComponents(match[1]) : []
  })
</script>

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
