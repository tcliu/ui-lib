<script module lang="ts">
  import { TEXT_INPUT_RATIOS } from './text-input-metrics'

  // The field's ratios plus the leading search icon's own metrics, so one
  // partial object tunes the whole control. The text gutter derives from them.
  export const SEARCH_INPUT_RATIOS = {
    ...TEXT_INPUT_RATIOS,
    iconLeft: 0.6,
    icon: 0.9,
    iconGap: 0.3,
  }
  export type SearchInputRatios = typeof SEARCH_INPUT_RATIOS
  export type SearchInputRatioOverrides = Partial<SearchInputRatios>
</script>

<script lang="ts">
  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import TextInput from './TextInput.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import type { SizeInput } from '$lib/size-scale'
  import { fieldOverrides, type TextInputRatioOverrides } from './text-input-metrics'
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
    // Partial override of the field and search-icon metric ratios; omitted keys
    // keep the shared defaults.
    ratios?: SearchInputRatioOverrides
    wrapperClass?: string
    inputClass?: string
    // Forwarded to TextInput: drop the field's border and focus border while
    // keeping its surface, metrics, and text rules.
    hideOutline?: boolean
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
    ratios,
    wrapperClass = '',
    inputClass,
    hideOutline = false,
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

  const resolvedRatios = $derived({ ...SEARCH_INPUT_RATIOS, ...ratios })
  // The icon's leading inset and slot are fixed ratios of the size dimension;
  // the text gutter is derived from them plus a fixed gap, so tuning the glyph
  // carries the text with it instead of letting the label slide under the icon.
  const metrics = $derived(
    dimensionMetrics(size, {
      iconLeft: resolvedRatios.iconLeft,
      icon: resolvedRatios.icon,
      padLeft: resolvedRatios.iconLeft + resolvedRatios.icon + resolvedRatios.iconGap,
    }),
  )
  const style = $derived(sizeVarStyle('search', metrics))
  const fieldRatios: TextInputRatioOverrides = $derived(fieldOverrides(resolvedRatios))

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
    ratios={fieldRatios}
    {inputClass}
    {hideOutline}
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
