<script lang="ts">
  import type { Snippet } from 'svelte'
  import '../styles.css'
  import { createAppI18n, setI18nContext } from '$lib/i18n.svelte'
  import LanguageMenu from '$lib/components/LanguageMenu.svelte'
  import ThemeMenu from '$lib/components/ThemeMenu.svelte'
  import Button from '$lib/components/Button.svelte'
  import MenuIcon from '$lib/icons/MenuIcon.svelte'
  import { getPickerOpen, setPickerOpen } from '$lib/showcase-picker.svelte'
  import type { LayoutData } from './$types'

  // One i18n store per app instance; children read it through the context.
  const i18n = createAppI18n()
  setI18nContext(i18n)

  let { children, data }: { children: Snippet; data: LayoutData } = $props()

  const pickerOpen = $derived(getPickerOpen())
</script>

<div class="flex h-dvh flex-col bg-slate-950 text-slate-100">
  <header class="flex flex-none items-center justify-between gap-4 border-b border-slate-800 px-3 py-3 sm:px-4">
    <div class="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        className="-ml-1"
        ariaLabel={i18n.t('showcase.toggleComponents')}
        ariaExpanded={pickerOpen}
        tooltip={i18n.t('showcase.toggleComponents')}
        tooltipAlign="left"
        preventFocusSteal
        onClick={() => setPickerOpen(!pickerOpen)}>
        {#snippet icon()}
          <MenuIcon className="h-4 w-4" />
        {/snippet}
      </Button>
      <h1 class="text-base font-semibold tracking-tight text-slate-200 sm:text-lg">{i18n.t('showcase.title')}</h1>
    </div>
    <div class="flex items-center gap-2">
      <ThemeMenu align="right" />
      <LanguageMenu align="right" />
    </div>
  </header>
  <div class="flex min-h-0 flex-1 flex-col">
    {@render children()}
  </div>
</div>

{#if data?.devTag}
  <div
    class="fixed bottom-0 left-0 z-50 flex max-w-72 bg-lime-400 px-3 py-2 text-sm font-bold text-green-950"
    title={data.devTag}>
    <span class="min-w-0 truncate">{data.devTag}</span>
  </div>
{/if}
