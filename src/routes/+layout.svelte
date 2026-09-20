<script lang="ts">
  import type { Snippet } from 'svelte'
  import '../styles.css'
  import { page } from '$app/state'
  import { APP_SHELL_DEFAULT_WIDTH } from '$lib/app-shell'
  import AppShell from '$lib/components/AppShell.svelte'
  import LanguageMenu from './_chrome/LanguageMenu.svelte'
  import SearchInput from '$lib/components/SearchInput.svelte'
  import ThemeMenu from './_chrome/ThemeMenu.svelte'
  import { createAppI18n, setI18nContext } from '$lib/i18n.svelte'
  import { SHOWCASE_COMPONENTS } from '$lib/showcase-components'
  import { getPickerOpen, setPickerOpen } from '$lib/showcase-picker.svelte'
  import type { LayoutData } from './$types'

  // One i18n store per app instance; children read it through the context.
  const i18n = createAppI18n()
  setI18nContext(i18n)

  let { children, data }: { children: Snippet; data: LayoutData } = $props()

  const pickerOpen = $derived(getPickerOpen())

  let query = $state('')
  let paneSize = $state(APP_SHELL_DEFAULT_WIDTH)

  const currentPath = $derived(page.url.pathname)
  const filteredComponents = $derived.by(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return SHOWCASE_COMPONENTS
    return SHOWCASE_COMPONENTS.filter(component => component.name.toLowerCase().includes(needle))
  })
</script>

<div class="flex h-dvh flex-col bg-slate-950 text-slate-100">
  <AppShell
    open={pickerOpen}
    paneSize={paneSize}
    toggleShowLabel={i18n.t('showcase.toggleComponents')}
    toggleHideLabel={i18n.t('showcase.toggleComponents')}
    resizeLabel={i18n.t('splitter.resize')}
    onOpenChange={setPickerOpen}
    onPaneChange={value => (paneSize = value)}>
    {#snippet headerLeft()}
      <h1 class="text-base font-semibold tracking-tight text-slate-200 sm:text-lg">{i18n.t('showcase.title')}</h1>
    {/snippet}
    {#snippet headerRight()}
      <ThemeMenu align="right" />
      <LanguageMenu align="right" />
    {/snippet}
    {#snippet leftPane()}
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
                  active ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-300 hover:bg-slate-800 hover:text-cyan-200'
                }`}>
                {component.name}
              </a>
            </li>
          {/each}
        </ul>
      </nav>
    {/snippet}
    {@render children()}
  </AppShell>
</div>

{#if data?.devTag}
  <div
    class="fixed bottom-0 left-0 z-50 flex max-w-72 bg-lime-400 px-3 py-2 text-sm font-bold text-green-950"
    title={data.devTag}>
    <span class="min-w-0 truncate">{data.devTag}</span>
  </div>
{/if}
