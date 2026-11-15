<script lang="ts" generics="TState">
  import type { Snippet } from 'svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import type { SizeInput } from '#lib/size-scale.js'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'

  const i18n = getI18nContext()

  export interface Tab<TState> {
    label: string
    path: string
    toolbar?: Snippet<[TState]>
    content: Snippet<[TState]>
  }

  interface Props<TState> {
    tabs: Tab<TState>[]
    state: TState
    pathname?: string
    ariaLabel?: string
    className?: string
    // Presentation variant. `underline` (default) is the bordered baseline
    // strip where each tab carries a bottom accent on the active one;
    // `segmented` is the pill row inside a bordered nav.
    variant?: 'segmented' | 'underline'
    size?: SizeInput
  }

  let {
    tabs,
    state: tabState,
    pathname,
    ariaLabel,
    className = '',
    variant = 'underline',
    size = 'md',
  }: Props<TState> = $props()

  // Fixed ratios of the size dimension, calibrated so `md` reproduces the
  // original tab bar: a 14px label, 12/8 tab padding, an 8px tab radius, and the
  // nav's 4px padding and 12px radius. The underline variant's top-corner radius
  // is its own ratio (6px at `md`), matching its reference strip.
  const TABS_RATIOS = {
    font: 0.875,
    padX: 0.75,
    padY: 0.5,
    radius: 0.5,
    underlineRadius: 0.375,
    navPad: 0.25,
    navRadius: 0.75,
  }

  const metrics = $derived(dimensionMetrics(size, TABS_RATIOS))
  const tabsStyle = $derived(sizeVarStyle('tabs', metrics))

  const isUnderline = $derived(variant === 'underline')

  // Built-in header row classes; `className` appends to these. The underline
  // strip owns the baseline, so it sits flush with it instead of reserving the
  // segmented row's bottom padding.
  const HEADER_ROW_CLASS = 'sticky top-0 z-10 flex w-full flex-wrap items-center justify-between gap-2 bg-transparent'
  const headerRowClass = $derived(`${HEADER_ROW_CLASS} ${isUnderline ? 'items-end border-b border-slate-800 mb-3' : 'pb-3'} ${className}`)

  const NAV_CLASS =
    'inline-flex rounded-[var(--tabs-nav-radius)] border border-slate-700 bg-slate-950 p-[var(--tabs-nav-pad)]'
  const UNDERLINE_NAV_CLASS = 'flex min-w-0 flex-1 flex-wrap items-end gap-[var(--tabs-nav-pad)]'

  function tabClass(active: boolean): string {
    const base =
      'text-[length:var(--tabs-font)] font-medium transition outline-none focus-visible:ring-2 motion-reduce:transition-none'
    if (isUnderline) {
      return `${base} inline-flex items-center rounded-t-[var(--tabs-underline-radius)] border-b-2 px-[var(--tabs-pad-x)] py-[var(--tabs-pad-y)] focus-visible:ring-inset focus-visible:ring-cyan-500/45 ${
        active
          ? 'border-cyan-500 text-slate-200 hover:bg-slate-900/60'
          : 'border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-cyan-300 focus-visible:text-cyan-300'
      }`
    }
    return `${base} rounded-[var(--tabs-radius)] px-[var(--tabs-pad-x)] py-[var(--tabs-pad-y)] focus-visible:ring-cyan-500 ${
      active
        ? 'bg-cyan-500 text-onaccent'
        : 'text-slate-300 hover:text-cyan-300 focus-visible:text-cyan-300'
    }`
  }

  // Derived (not a plain const) so locale switches re-resolve the label.
  const resolvedAriaLabel = $derived(ariaLabel ?? i18n.t('tabs.label'))

  let activePath = $state('')

  const activeTab = $derived(tabs.find(tab => tab.path === (pathname ?? activePath)) ?? tabs[0])
</script>

<div class="flex min-h-0 flex-1 flex-col" style={tabsStyle}>
  <div class={headerRowClass}>
    <nav aria-label={resolvedAriaLabel} class={isUnderline ? UNDERLINE_NAV_CLASS : NAV_CLASS}>
      {#each tabs as tab}
        {#if pathname !== undefined}
          <a
            href={tab.path}
            aria-current={tab.path === pathname ? 'page' : undefined}
            onclick={event => {
              if (tab.path === pathname) {
                event.preventDefault()
              }
            }}
            class={tabClass(tab.path === pathname)}>
            {tab.label}
          </a>
        {:else}
          <button
            type="button"
            aria-pressed={tab.path === activeTab?.path}
            onclick={() => (activePath = tab.path)}
            class={tabClass(tab.path === activeTab?.path)}>
            {tab.label}
          </button>
        {/if}
      {/each}
    </nav>
    {#if activeTab?.toolbar}
      <div class="flex items-center gap-2">
        {@render activeTab.toolbar(tabState)}
      </div>
    {/if}
  </div>
  {#if activeTab}
    <div class="flex min-h-0 flex-1 flex-col">
      {@render activeTab.content(tabState)}
    </div>
  {/if}
</div>
