<script lang="ts">
  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import TextInput from './TextInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import type { SizeInput } from '$lib/size-scale'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import type { ClearableProps } from './clearable-props'

  const i18n = getI18nContext()

  interface Props extends ClearableProps {
    value: string
    // Baseline the clear affordance compares against; forwarded to TextInput,
    // whose fallback clear writes it back.
    defaultValue?: string
    ariaLabel: string
    placeholder?: string
    size?: SizeInput
    wrapperClass?: string
    inputClass?: string
    inputRef?: HTMLInputElement | null
    // SearchInput owns no trailing adornment, so `clearPlacement` `auto` stays
    // inside.
    oninput?: (event: Event) => void
    onkeydown?: (event: KeyboardEvent) => void
    onfocus?: (event: FocusEvent) => void
    onblur?: (event: FocusEvent) => void
  }

  let {
    value = $bindable(),
    defaultValue,
    ariaLabel,
    placeholder,
    size = 'md',
    wrapperClass = '',
    inputClass,
    inputRef = $bindable(null),
    clearable = false,
    clearLabel,
    clearPlacement = 'auto',
    onClear,
    oninput,
    onkeydown,
    onfocus,
    onblur,
  }: Props = $props()

  // The input box rides TextInput's shared base metrics; the search icon and
  // its gutter are the only metrics this wrapper adds. Every metric is a fixed
  // ratio of the size dimension, so each stays constant across the range.
  const SEARCH_RATIOS = { padLeft: 1.8, iconLeft: 0.6, icon: 0.9 }

  const metrics = $derived(dimensionMetrics(size, SEARCH_RATIOS))
  const style = $derived(sizeVarStyle('search', metrics))

  const resolvedPlaceholder = $derived(placeholder ?? i18n.t('search.placeholder'))
</script>

<div class={wrapperClass}>
  <TextInput
    bind:value
    bind:inputRef
    type="search"
    {ariaLabel}
    placeholder={resolvedPlaceholder}
    {size}
    {inputClass}
    className="pl-[var(--search-pad-left)]"
    wrapperStyle={style}
    {defaultValue}
    {clearable}
    {clearLabel}
    {clearPlacement}
    {onClear}
    {oninput}
    {onkeydown}
    {onfocus}
    {onblur}>
    {#snippet leading()}
      <SearchIcon
        size={metrics.icon}
        className="pointer-events-none absolute top-1/2 left-[var(--search-icon-left)] -translate-y-1/2 text-slate-500" />
    {/snippet}
  </TextInput>
</div>
