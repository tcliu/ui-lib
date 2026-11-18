<script lang="ts">
  import type { SizeInput } from '#lib/size-scale.js'
  import TextArea, { type TextAreaRatioOverrides } from './TextArea.svelte'

  interface Props {
    value?: string
    defaultValue?: string
    ariaLabel?: string
    size?: SizeInput
    rows?: number
    disabled?: boolean
    readonly?: boolean
    ratios?: TextAreaRatioOverrides
    variant?: 'bordered' | 'embedded'
    className?: string
    hideOutline?: boolean
    clearable?: boolean
    clearLabel?: string
    clearPlacement?: 'auto' | 'inside' | 'outside'
    onClear?: () => void
  }

  let {
    value = '',
    defaultValue,
    ariaLabel = 'Notes',
    size,
    rows,
    disabled,
    readonly,
    ratios,
    variant,
    className,
    hideOutline,
    clearable,
    clearLabel,
    clearPlacement,
    onClear,
  }: Props = $props()
</script>

<TextArea
  bind:value
  {defaultValue}
  {ariaLabel}
  {size}
  {rows}
  {disabled}
  {readonly}
  {ratios}
  {variant}
  {className}
  {hideOutline}
  {clearable}
  {clearLabel}
  {clearPlacement}
  {onClear}
  placeholder="Write…" />
