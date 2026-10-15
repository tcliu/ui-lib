<script lang="ts">
  import FieldTable, { type FieldConfig } from '../FieldTable.svelte'

  interface Props {
    fields: FieldConfig[]
    override?: boolean
  }

  let { fields, override = false }: Props = $props()
</script>

{#snippet customValue(field: FieldConfig)}
  <span data-override>{field.name}-custom</span>
{/snippet}

<FieldTable {fields} value={override ? customValue : undefined} />
