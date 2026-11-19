<script lang="ts">
  import DataGrid from './DataGrid.svelte'
  import type { SizeInput } from '#lib/size-scale.js'

  interface Props {
    size?: SizeInput
    initialColumnWidths?: string[]
  }

  let { size = 'md', initialColumnWidths = ['120', '120'] }: Props = $props()

  let value = $state<string[][]>([
    ['Name', 'Amount'],
    ['alpha', '100'],
  ])
</script>

<DataGrid {value} {size} {initialColumnWidths} onChange={rows => (value = rows)} />
