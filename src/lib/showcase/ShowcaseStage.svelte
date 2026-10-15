<script lang="ts">
  import type { Snippet } from 'svelte'
  import { STAGE_PANE, STAGE_ROW } from '$lib/showcase/resizable-stage'

  // A static demo stage: the demo fills a bounded pane whose size comes from
  // `paneClass`. The width-resizable variant had no caller, so the stage is
  // handle-free and owns no width state.
  interface Props {
    paneClass?: string
    children: Snippet
  }

  let { paneClass = '', children }: Props = $props()
</script>

<div class={STAGE_ROW}>
  <div class={`${STAGE_PANE} ${paneClass}`}>
    {@render children()}
  </div>
</div>
