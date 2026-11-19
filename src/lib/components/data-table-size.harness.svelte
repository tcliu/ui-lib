<script lang="ts">
  import DataTable, { type DataTableColumn } from './DataTable.svelte'
  import type { SizeInput } from '#lib/size-scale.js'

  interface Row {
    id: number
    name: string
    amount: number
  }

  interface Props {
    size?: SizeInput
    dense?: boolean
    selectable?: boolean
    showSearch?: boolean
  }

  let { size = 'md', dense = false, selectable = false, showSearch = true }: Props = $props()

  const rows: Row[] = [
    { id: 1, name: 'alpha', amount: 100 },
    { id: 2, name: 'beta', amount: 200 },
  ]

  const columns: DataTableColumn<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'amount', header: 'Amount', num: true },
  ]
</script>

<DataTable {rows} {columns} rowId={row => String(row.id)} {size} {dense} {selectable} {showSearch} />
