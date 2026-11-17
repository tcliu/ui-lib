<script lang="ts">
  import DataTable, { type DataTableColumn } from './DataTable.svelte'
  import { createTableModel, type TableModel } from './use-table-model.svelte'
  import { untrack } from 'svelte'

  interface DemoRow {
    id: number
    name: string
    amount: number
  }

  interface Props {
    rows: DemoRow[]
    rowId: (row: DemoRow) => string
    columns: DataTableColumn<DemoRow>[]
    pageSize?: number
    withToolbar?: boolean
    onready?: (model: TableModel<DemoRow>) => void
  }

  let { rows, rowId, columns, pageSize = 2, withToolbar = false, onready }: Props = $props()

  const model = createTableModel({
    rows: () => rows,
    rowId: row => rowId(row),
    columns: () => columns,
    pageSize: untrack(() => pageSize),
  })

  untrack(() => onready?.(model))
</script>

{#if withToolbar}
  <DataTable {columns} {model} selectable>
    {#snippet toolbar(selected, clear)}
      <button type="button" data-test="batch" onclick={clear}>Batch {selected.length}</button>
    {/snippet}
  </DataTable>
{:else}
  <DataTable {columns} {model} selectable />
{/if}
