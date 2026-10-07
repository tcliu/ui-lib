<script lang="ts">
  import TagInput from '../TagInput.svelte'

  interface Props {
    value?: string[]
    availableTags?: string[]
    disabled?: boolean
    palette?: readonly string[]
    chipClassFor?: (tag: string) => string
    onQueryChange?: (query: string) => void
    onChange?: (next: string[]) => void
  }

  let {
    value = [],
    availableTags = [],
    disabled = false,
    palette,
    chipClassFor,
    onQueryChange,
    onChange,
  }: Props = $props()
</script>

<TagInput {value} {availableTags} {disabled} {palette} {chipClassFor} {onQueryChange} {onChange} />
