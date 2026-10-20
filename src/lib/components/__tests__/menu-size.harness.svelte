<script lang="ts">
  import Menu from '../Menu.svelte'
  import type { SizeInput } from '$lib/size-scale'

  interface Props {
    size?: SizeInput
  }

  let { size }: Props = $props()

  const items = [{ id: 'one', label: 'One' }]
</script>

<Menu
  {items}
  itemKey={item => item.id}
  onSelect={() => {}}
  ariaLabel="Actions"
  {size}>
  {#snippet icon()}
    <span aria-hidden="true">x</span>
  {/snippet}
  {#snippet item(item)}
    <span>{item.label}</span>
  {/snippet}
</Menu>
