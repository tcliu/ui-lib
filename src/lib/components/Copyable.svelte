<script lang="ts">
  import type { Snippet } from 'svelte'
  import CopyButton from '$lib/components/CopyButton.svelte'
  import type { SizeInput } from '$lib/size-scale'

  interface Props {
    text?: string
    textClass?: string
    containerClass?: string
    ariaLabel?: string
    tooltip?: string
    copyPosition?: 'inline' | 'top-right'
    children?: Snippet
    size?: SizeInput
  }

  let {
    text,
    textClass = 'text-slate-400',
    containerClass = '',
    ariaLabel,
    tooltip,
    copyPosition = 'inline',
    children,
    size = 'md',
  }: Props = $props()

  // hide copy button when there's nothing to copy (empty or whitespace)
  function hasCopyText() {
    return (text ?? '').toString().trim().length > 0
  }
</script>

{#if copyPosition === 'top-right'}
  <!-- Top-right mode: the copy button sits to the right of the wrapped content
       on the same row as its first line. -->
  <div class={`group flex items-start gap-1 ${containerClass}`}>
    <div class="min-w-0 flex-1">
      {#if children}
        {@render children()}
      {:else}
        <span class={`${textClass} block`}>{text}</span>
      {/if}
    </div>
    {#if hasCopyText()}
      <span class="mt-1.5 mr-1.5">
        <CopyButton text={text ?? ''} {ariaLabel} {tooltip} size={size} />
      </span>
    {/if}
  </div>
{:else}
  <div class={`group flex min-w-0 flex-1 items-center gap-1 ${containerClass}`}>
    <span class={`${textClass} min-w-0 truncate`}>
      {#if children}
        {@render children()}
      {:else}
        {text}
      {/if}
    </span>
    {#if hasCopyText()}
      <CopyButton text={text ?? ''} {ariaLabel} {tooltip} size={size} />
    {/if}
  </div>
{/if}
