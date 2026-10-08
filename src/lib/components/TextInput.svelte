<script lang="ts">
  import type { SizeInput } from '$lib/size-scale'
  import { dimensionMetrics, dimensionWeight, sizeVarStyle } from './size-metrics'

  interface Props {
    value: string
    ariaLabel: string
    placeholder?: string
    size?: SizeInput
    disabled?: boolean
    readonly?: boolean
    id?: string
    inputRef?: HTMLInputElement | null
    // Replaces the whole input class string (the override owns the metrics).
    inputClass?: string
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
    disabled = false,
    readonly = false,
    id,
    inputRef = $bindable(null),
    inputClass,
    oninput,
    onkeydown,
    onfocus,
    onblur,
  }: Props = $props()

  // Every metric is a fixed ratio of the size dimension, so each keeps a
  // constant metric:dimension ratio across the whole range.
  const INPUT_RATIOS = { font: 0.8125, line: 1.1625, radius: 0.375, padX: 0.5, padY: 0.375 }

  const metrics = $derived(dimensionMetrics(size, INPUT_RATIOS))
  const style = $derived(sizeVarStyle('input', metrics))

  const CHROME =
    'w-full border border-slate-700 text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 disabled:opacity-40 read-only:cursor-default read-only:text-slate-400 motion-reduce:transition-none'
  const resolvedClass = $derived(
    inputClass ??
      `${CHROME} bg-slate-900 text-[length:var(--input-font)] leading-[var(--input-line)] rounded-[var(--input-radius)] py-[var(--input-pad-y)] px-[var(--input-pad-x)]`,
  )
</script>

<input
  bind:this={inputRef}
  {id}
  type="text"
  bind:value
  {placeholder}
  {disabled}
  {readonly}
  aria-label={ariaLabel}
  {oninput}
  {onkeydown}
  {onfocus}
  {onblur}
  class={resolvedClass}
  style={style} />

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
