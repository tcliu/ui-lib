<script lang="ts">
  import StructureTree from '../StructureTree.svelte'
  import type { SizeInput } from '$lib/size-scale'

  interface Props {
    value: unknown
    onChange?: (path: string[], newValue: unknown) => void
    onRenameKey?: (parentPath: string[], oldKey: string, newKey: string) => void
    editable?: boolean
    containerRowClass?: string
    leafRowClass?: string
    size?: SizeInput
  }

  let { value, onChange, onRenameKey, editable = true, containerRowClass, leafRowClass, size }: Props = $props()
</script>

<StructureTree {value} {onChange} {onRenameKey} {editable} {containerRowClass} {leafRowClass} {size} />
