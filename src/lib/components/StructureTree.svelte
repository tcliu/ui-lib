<script lang="ts">
  import StructureNode from './StructureNode.svelte'
  import { containerSummary, isContainer, valueClass, valueText } from './structure-value'
  import { getI18nContext } from '$lib/i18n.svelte'
  const i18n = getI18nContext()

  interface Props {
    value: unknown
    onChange?: (path: string[], newValue: unknown) => void
    onRenameKey?: (parentPath: string[], oldKey: string, newKey: string) => void
    editable?: boolean
    /** Replaces the tunable container header row classes (gaps, padding, highlight). */
    containerRowClass?: string
    /** Replaces the tunable leaf row classes (gaps, padding, highlight). */
    leafRowClass?: string
  }

  let { value, onChange, onRenameKey, editable = true, containerRowClass, leafRowClass }: Props = $props()

  function containerLabel(value: unknown): string {
    return Array.isArray(value)
      ? `array[${value.length}]`
      : `object{${Object.keys(value as Record<string, unknown>).length}}`
  }
</script>

<div class="text-slate-300">
  {#if value === undefined}
    <div class="text-sm italic text-slate-400">{i18n.t('structure.noContent')}</div>
  {:else if !isContainer(value)}
    <pre class={valueClass(value)}>{valueText(value)}</pre>
  {:else}
    <StructureNode
      label={containerSummary(value)}
      {value}
      depth={0}
      {onChange}
      {onRenameKey}
      {editable}
      {containerRowClass}
      {leafRowClass} />
  {/if}
</div>
