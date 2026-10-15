<script lang="ts">
  import StructureTree from '../StructureTree.svelte'

  interface Props {
    value: unknown
    onChange?: (path: string[], newValue: unknown) => void
    onRenameKey?: (parentPath: string[], oldKey: string, newKey: string) => void
    editable?: boolean
    containerRowClass?: string
    leafRowClass?: string
  }

  let { value, onChange, onRenameKey, editable = true, containerRowClass, leafRowClass }: Props = $props()
</script>

<StructureTree {value} {onChange} {onRenameKey} {editable} {containerRowClass} {leafRowClass} />
