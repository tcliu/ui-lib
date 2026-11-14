<script lang="ts">
  import TextArea from './TextArea.svelte'
  import type { FieldRatioOverrides } from './input-chrome'

  interface Props {
    value?: string
    ariaLabel?: string
    rows?: number
    disabled?: boolean
    readonly?: boolean
    ratios?: FieldRatioOverrides
    variant?: 'bordered' | 'embedded'
    className?: string
    hideOutline?: boolean
  }

  let {
    value = '',
    ariaLabel = 'Notes',
    rows,
    disabled,
    readonly,
    ratios,
    variant,
    className,
    hideOutline,
  }: Props = $props()
</script>

<TextArea
  bind:value
  {ariaLabel}
  {rows}
  {disabled}
  {readonly}
  {ratios}
  {variant}
  {className}
  {hideOutline}
  placeholder="Write…" />
