<script lang="ts">
  import type { Snippet } from 'svelte'
  import { page } from '$app/state'
  import { getI18nContext } from '$lib/i18n.svelte'
  import { SHOWCASE_COMPONENTS } from '$lib/showcase-components'
  import SearchInput from '$lib/components/SearchInput.svelte'
  import Splitter from '$lib/components/Splitter.svelte'

  const i18n = getI18nContext()

  const SPLIT_PANE_MIN_WIDTH = 160
  const SPLIT_PANE_MAX_WIDTH = 480
  const SPLIT_PANE_DEFAULT_WIDTH = 288

  let { children }: { children: Snippet } = $props()

  let query = $state('')
  let paneSize = $state(SPLIT_PANE_DEFAULT_WIDTH)

  const currentPath = $derived(page.url.pathname)
  const filteredComponents = $derived.by(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return SHOWCASE_COMPONENTS
    return SHOWCASE_COMPONENTS.filter(component => component.name.toLowerCase().includes(needle))
  })

  function handlePaneChange(value: number) {
    paneSize = value
  }
</script>

<div class="flex min-h-0 flex-1 flex-col md:flex-row">
  <aside
    class="flex min-h-0 flex-col gap-2 border-b border-slate-800 p-3 md:shrink-0 md:border-b-0 md:border-r"
    style={`flex-basis: ${paneSize}px`}
    tabindex="-1">
    <SearchInput bind:value={query} ariaLabel={i18n.t('showcase.searchComponents')} />
    <nav class="min-h-0 flex-1 overflow-y-auto" tabindex="-1" aria-label={i18n.t('showcase.components')}>
      <ul class="flex flex-col gap-1">
        {#each filteredComponents as component (component.slug)}
          {@const active = currentPath === `/components/${component.slug}`}
          <li>
            <a
              href={`/components/${component.slug}`}
              aria-current={active ? 'page' : undefined}
              class={`block rounded-md px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500/40 motion-reduce:transition-none ${
                active
                  ? 'bg-cyan-500/15 text-cyan-200'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-cyan-200'
              }`}>
              {component.name}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </aside>

  <Splitter
    orientation="vertical"
    className="hidden md:block"
    value={paneSize}
    min={SPLIT_PANE_MIN_WIDTH}
    max={SPLIT_PANE_MAX_WIDTH}
    onChange={handlePaneChange} />
  <Splitter
    orientation="horizontal"
    className="md:hidden"
    value={paneSize}
    min={SPLIT_PANE_MIN_WIDTH}
    max={SPLIT_PANE_MAX_WIDTH}
    onChange={handlePaneChange} />

  <main tabindex="-1" class="min-h-0 min-w-0 flex-1 overflow-y-auto outline-none">
    {@render children()}
  </main>
</div>
