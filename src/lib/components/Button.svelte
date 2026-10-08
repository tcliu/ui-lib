<script lang="ts">
  import type { Snippet } from 'svelte'
  import Tooltip from './Tooltip.svelte'
  import { tooltip as tooltipAction } from '$lib/actions/tooltip.svelte'
  import type { SizeInput } from '$lib/size-scale'
  import { dimensionMetrics, dimensionWeight, sizeVarStyle } from './size-metrics'

  interface Props {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
    accent?: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'
    size?: SizeInput
    disabled?: boolean
    pending?: boolean
    type?: 'button' | 'submit' | 'reset'
    className?: string
    ariaPressed?: boolean
    onClick?: (event: MouseEvent) => void
    onKeyDown?: (event: KeyboardEvent) => void
    preventFocusSteal?: boolean
    /**
     * Show the keyboard focus ring. Disable only when focus stays visible
     * another way (e.g. the ghost hover tint), so keyboard users still see it.
     */
    focusRing?: boolean
    ariaLabel?: string
    ariaExpanded?: boolean
    dataTip?: string
    tooltip?: string
    tooltipAlign?: 'center' | 'left' | 'right'
    badge?: string | number
    icon?: Snippet
    /** Override the icon box class (defaults to the size's icon box). */
    iconClass?: string
    children?: Snippet
    buttonEl?: HTMLButtonElement | null
  }

  let {
    variant = 'secondary',
    accent = 'cyan',
    size = 'md',
    disabled = false,
    pending = false,
    type = 'button',
    className = '',
    onClick,
    onKeyDown,
    preventFocusSteal = false,
    focusRing = true,
    ariaLabel,
    ariaPressed,
    ariaExpanded,
    dataTip,
    tooltip,
    tooltipAlign = 'center',
    badge,
    icon,
    iconClass,
    children,
    buttonEl = $bindable<HTMLButtonElement | null>(null),
  }: Props = $props()

  const primaryClasses: Record<string, string> = {
    cyan: 'bg-cyan-500 text-onaccent hover:bg-cyan-400 focus:bg-cyan-400',
    emerald: 'bg-emerald-500 text-onaccent hover:bg-emerald-400 focus:bg-emerald-400',
    amber: 'bg-amber-500 text-onaccent hover:bg-amber-400 focus:bg-amber-400',
    violet: 'bg-violet-500 text-onaccent hover:bg-violet-400 focus:bg-violet-400',
    rose: 'bg-rose-500 text-onaccent hover:bg-rose-400 focus:bg-rose-400',
  }

  const ringClasses: Record<string, string> = {
    cyan: 'focus-visible:ring-2 focus-visible:ring-cyan-500',
    emerald: 'focus-visible:ring-2 focus-visible:ring-emerald-500',
    amber: 'focus-visible:ring-2 focus-visible:ring-amber-500',
    violet: 'focus-visible:ring-2 focus-visible:ring-violet-500',
    rose: 'focus-visible:ring-2 focus-visible:ring-rose-500',
  }

  const outlineClasses: Record<string, string> = {
    cyan: 'border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:border-cyan-400 hover:text-cyan-100 focus:border-cyan-400 focus:text-cyan-100 focus-visible:border-transparent',
    emerald:
      'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400 hover:text-emerald-100 focus:border-emerald-400 focus:text-emerald-100 focus-visible:border-transparent',
    amber:
      'border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:border-amber-400 hover:text-amber-100 focus:border-amber-400 focus:text-amber-100 focus-visible:border-transparent',
    violet:
      'border border-violet-500/40 bg-violet-500/10 text-violet-200 hover:border-violet-400 hover:text-violet-100 focus:border-violet-400 focus:text-violet-100 focus-visible:border-transparent',
    rose: 'border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:border-rose-400 hover:text-rose-100 focus:border-rose-400 focus:text-rose-100 focus-visible:border-transparent',
  }

  const badgeClasses: Record<string, string> = {
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
  }

  // Every metric is a fixed ratio of the size dimension, so each keeps a
  // constant metric:dimension ratio across the range; the icon is the dimension
  // itself (ratio 1). Font weight is an emphasis tier, not a length.
  const BUTTON_RATIOS = { font: 0.65, line: 0.93, radius: 0.4, padX: 0.8, padY: 0.5, icon: 1, iconPad: 0.5 }

  const metrics = $derived({ ...dimensionMetrics(size, BUTTON_RATIOS), weight: dimensionWeight(size) })
  const boxStyle = $derived(sizeVarStyle('btn', metrics, ['weight']))

  const disabledState = $derived(disabled || pending)

  // The `data-tip` engine rides the element that receives pointer events: the
  // button normally, or the wrapper span when the button is disabled (a
  // disabled button fires no mouse events). Exactly one element carries the tip.
  const tipOwnedByButton = $derived(!(disabledState && dataTip))

  // Count pill overhanging the button's top-right corner; omit the prop to hide it.
  const hasBadge = $derived(badge !== undefined && badge !== null && badge !== '')

  const isIconOnly = $derived(!!icon && !children)

  // `relative` anchors the `before:` hit-area expansion that brings every size to
  // the 44px touch target: do not remove it. The keyboard focus ring follows the
  // variant's accent; `focusRing={false}` drops it while keeping the focus tints.
  const ringClass = $derived.by(() => {
    if (!focusRing) return ''
    if (variant === 'primary' || variant === 'outline') return ringClasses[accent]
    if (variant === 'danger') return ringClasses.rose
    return ringClasses.cyan
  })

  const BOX_BASE =
    'relative inline-flex items-center justify-center cursor-pointer outline-none transition motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40'

  const baseClass = $derived.by(() => {
    // Shape carries the layout, the interpolated metrics, and the hit-area
    // inset (a constant per shape, not per size). Ghost drops padding only.
    const shape = isIconOnly
      ? `${BOX_BASE} rounded-[var(--btn-radius)] before:absolute before:-inset-2 before:content-['']`
      : `${BOX_BASE} text-[length:var(--btn-font)] leading-[var(--btn-line)] [font-weight:var(--btn-weight)] rounded-[var(--btn-radius)] before:absolute before:-inset-1.5 before:content-['']`
    const pad =
      variant === 'ghost' ? '' : isIconOnly ? 'p-[var(--btn-icon-pad)]' : 'py-[var(--btn-pad-y)] px-[var(--btn-pad-x)]'
    const common = `${shape} ${pad}`.trim()
    if (variant === 'primary') {
      return `${common} ${primaryClasses[accent]} ${ringClass}`
    }
    if (variant === 'danger') {
      return `${common} bg-rose-500 text-onaccent hover:bg-rose-400 focus:bg-rose-400 ${ringClass}`
    }
    if (variant === 'outline') {
      return `${common} ${outlineClasses[accent]} ${ringClass}`
    }
    if (variant === 'ghost') {
      return `${common} text-slate-400 hover:text-cyan-300 focus:text-cyan-300 ${ringClass}`
    }
    return `${common} border border-slate-700 bg-slate-950 hover:border-slate-500 hover:text-slate-100 focus:border-slate-500 focus:text-slate-100 focus-visible:border-transparent ${ringClass}`
  })

  const iconBoxClass = $derived(iconClass ?? 'h-[var(--btn-icon)] w-[var(--btn-icon)]')

  function handlePreventFocusSteal(event: PointerEvent) {
    event.preventDefault()
  }

  let triggerEl = $state<HTMLElement | null>(null)
</script>

{#snippet buttonInner()}
  {#if icon}
    <span class="inline-flex items-center gap-2">
      <span class={`${iconBoxClass} [&_svg]:h-full [&_svg]:w-full`}>{@render icon()}</span>
      {@render children?.()}
    </span>
  {:else}
    {@render children?.()}
  {/if}
{/snippet}

{#snippet buttonElement()}
  <!-- Two tooltip systems, applied independently: `dataTip` renders the
      `data-tip` custom-tooltip attribute, `tooltip` wraps the button with the
      positioned Tooltip component. Existing callers use one or the other. -->
  <button
    bind:this={buttonEl}
    {type}
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    aria-expanded={ariaExpanded}
    use:tooltipAction data-tip={tipOwnedByButton ? dataTip : undefined}
    onclick={onClick}
    onkeydown={onKeyDown}
    onpointerdown={preventFocusSteal ? handlePreventFocusSteal : undefined}
    disabled={disabledState}
    style={boxStyle}
    class={`${baseClass} ${hasBadge ? 'relative' : ''} ${className}`}>
    {@render buttonInner()}
    {#if hasBadge}
      <span
        class={`absolute -top-2 -right-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-onaccent ${badgeClasses[accent]}`}
        >{badge}</span>
    {/if}
  </button>
{/snippet}

{#if tooltip}
  <span bind:this={triggerEl} class="group relative inline-flex">
    {@render buttonElement()}
    <Tooltip align={tooltipAlign} trigger={triggerEl}>{tooltip}</Tooltip>
  </span>
{:else if disabledState && dataTip}
  <!-- Disabled buttons fire no mouse events, so the tip rides on a
    non-disabled wrapper instead; the button's own `data-tip` is gated off. -->
  <span class="inline-flex" use:tooltipAction data-tip={dataTip}>
    {@render buttonElement()}
  </span>
{:else}
  {@render buttonElement()}
{/if}
