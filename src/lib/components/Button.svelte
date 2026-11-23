<script module lang="ts">
  import { ICON_RATIO, type SizeInput } from '#lib/size-scale.js'
  import { FIELD_RATIOS, INPUT_RATIOS } from './input-chrome'
  import { dimensionMetrics, iconPadRatio } from './size-metrics'

  // A button and a text field are the same size step, so they share the same
  // text metrics: the field's font ratio, radius, line box, and vertical
  // padding. A labelled button therefore matches a field's label size and its
  // outer box at every step, and a filled, borderless variant carries a
  // transparent 1px border so that box includes the field's frame too. Only the
  // horizontal padding stays the button's own — a field reserves a wider inset.
  //
  // The glyph is deliberately not tied to the label's font ratio: it renders at
  // the shared icon ratio, its own optical size, matching every other icon at
  // the same step (the label is 14px at `md`, the glyph 13px). The icon slot is
  // the size dimension itself (ratio 1), and `iconPad` is derived so an
  // icon-only button's box (`icon + 2·iconPad`) equals a text button's
  // (`line + 2·padY`), so the glyph reads as a square at the text row height
  // instead of a shorter box — see `iconPadRatio`. Font weight is an emphasis
  // tier, not a length.
  //
  // The icon slot and the label share one center: the row's `items-center`
  // centers the slot and the label's line box together, and no per-part
  // translate sits between them, so the glyph and the text never read on two
  // axes. A per-part optical shift would also break the label's parity with a
  // text field beside it, whose own text is centered the same way.
  export const BUTTON_RATIOS = {
    font: FIELD_RATIOS.font,
    line: INPUT_RATIOS.line,
    radius: FIELD_RATIOS.radius,
    padX: 0.65,
    padY: FIELD_RATIOS.padY,
    // The icon→label gap: the original 8px at `md`, kept as one ratio so a
    // compact button never carries a gap wider than its own padding.
    gap: 0.5,
    icon: 1,
  }
  // An icon-only button has no label sharing the slot, so its glyph renders 15%
// larger than a labelled button's while the slot (and so the button box) stays
// unchanged: the glyph reads as the control, not as an adornment.
const BUTTON_ICON_ONLY_GLYPH = ICON_RATIO * 1.15
export const BUTTON_METRICS = {
  ...BUTTON_RATIOS,
  iconPad: iconPadRatio(BUTTON_RATIOS),
  glyph: ICON_RATIO,
  iconOnlyGlyph: BUTTON_ICON_ONLY_GLYPH,
}

  // A paddingless icon-only button floors its box at the text row height
  // (`min-w`/`min-h` take `--btn-line`), so it renders wider than its icon slot.
  // A consumer reserving room beside the glyph — the field table's eye toggle —
  // derives that box from here instead of assuming the slot, so a row-height
  // retune cannot leave it overlapping the glyph.
  export function iconOnlyBoxPx(size: SizeInput): number {
    const metrics = dimensionMetrics(size, BUTTON_RATIOS)
    return Math.max(metrics.icon, metrics.line)
  }
</script>

<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte'
  import Tooltip from './Tooltip.svelte'
  import { sizeVarStyle } from './size-metrics'

  interface Props {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
    accent?: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'
    size?: SizeInput
    disabled?: boolean
    pending?: boolean
    type?: 'button' | 'submit' | 'reset'
    // Associates the button with a form it is not nested in (e.g. a dialog
    // footer outside the scrolling body), so submit/Enter keep native semantics.
    form?: string
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
    ariaHaspopup?: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | boolean
    ariaControls?: string
    tooltip?: string
    tooltipAlign?: ComponentProps<typeof Tooltip>['align']
    icon?: Snippet
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
    form,
    className = '',
    onClick,
    onKeyDown,
    preventFocusSteal = false,
    focusRing = true,
    ariaLabel,
    ariaPressed,
    ariaExpanded,
    ariaHaspopup,
    ariaControls,
    tooltip,
    tooltipAlign = 'center',
    icon,
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

  const metrics = $derived({ ...dimensionMetrics(size, BUTTON_METRICS) })
  const boxStyle = $derived(sizeVarStyle('btn', metrics))

  const disabledState = $derived(disabled || pending)

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
    // inset (a constant per shape, not per size). Ghost drops padding only, so
    // the icon-only box floors at the text line height: the bordered padding
    // already fills the row, while a paddingless ghost glyph still matches it.
    const shape = isIconOnly
      ? `${BOX_BASE} min-h-[var(--btn-line)] min-w-[var(--btn-line)] rounded-[var(--btn-radius)] max-phone:min-h-11 max-phone:min-w-11 before:absolute before:-inset-2 before:content-['']`
      : `${BOX_BASE} text-[length:var(--btn-font)] leading-[var(--btn-line)] rounded-[var(--btn-radius)] before:absolute before:-inset-1.5 before:content-['']`
    const pad =
      variant === 'ghost' ? '' : isIconOnly ? 'p-[var(--btn-icon-pad)]' : 'py-[var(--btn-pad-y)] px-[var(--btn-pad-x)]'
    const common = `${shape} ${pad}`.trim()
    // A borderless fill still carries the field's 1px frame as a transparent
    // border, so its outer box matches a bordered variant (and a text field)
    // instead of landing 2px shorter beside them. Ghost is the lone exception:
    // it is a bare inline affordance whose box is its line, not a control box.
    const FRAME = 'border border-transparent'
    // Primary carries semibold emphasis, so dialog confirms read bold.
    if (variant === 'primary') {
      return `${common} ${FRAME} font-semibold ${primaryClasses[accent]} ${ringClass}`
    }
    if (variant === 'danger') {
      return `${common} ${FRAME} bg-rose-500 text-onaccent hover:bg-rose-400 focus:bg-rose-400 ${ringClass}`
    }
    // Outline carries the same semibold emphasis as primary, so dialog
    // Cancel/Reset buttons read bold like their confirms.
    if (variant === 'outline') {
      return `${common} font-semibold ${outlineClasses[accent]} ${ringClass}`
    }
    if (variant === 'ghost') {
      return `${common} text-slate-400 hover:text-cyan-300 focus:text-cyan-300 ${ringClass}`
    }
    // Secondary keeps its original light-blue highlight: the border and label
    // shift to cyan on hover/focus, matching the bordered dropdown surfaces.
    return `${common} border border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-500 hover:text-cyan-300 focus:border-cyan-500 focus:text-cyan-300 focus-visible:border-transparent ${ringClass}`
  })

  const iconBoxClass = 'h-[var(--btn-icon)] w-[var(--btn-icon)]'
  // The slot is the size dimension, but the glyph inside renders at the shared
  // icon ratio so a button icon matches an icon anywhere else at that size. An
  // icon-only button has no label in the slot, so its glyph takes the larger
  // icon-only share while the slot and the button box stay the same.
  const iconGlyphClass = $derived(
    isIconOnly
      ? '[&_svg]:h-[var(--btn-icon-only-glyph)] [&_svg]:w-[var(--btn-icon-only-glyph)]'
      : '[&_svg]:h-[var(--btn-glyph)] [&_svg]:w-[var(--btn-glyph)]',
  )

  function handlePreventFocusSteal(event: PointerEvent) {
    event.preventDefault()
  }

  let triggerEl = $state<HTMLElement | null>(null)
</script>

{#snippet buttonInner()}
  {#if icon && children}
    <span class="inline-flex items-center gap-[var(--btn-gap)]">
      <span class={`inline-flex items-center justify-center ${iconBoxClass} ${iconGlyphClass}`}>{@render icon()}</span>
      {@render children()}
    </span>
  {:else if icon}
    <span class={`inline-flex items-center justify-center ${iconBoxClass} ${iconGlyphClass}`}>{@render icon()}</span>
  {:else if children}
    {@render children()}
  {/if}
{/snippet}

{#snippet buttonElement()}
  <!-- `tooltip` wraps the button with the positioned Tooltip component. The
    wrapper span owns the trigger, so the tip also works when the button is
    disabled (a disabled button fires no mouse events). -->
  <button
    bind:this={buttonEl}
    {type}
    {form}
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    aria-expanded={ariaExpanded}
    aria-haspopup={ariaHaspopup}
    aria-controls={ariaControls}
    aria-busy={pending || undefined}
    onclick={onClick}
    onkeydown={onKeyDown}
    onpointerdown={preventFocusSteal ? handlePreventFocusSteal : undefined}
    disabled={disabledState}
    style={boxStyle}
    class={`${baseClass} ${className}`}>
    {@render buttonInner()}
  </button>
{/snippet}

{#if tooltip}
  <span bind:this={triggerEl} class="group relative inline-flex">
    {@render buttonElement()}
    <Tooltip align={tooltipAlign} trigger={triggerEl} {size}>{tooltip}</Tooltip>
  </span>
{:else}
  {@render buttonElement()}
{/if}
