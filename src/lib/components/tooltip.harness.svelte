<script lang="ts">
  import Tooltip from './Tooltip.svelte'
  import type { SizeInput } from '#lib/size-scale.js'

  interface Props {
    mode?: 'explicit' | 'anchor'
    size?: SizeInput
  }

  let { mode = 'explicit', size = 'md' }: Props = $props()
  let buttonEl = $state<HTMLButtonElement | null>(null)
</script>

{#if mode === 'explicit'}
  <button bind:this={buttonEl}>Target</button>
  <Tooltip trigger={buttonEl} {size}>tip-text</Tooltip>
{:else}
  <div id="anchor-parent"><Tooltip {size}>tip-text</Tooltip></div>
{/if}
