<script lang="ts">
  import Tooltip from '../Tooltip.svelte'

  interface Props {
    mode?: 'explicit' | 'anchor'
  }

  let { mode = 'explicit' }: Props = $props()
  let buttonEl = $state<HTMLButtonElement | null>(null)
</script>

{#if mode === 'explicit'}
  <button bind:this={buttonEl}>Target</button>
  <Tooltip trigger={buttonEl}>tip-text</Tooltip>
{:else}
  <div id="anchor-parent"><Tooltip>tip-text</Tooltip></div>
{/if}
