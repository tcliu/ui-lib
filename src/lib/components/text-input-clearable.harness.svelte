<script lang="ts">
  import TextInput from './TextInput.svelte'

  interface Props {
    value?: string
    clearable?: boolean
    clearPlacement?: 'auto' | 'inside' | 'outside'
    trailing?: boolean
    trailer?: boolean
  }

  let {
    value = 'hi',
    clearable = true,
    clearPlacement = 'auto',
    trailing = true,
    trailer = false,
  }: Props = $props()
</script>

{#snippet adornment()}
  <span data-testid="adornment">USD</span>
{/snippet}

{#snippet trailerContent()}
  <span data-testid="trailer">Edit</span>
{/snippet}

<TextInput
  {value}
  {clearable}
  {clearPlacement}
  trailing={trailing ? adornment : undefined}
  trailer={trailer ? trailerContent : undefined}
  ariaLabel="x" />
