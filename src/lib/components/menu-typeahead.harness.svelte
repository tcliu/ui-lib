<script lang="ts">
  import Menu from './Menu.svelte'

  interface Item {
    id: string
    label: string
    disabled?: boolean
  }

  let {
    items,
    onSelect,
    searchable = true,
  }: {
    items: Item[]
    onSelect: (index: number) => void
    searchable?: boolean
  } = $props()

  const itemLabel = $derived(searchable ? (entry: Item) => entry.label : undefined)
</script>

<Menu
  {items}
  itemKey={entry => entry.id}
  {onSelect}
  ariaLabel="Actions"
  {itemLabel}
  itemDisabled={entry => entry.disabled ?? false}>
  {#snippet icon()}
    <span>menu</span>
  {/snippet}
  {#snippet item(entry)}
    <span>{entry.label}</span>
  {/snippet}
</Menu>
