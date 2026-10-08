<script lang="ts">
  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import type { SizeInput } from '$lib/size-scale'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'

  const i18n = getI18nContext()

  export type SearchInputSize = SizeInput

  interface Props {
    value: string
    ariaLabel: string
    placeholder?: string
    size?: SizeInput
    wrapperClass?: string
    inputClass?: string
    inputRef?: HTMLInputElement | null
    oninput?: (event: Event) => void
    onkeydown?: (event: KeyboardEvent) => void
    onfocus?: (event: FocusEvent) => void
    onblur?: (event: FocusEvent) => void
  }

  let {
    value = $bindable(),
    ariaLabel,
    placeholder,
    size = 'sm',
    wrapperClass = '',
    inputClass,
    inputRef = $bindable(null),
    oninput,
    onkeydown,
    onfocus,
    onblur,
  }: Props = $props()

  // Every metric is a fixed ratio of the size dimension (the icon is the
  // dimension itself), so each keeps a constant metric:dimension ratio across
  // the range.
  const SEARCH_RATIOS = {
    font: 0.8125,
    line: 1.1625,
    radius: 0.375,
    padY: 0.375,
    padRight: 0.5,
    padLeft: 1.75,
    iconLeft: 0.5,
    icon: 1,
  }

  const metrics = $derived(dimensionMetrics(size, SEARCH_RATIOS))
  const style = $derived(sizeVarStyle('search', metrics))

  const CHROME =
    'w-full border border-slate-700 text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none'
  const resolvedClass = $derived(
    inputClass ??
      `${CHROME} bg-slate-900 text-[length:var(--search-font)] leading-[var(--search-line)] rounded-[var(--search-radius)] py-[var(--search-pad-y)] pr-[var(--search-pad-right)] pl-[var(--search-pad-left)]`,
  )

  const resolvedPlaceholder = $derived(placeholder ?? i18n.t('search.placeholder'))
</script>

<div class={wrapperClass}>
  <div class="relative" style={style}>
    <SearchIcon
      size={metrics.icon}
      className="pointer-events-none absolute top-1/2 left-[var(--search-icon-left)] -translate-y-1/2 text-slate-500" />
    <input
      bind:this={inputRef}
      type="search"
      bind:value
      aria-label={ariaLabel}
      placeholder={resolvedPlaceholder}
      {oninput}
      {onkeydown}
      {onfocus}
      {onblur}
      class={resolvedClass} />
  </div>
</div>

<style>
  /* 16px on touch pointers so iOS Safari does not auto-zoom on focus. Plain
     scoped CSS on purpose: a stacked Tailwind variant inside a class
     expression never reaches the scanner, so it would silently not exist. */
  @media (pointer: coarse) {
    input {
      font-size: 1rem;
    }
  }
</style>
