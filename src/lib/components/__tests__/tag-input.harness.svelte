<script lang="ts">
  import TagInput from '../TagInput.svelte'
  import type { SizeInput } from '$lib/size-scale'

  interface Props {
    value?: string[]
    options?: string[]
    disabled?: boolean
    size?: SizeInput
    palette?: readonly string[]
    chipClass?: string | ((tag: string) => string)
    chipStyle?: (tag: string) => string | undefined
    optionDotStyle?: (tag: string) => string | undefined
    onQueryChange?: (query: string) => void
    onChange?: (next: string[]) => void
  }

  let {
    value = [],
    options = [],
    disabled = false,
    size = 'md',
    palette,
    chipClass,
    chipStyle,
    optionDotStyle,
    onQueryChange,
    onChange,
  }: Props = $props()
</script>

<TagInput
  {value}
  {options}
  {disabled}
  {size}
  {palette}
  {chipClass}
  {chipStyle}
  {optionDotStyle}
  {onQueryChange}
  {onChange} />
