<script lang="ts">
  import type { Snippet } from 'svelte'
  import { getI18nContext } from '$lib/i18n.svelte'

  interface Props {
    name: string
    children: Snippet
    props?: Snippet
    wide?: boolean
  }

  let { name, children, props, wide = false }: Props = $props()
  const i18n = getI18nContext()
</script>

<div class={`mx-auto flex w-full flex-col gap-6 px-4 py-6 ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}>
  <h1 class="text-base font-semibold tracking-tight sm:text-lg">{name}</h1>
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
