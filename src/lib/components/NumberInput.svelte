<script module lang="ts">
  import { TEXT_INPUT_RATIOS } from './text-input-metrics'

  // The field's ratios plus the stepper column's own metrics, so one partial
  // object tunes the whole control.
  export const NUMBER_INPUT_RATIOS = {
    ...TEXT_INPUT_RATIOS,
    stepperIcon: 0.6,
    stepperGutter: 1.25,
    stepperRadius: 0.375,
    sliderHeight: 0.75,
    sliderGap: 0.25,
  }
  export type NumberInputRatios = typeof NUMBER_INPUT_RATIOS
  export type NumberInputRatioOverrides = Partial<NumberInputRatios>
</script>

<script lang="ts">
  import ChevronUpIcon from '#lib/icons/ChevronUpIcon.svelte'
  import ChevronDownIcon from '#lib/icons/ChevronDownIcon.svelte'
  import TextInput from './TextInput.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import type { SizeInput } from '#lib/size-scale.js'
  import { fieldOverrides, type TextInputRatioOverrides } from './text-input-metrics'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import type { ClearableProps } from './clearable-props'
  const i18n = getI18nContext()

  interface Props extends ClearableProps {
    value: string
    // Baseline the clear affordance compares against; forwarded to TextInput,
    // whose fallback clear writes it back.
    defaultValue?: string
    min?: number
    max?: number
    step?: number
    placeholder?: string
    disabled?: boolean
    className?: string
    // Renders the stepper buttons. Hiding them leaves the box untouched — the
    // bordered field keeps its chrome and metrics — so a stepless field is
    // `showControls={false}` plus whatever outline the caller wants.
    showControls?: boolean
    // Who owns the field's box: `bordered` (default) keeps the shared chrome
    // and metrics regardless of the steppers; `embedded` drops the chrome so
    // the caller's `className` owns the border, background, padding, and text
    // rules (Pagination's page cell).
    variant?: 'bordered' | 'embedded'
    // Forwarded to TextInput: drop the bordered field's border and focus border
    // while keeping its surface, metrics, and text rules.
    hideOutline?: boolean
    // Caret placement on focus and click: the default keeps the browser's caret
    // at the clicked position; this puts it after the last character, for a
    // field whose whole value is replaced by typing (a page jump). A drag-select
    // inside the field collapses to the end, so keep it to a single-token value.
    caretAtEnd?: boolean
    // Inline style forwarded to the native input, for a caller that sizes the
    // field itself (runtime widths must not be utilities).
    inputStyle?: string
    id?: string
    ariaLabel: string
    size?: SizeInput
    // Partial override of the field and stepper metric ratios; omitted keys keep
    // the shared defaults.
    ratios?: NumberInputRatioOverrides
    incrementLabel?: string
    decrementLabel?: string
    // Renders a range slider under the box for scrubbing a long numeric
    // range. The track doubles from the current value on the right, and its
    // bounds stay frozen for the whole interaction so the thumb maps linearly to the
    // value instead of compounding on every input.
    slider?: boolean
    // The steppers own the field's right edge, so `clearPlacement` `auto`
    // renders the clear outside the input (an explicit `inside` sits left of
    // the steppers instead of over them).
    onkeydown?: (event: KeyboardEvent) => void
    oninput?: (event: Event) => void
    onblur?: (event: FocusEvent) => void
  }

  let {
    value = $bindable(),
    defaultValue,
    min,
    max,
    step = 1,
    placeholder,
    disabled = false,
    className = '',
    showControls = true,
    variant = 'bordered',
    hideOutline = false,
    caretAtEnd = false,
    inputStyle,
    id,
    ariaLabel,
    size = 'md',
    ratios,
    incrementLabel,
    decrementLabel,
    slider = false,
    clearable = false,
    clearLabel,
    clearPlacement = 'auto',
    onClear,
    onkeydown,
    oninput,
    onblur,
  }: Props = $props()

  // The input box rides TextInput's shared base metrics; the stepper glyph and
  // the gutter that clears it are the only metrics NumberInput adds. The glyph
  // rides a trimmed share of the slot rather than the whole of it, so the
  // steppers read lighter than the value beside them while still scaling.
  const resolvedRatios = $derived({ ...NUMBER_INPUT_RATIOS, ...ratios })
  const numMetrics = $derived(
    dimensionMetrics(size, {
      icon: resolvedRatios.stepperIcon,
      padRight: resolvedRatios.stepperGutter,
      radius: resolvedRatios.stepperRadius,
      sliderHeight: resolvedRatios.sliderHeight,
      sliderGap: resolvedRatios.sliderGap,
    }),
  )
  const numStyle = $derived(sizeVarStyle('num', numMetrics))
  const fieldRatios: TextInputRatioOverrides = $derived(fieldOverrides(resolvedRatios))

  // A trailing stepper column is overlaid on the input's right gutter, so the
  // box keeps exactly TextInput's height instead of growing to the steppers.
  // The gutter is a standalone literal the scanner can extract: glued to the
  // following interpolation it was never emitted, and the digits rendered
  // under the steppers.
  const STEPPER_GUTTER_CLASS = 'pr-[var(--num-pad-right)]'
  const embedded = $derived(variant === 'embedded')
  const framedClass = $derived(
    [showControls ? STEPPER_GUTTER_CLASS : '', className].filter(Boolean).join(' '),
  )
  // Embedded: the caller owns the whole visual (Pagination sizes it), so the
  // field is embedded in it — no chrome of its own, only the input plumbing and
  // the text rules it owns.
  const bareClass = $derived(
    `flex-1 text-slate-100 transition disabled:opacity-40 motion-reduce:transition-none${className ? ` ${className}` : ''}`,
  )

  // Derived (not plain consts) so locale switches re-resolve the labels.
  const resolvedIncrementLabel = $derived(incrementLabel ?? i18n.t('number.increment'))
  const resolvedDecrementLabel = $derived(decrementLabel ?? i18n.t('number.decrement'))

  // An explicit `inside` clear must sit left of the steppers, not over them.
  // The stepper gutter is published as `--input-clear-offset` for TextInput's
  // clear affordance to consume (TextInput reserves both gutters in the input);
  // `auto` already renders outside while the steppers are present.
  const wrapperStyle = $derived(
    clearable && clearPlacement === 'inside' && showControls ? '--input-clear-offset:var(--num-pad-right)' : undefined,
  )

  let inputEl = $state<HTMLInputElement | null>(null)
  let pointerFocused = false
  let focused = false
  let wheelDelta = 0
  let sliderFrozen = $state<{ min: number; max: number } | null>(null)

  // Wheel deltas arrive as pixels (deltaMode 0), lines (1), or pages (2);
  // normalize the latter two to a pixel-equivalent scale.
  const WHEEL_PIXELS_PER_UNIT = 100
  // Accumulate to a threshold so a trackpad's stream of small deltas steps
  // once per gesture instead of racing through values, while a single mouse
  // notch (100px) steps once.
  const WHEEL_DELTA_THRESHOLD = 50
  // A modifier turns one Arrow or wheel gesture into ten steps and both
  // modifiers into a hundred, so a long range is reachable without repeating
  // it. The nudge is internal: every field steps the same way, and the
  // accelerated value keeps the single step's clamp, snapping, and decimals.
  const STEP_MULTIPLIER = 10
  const MAX_STEP_MULTIPLIER = STEP_MULTIPLIER * 10

  function stepMultiplier(event: { altKey: boolean; shiftKey: boolean }): number {
    if (event.altKey && event.shiftKey) return MAX_STEP_MULTIPLIER
    return event.altKey || event.shiftKey ? STEP_MULTIPLIER : 1
  }

  export function focus() {
    inputEl?.focus()
  }

  function handleFocus(event: FocusEvent) {
    focused = true
    if (caretAtEnd) {
      const input = event.currentTarget as HTMLInputElement
      // Deferred so it lands after the browser's own caret placement on a
      // pointer press while still covering a keyboard focus (no click).
      queueMicrotask(() => {
        if (focused) placeCaretAtEnd(input)
      })
      return
    }
    moveCaretToEndIfKeyboardFocus(event)
  }

  function placeCaretAtEnd(input: HTMLInputElement) {
    const end = input.value.length
    input.setSelectionRange(end, end)
  }

  // A click on an already-focused field fires no focus event, so the caret is
  // placed here too; the click runs after the browser's caret placement, so it
  // wins over the clicked position.
  function handleClick(event: MouseEvent) {
    if (caretAtEnd) placeCaretAtEnd(event.currentTarget as HTMLInputElement)
  }

  function moveCaretToEndIfKeyboardFocus(event: FocusEvent) {
    const input = event.currentTarget as HTMLInputElement
    if (pointerFocused) {
      pointerFocused = false
      return
    }
    queueMicrotask(() => {
      if (!focused) return
      placeCaretAtEnd(input)
    })
  }

  // A caller may show a grouped value (`25,291.00`). `parseFloat` stops at the
  // first comma, so strip grouping separators before reading the number; the
  // field's own text always uses a dot decimal.
  function parseValue(text: string): number {
    return Number.parseFloat(text.replace(/,/g, ''))
  }

  const currentValue = $derived(parseValue(value))
  const isAtMax = $derived(max !== undefined && !Number.isNaN(currentValue) && currentValue >= max)
  const isAtMin = $derived(min !== undefined && !Number.isNaN(currentValue) && currentValue <= min)
  const inputType = $derived(step !== undefined && !Number.isInteger(step) ? 'decimal' : 'numeric')

  function stepDecimals() {
    if (step === undefined) return 0
    const s = String(step)
    if (s.includes('e-')) {
      const parts = s.split('e-')
      return Number(parts[1] ?? 0)
    }
    const dot = s.indexOf('.')
    return dot === -1 ? 0 : s.length - dot - 1
  }

  // Decimal places the field's own text carries, so writing a value back never
  // rounds away digits the entry already shows.
  function textDecimals(text: string): number {
    const dot = text.indexOf('.')
    return dot === -1 ? 0 : text.length - dot - 1
  }

  // A value the field writes keeps `max(step, value)` decimals: the step pads a
  // coarser value (`1` with `0.5` renders `1.0`) and a finer value keeps its
  // digits (`1.25` stepped by `0.5` renders `1.75`) instead of rounding to the
  // step. `toFixed` caps at 100 places.
  function formatValue(num: number, current: string): string {
    const decimals = Math.min(100, Math.max(stepDecimals(), textDecimals(current)))
    return decimals > 0 ? num.toFixed(decimals) : String(num)
  }

  function snapToStep(val: number): number {
    if (step === undefined || min === undefined) return val
    const decimals = stepDecimals()
    const steps = Math.round((val - min) / step)
    const snapped = min + steps * step
    const clampedSnap = max !== undefined ? Math.min(max, Math.max(min, snapped)) : snapped
    return Number(clampedSnap.toFixed(decimals))
  }

  // A typed entry clamps as soon as another digit could not bring it back into
  // range: an entry past the max is stuck once it is non-negative (digits only
  // widen it), and one below the min once it is negative or once the next
  // multiple of ten already overshoots the max. A positive entry under the min
  // may still be the prefix of a valid number (`50` under `min: 10`), so it
  // waits for blur or a step, which keep their own clamps.
  function clampTyped(text: string): string {
    const parsed = Number.parseFloat(text)
    if (Number.isNaN(parsed)) return text
    if (max !== undefined && parsed > max && parsed >= 0) return String(max)
    const stuckBelow = parsed < 0 || (max !== undefined && parsed * 10 > max)
    if (min !== undefined && parsed < min && stuckBelow) return String(min)
    return text
  }

  function handleInput(event: Event) {
    const input = event.target as HTMLInputElement
    let newValue = input.value.replace(/[^0-9.-]/g, '')

    if (min !== undefined && min >= 0) {
      newValue = newValue.replace(/-/g, '')
    }

    const decimalCount = (newValue.match(/\./g) || []).length
    if (decimalCount > 1) {
      newValue = newValue.replace(/\.(?=.*\.)/g, '')
    }

    if (newValue.indexOf('-') > 0) {
      newValue = newValue.replace(/-/g, '')
    }

    newValue = clampTyped(newValue)
    input.value = newValue
    value = newValue
  }

  function handleBlur(event: FocusEvent) {
    focused = false
    wheelDelta = 0
    const input = event.target as HTMLInputElement
    const text = input.value
    const numValue = parseValue(text)
    if (text === '' || Number.isNaN(numValue)) {
      onblur?.(event)
      return
    }
    let clamped = numValue
    if (min !== undefined && clamped < min) {
      clamped = min
    }
    if (max !== undefined && clamped > max) {
      clamped = max
    }
    const next = formatValue(snapToStep(clamped), text)
    if (next !== text) {
      input.value = next
      value = next
    }
    onblur?.(event)
  }

  function adjust(direction: 1 | -1, multiplier = 1) {
    if (disabled) {
      return
    }
    const current = parseValue(value)
    const base = Number.isNaN(current) ? (min ?? 0) : current
    let next = base + direction * step * multiplier
    if (min !== undefined && next < min) {
      next = min
    }
    if (max !== undefined && next > max) {
      next = max
    }
    next = snapToStep(next)
    const nextStr = formatValue(next, value)
    value = nextStr
    if (inputEl) {
      inputEl.value = nextStr
      inputEl.dispatchEvent(new Event('input', { bubbles: true }))
      inputEl.focus()
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    const multiplier = stepMultiplier(event)
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      adjust(1, multiplier)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      adjust(-1, multiplier)
    }
    onkeydown?.(event)
  }

  function handleWheel(event: WheelEvent) {
    if (!focused || disabled) return
    // Pinch-zoom arrives as a ctrl-modified wheel; leave it to the browser.
    if (event.ctrlKey) return
    // Browsers report a shifted wheel as a horizontal delta, so read the axis
    // that actually moved: while the field is focused, Shift accelerates its
    // step instead of scrolling the page sideways.
    const delta = event.deltaY !== 0 ? event.deltaY : event.shiftKey ? event.deltaX : 0
    if (delta === 0) return
    // Own the wheel while focused so the page does not scroll instead of the
    // field stepping.
    event.preventDefault()
    wheelDelta += event.deltaMode === 0 ? delta : delta * WHEEL_PIXELS_PER_UNIT
    if (Math.abs(wheelDelta) < WHEEL_DELTA_THRESHOLD) return
    const direction = wheelDelta < 0 ? 1 : -1
    wheelDelta = 0
    adjust(direction, stepMultiplier(event))
  }

  // Keeps a long range reachable: the track starts at the field's minimum and
  // doubles from the current value on the right. The pair freezes from
  // pointerdown, because recomputing the centred range on every input
  // compounds the change and springs the thumb back to the middle.
  const sliderBounds = $derived.by(() => {
    if (sliderFrozen) return sliderFrozen
    const low = min ?? 0
    const unit = Number.isFinite(step) && step > 0 ? step : 1
    const value = Number.isNaN(currentValue) ? low : currentValue
    const top = low + Math.max(value > low ? (value - low) * 2 : unit * 100, unit)
    return { min: low, max: max === undefined ? top : Math.max(low + unit, Math.min(max, top)) }
  })
  const resolvedSliderLabel = $derived(`${ariaLabel} ${i18n.t('number.slider')}`)

  function freezeSlider() {
    sliderFrozen ??= sliderBounds
  }

  function releaseSlider() {
    sliderFrozen = null
  }

  function handleSliderInput(event: Event) {
    const raw = parseValue((event.target as HTMLInputElement).value)
    if (Number.isNaN(raw)) return
    let next = raw
    if (min !== undefined && next < min) next = min
    if (max !== undefined && next > max) next = max
    const text = formatValue(next, value)
    value = text
    if (inputEl) {
      // Route through the field's own input path so a caller's `oninput` —
      // which reads the text field — sees every slider move.
      inputEl.value = text
      inputEl.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
</script>

{#snippet steppers()}
  <!-- The column paints no border of its own: it only reserves the input's
       border ring with a transparent border and lets the input's border show
       through, so its focus/disabled color always tracks the field's. -->
  <div
    class="absolute inset-y-0 right-0 flex w-[var(--num-pad-right)] flex-col overflow-hidden rounded-r-[var(--num-radius)] border-y border-r border-transparent">
    <button
      type="button"
      onclick={event => adjust(1, stepMultiplier(event))}
      disabled={disabled || isAtMax}
      tabindex="-1"
      aria-label={resolvedIncrementLabel}
      class="flex flex-1 items-center justify-center border-b border-slate-700 bg-slate-900 text-slate-400 transition outline-none hover:text-cyan-300 focus:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-inset disabled:opacity-40 motion-reduce:transition-none [@media(pointer:coarse)]:min-h-6">
      <ChevronUpIcon size={numMetrics.icon} />
    </button>
    <button
      type="button"
      onclick={event => adjust(-1, stepMultiplier(event))}
      disabled={disabled || isAtMin}
      tabindex="-1"
      aria-label={resolvedDecrementLabel}
      class="flex flex-1 items-center justify-center bg-slate-900 text-slate-400 transition outline-none hover:text-cyan-300 focus:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-inset disabled:opacity-40 motion-reduce:transition-none [@media(pointer:coarse)]:min-h-6">
      <ChevronDownIcon size={numMetrics.icon} />
    </button>
  </div>
{/snippet}

<div onwheel={handleWheel} class="group {embedded ? 'flex flex-none items-stretch' : ''}" style={numStyle}>
  <div class={slider ? 'flex flex-col gap-[var(--num-slider-gap)]' : 'contents'}>
    <TextInput
      bind:inputRef={inputEl}
      {id}
      type="text"
      inputmode={inputType}
      {placeholder}
      {disabled}
      {ariaLabel}
      {size}
      ratios={fieldRatios}
      {inputStyle}
      {hideOutline}
      bind:value
      {defaultValue}
      {variant}
      className={embedded ? bareClass : framedClass}
      trailing={showControls ? steppers : undefined}
      {clearable}
      {clearLabel}
      {clearPlacement}
      {wrapperStyle}
      {onClear}
      onpointerdown={() => {
        pointerFocused = true
      }}
      onpointerup={() => {
        queueMicrotask(() => {
          pointerFocused = false
        })
      }}
      onpointercancel={() => {
        pointerFocused = false
      }}
      onfocus={handleFocus}
      onclick={handleClick}
      oninput={e => {
        handleInput(e)
        oninput?.(e)
      }}
      onblur={handleBlur}
      onkeydown={handleKeydown} />
    {#if slider}
      <input
        type="range"
        aria-label={resolvedSliderLabel}
        min={sliderBounds.min}
        max={sliderBounds.max}
        {step}
        value={Number.isNaN(currentValue) ? sliderBounds.min : currentValue}
        {disabled}
        oninput={handleSliderInput}
        onpointerdown={freezeSlider}
        onfocus={freezeSlider}
        onpointerup={releaseSlider}
        onpointercancel={releaseSlider}
        onchange={releaseSlider}
        onblur={releaseSlider}
        class="block h-[var(--num-slider-height)] w-full cursor-pointer accent-cyan-500 opacity-45 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed" />
    {/if}
  </div>
</div>
