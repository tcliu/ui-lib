<script module lang="ts">
  import { TEXT_INPUT_RATIOS } from './text-input-metrics'

  // The textarea's ratio set: the shared text-field metrics plus the clear
  // affordance's, since a textarea renders the same clear cross and the same
  // outside row when `clearPlacement` is `outside`. One set keeps the editor,
  // its cross, and that row scaling together.
  export const TEXT_AREA_RATIOS = { ...TEXT_INPUT_RATIOS }

  export type TextAreaRatios = typeof TEXT_AREA_RATIOS
  export type TextAreaRatioOverrides = Partial<TextAreaRatios>
</script>

<script lang="ts">
  import type { SizeInput } from '#lib/size-scale.js'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import CloseIcon from '#lib/icons/CloseIcon.svelte'
  import Button from './Button.svelte'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import {
    INPUT_CHROME,
    INPUT_CHROME_NO_OUTLINE,
    INPUT_EMBEDDED,
    INPUT_METRIC_CLASS,
  } from './input-chrome'
  import { resolveClearMetrics, withLine } from './text-input-metrics'
  import type { ClearableProps } from './clearable-props'

  interface Props extends ClearableProps {
    value: string
    // Baseline the clear affordance compares against (empty when unset): the
    // cross hides while `value` matches it, and the fallback clear writes it
    // back. A provided `onClear` still owns the clear.
    defaultValue?: string
    ariaLabel: string
    placeholder?: string
    size?: SizeInput
    // Partial override of the editor's tunable ratios (font, radius, paddings,
    // and the clear cross's button, gutter, and slot); omitted keys keep the
    // shared defaults. The line box is not an override: it follows `font`, so a
    // font change carries the row height, and the clear inset follows `padX`.
    ratios?: TextAreaRatioOverrides
    disabled?: boolean
    readonly?: boolean
    id?: string
    rows?: number
    inputRef?: HTMLTextAreaElement | null
    // Replaces the whole textarea class string (the override owns the metrics).
    inputClass?: string
    // Chrome variant: `bordered` (default) is the shared chrome; `embedded` is
    // the chrome-less base for a textarea inside another surface (the container
    // owns the border, the background, and the focus ring). The caller supplies
    // the text rules through `className`, like the shared `TextInput`.
    variant?: 'bordered' | 'embedded'
    // Extra classes appended after the base: for an embedded field, the text
    // rules and metrics it owns.
    className?: string
    // Drop the bordered chrome's outline (border and focus border) while
    // keeping its surface, metrics, and text rules.
    hideOutline?: boolean
    oninput?: (event: Event) => void
    onkeydown?: (event: KeyboardEvent) => void
    onfocus?: (event: FocusEvent) => void
    onblur?: (event: FocusEvent) => void
    // No trailing adornment owns the right edge, so `clearPlacement` `auto`
    // overlays the editor's first line; an explicit `outside` sits after it.
  }

  let {
    value = $bindable(),
    defaultValue,
    ariaLabel,
    placeholder,
    size = 'md',
    ratios,
    disabled = false,
    readonly = false,
    id,
    rows = 3,
    inputRef = $bindable(null),
    inputClass,
    variant = 'bordered',
    className = '',
    hideOutline = false,
    oninput,
    onkeydown,
    onfocus,
    onblur,
    clearable = false,
    clearLabel,
    clearPlacement = 'auto',
    onClear,
  }: Props = $props()
  const i18n = getI18nContext()

  const resolvedRatios = $derived({ ...TEXT_AREA_RATIOS, ...ratios })
  // The editor's line box follows its font through the shared helper, so a font
  // retune carries its row height.
  const metrics = $derived(dimensionMetrics(size, withLine(resolvedRatios)))
  const style = $derived(sizeVarStyle('input', metrics))

  // The clear affordance rides the shared text-field clear design: the same
  // trimmed button, reserved slot, gutter, and padX-derived inset.
  const clearMetrics = $derived(resolveClearMetrics(size, resolvedRatios.padX, resolvedRatios))
  const clearStyle = $derived(sizeVarStyle('clear', clearMetrics))

  // A disabled or read-only editor offers no clear action, and while `value`
  // matches `defaultValue` (empty when unset) there is nothing to clear.
  const showClear = $derived(
    clearable && (value ?? '') !== (defaultValue ?? '') && !disabled && !readonly,
  )
  const resolvedClearLabel = $derived(clearLabel ?? i18n.t('common.clear'))
  const placement = $derived(clearPlacement === 'auto' ? 'inside' : clearPlacement)
  // The container that hosts the clear button is chosen from `clearable`, not
  // from whether a value is present, so clearing never recreates the textarea
  // (which would drop focus) — only the button itself toggles.
  const insideField = $derived(clearable && placement === 'inside')
  const outsideField = $derived(clearable && placement === 'outside')
  const clearInside = $derived(showClear && insideField)
  const clearOutside = $derived(showClear && outsideField)

  // The gutter is reserved whenever the inside clear is configured, not only
  // while a value shows the button, so the text keeps the same width empty and
  // filled.
  const resolvedStyle = $derived(
    [style, insideField ? 'padding-right:var(--clear-gutter)' : ''].filter(Boolean).join(';'),
  )

  // The cross anchors to the first line (not the editor's height), so resizing
  // the textarea never moves it; the line box is the shared metric's height.
  const clearLineHeight = 'var(--input-line)'
  // The frame carries the editor's metrics (the cross's first-line offset and
  // height resolve from them) plus the clear metrics the gutter and button need.
  const frameStyle = $derived([style, clearStyle].filter(Boolean).join(';'))

  // The outside row's gap between the editor and the clear slot; the row also
  // carries the field and clear vars the slot's offset resolves from.
  const rowMetrics = $derived(dimensionMetrics(size, { gap: resolvedRatios.trailerGap }))
  const outsideRowStyle = $derived(
    [`gap:${rowMetrics.gap}px`, style, clearStyle].filter(Boolean).join(';'),
  )

  // Non-positive or fractional rows fall back to the default; only the page
  // validates strictly (invalid input renders the component default there).
  const safeRows = $derived(Number.isInteger(rows) && rows > 0 ? rows : 3)

  // Fills the container height by default (like the code editors); an
  // `inputClass` override owns the metrics and drops the fill. The embedded
  // variant drops the border, surface, and focus color together, like the
  // shared text-field chrome.
  const baseClass = $derived(
    variant === 'embedded'
      ? `${INPUT_EMBEDDED} h-full resize-y`
      : `${hideOutline ? INPUT_CHROME_NO_OUTLINE : INPUT_CHROME} h-full resize-y ${INPUT_METRIC_CLASS}`,
  )
  const resolvedClass = $derived(`${inputClass ?? baseClass}${className ? ` ${className}` : ''}`)

  // A provided handler owns the clear; otherwise the value resets to the
  // default. Focus returns to the editor either way, so the control stays
  // reachable after the cross disappears with it.
  function handleClear() {
    if (onClear) {
      onClear()
    } else {
      value = defaultValue ?? ''
    }
    inputRef?.focus()
  }
</script>

{#snippet control()}
  <textarea
    bind:this={inputRef}
    {id}
    bind:value
    rows={safeRows}
    {placeholder}
    {disabled}
    {readonly}
    aria-label={ariaLabel}
    {oninput}
    {onkeydown}
    {onfocus}
    {onblur}
    class={resolvedClass}
    style={resolvedStyle}></textarea>
{/snippet}

{#snippet clearIcon()}
  <CloseIcon />
{/snippet}

{#snippet clearControl()}
  <Button
    variant="ghost"
    size={clearMetrics.button}
    icon={clearIcon}
    ariaLabel={resolvedClearLabel}
    onClick={handleClear}
    className="size-[var(--clear-box)] shrink-0" />
{/snippet}

{#snippet field()}
  {#if insideField}
    <div class="relative flex h-full" style={frameStyle}>
      {@render control()}
      {#if clearInside}
        <!-- Overlays the editor's own right edge on its first line (not its
          height) so resizing never moves it; the reserved gutter keeps the text
          clear of it. -->
        <span
          class="absolute right-[var(--clear-inset)] flex items-center"
          style={`top:calc(var(--input-pad-y) + 1px);height:${clearLineHeight}`}>
          {@render clearControl()}
        </span>
      {/if}
    </div>
  {:else}
    {@render control()}
  {/if}
{/snippet}

{#if outsideField}
  <!-- The editor owns its content, so the clear sits after it as a sibling,
    anchored to the first line. Only the button toggles with the value, but its
    slot is reserved even while empty (an inert spacer the size of the cross) so
    the editor keeps the same width empty and filled. -->
  <div class="flex h-full items-start" style={outsideRowStyle}>
    <div class="h-full min-w-0 flex-1">{@render field()}</div>
    {#if clearOutside}
      <span
        class="inline-flex items-center"
        style={`margin-top:calc(var(--input-pad-y) + 1px);height:${clearLineHeight}`}>
        {@render clearControl()}
      </span>
    {:else}
      <span
        aria-hidden="true"
        class="h-[var(--clear-box)] w-[var(--clear-box)] shrink-0 max-phone:h-11 max-phone:w-11"
        style="margin-top:calc(var(--input-pad-y) + 1px)"></span>
    {/if}
  </div>
{:else}
  {@render field()}
{/if}

<style>
  /* 16px on touch pointers so iOS Safari does not auto-zoom on focus. Plain
     scoped CSS on purpose: a stacked Tailwind variant inside a class
     expression never reaches the scanner, so it would silently not exist. */
  @media (pointer: coarse) {
    textarea {
      font-size: 1rem;
    }
  }
</style>
