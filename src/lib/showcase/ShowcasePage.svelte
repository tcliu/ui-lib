<script lang="ts">
  import type { Snippet } from 'svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import CodeSnippet from './CodeSnippet.svelte'

  interface Props {
    name: string
    children: Snippet
    props?: Snippet
    code?: string
  }

  let { name, children, props, code }: Props = $props()
  const i18n = getI18nContext()
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
  <h1 class="text-base font-semibold tracking-tight sm:text-lg">{name}</h1>
  {@render children()}
  {#if code}
    <CodeSnippet {code} />
  {/if}
  {#if props}
    <section aria-labelledby="showcase-props-heading">
      <h2 id="showcase-props-heading" class="mb-3 text-md font-semibold text-slate-100">
        {i18n.t('showcase.props')}
      </h2>
      {@render props()}
    </section>
  {/if}
</div>
