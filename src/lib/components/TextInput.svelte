<script lang="ts">
  import { resolveSizeStep, type SizeInput } from '$lib/size-scale'

  interface Props {
    value: string
    ariaLabel: string
    placeholder?: string
    size?: SizeInput
    disabled?: boolean
    readonly?: boolean
    id?: string
    inputRef?: HTMLInputElement | null
    // Replaces the whole input class string (see SearchInput's `inputClass`).
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

  // Literal class variants (never interpolated) so the Tailwind scanner emits
  // every size. The full xs–lg scale from the start, like the other sized
  // primitives; a numeric size settles on its nearest step.
  const inputVariants: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
    xs: 'rounded-md bg-slate-900 px-2 py-1 text-xs',
    sm: 'rounded-md bg-slate-900 px-2 py-1.5 text-sm',
    md: 'rounded-lg bg-slate-900 px-3 py-2 text-sm',
    lg: 'rounded-lg bg-slate-900 px-4 py-2.5 text-base',
  }

  const step = $derived(resolveSizeStep(size))

  const resolvedClass = $derived(
    inputClass ??
      `w-full border border-slate-700 text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 disabled:opacity-40 read-only:cursor-default read-only:text-slate-400 motion-reduce:transition-none ${inputVariants[step]}`,
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
  class={resolvedClass} />

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
