<script lang="ts">
  import type { SizeInput } from '#lib/size-scale.js'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import {
    FIELD_RATIOS,
    INPUT_CHROME,
    INPUT_CHROME_NO_OUTLINE,
    INPUT_EMBEDDED,
    INPUT_METRIC_CLASS,
    type FieldRatioOverrides,
  } from './input-chrome'
  import { withLine } from './text-input-metrics'

  interface Props {
    value: string
    ariaLabel: string
    placeholder?: string
    size?: SizeInput
    // Partial override of the field's tunable ratios (font, radius, and both
    // paddings); omitted keys keep the shared defaults. The line box is not an
    // override: it follows `font`, so a font change carries the row height.
    ratios?: FieldRatioOverrides
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
  }

  let {
    value = $bindable(),
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
  }: Props = $props()

  const resolvedRatios = $derived({ ...FIELD_RATIOS, ...ratios })
  // The editor's line box follows its font through the shared helper, so a font
  // retune carries its row height.
  const metrics = $derived(dimensionMetrics(size, withLine(resolvedRatios)))
  const style = $derived(sizeVarStyle('input', metrics))

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
</script>

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
  style={style}></textarea>

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
