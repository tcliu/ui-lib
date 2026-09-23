<script lang="ts">
  import type { Snippet } from 'svelte'
  import Splitter from '$lib/components/Splitter.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import {
    STAGE_HANDLE_LINE,
    STAGE_PANE,
    STAGE_RESIZE_MAX,
    STAGE_RESIZE_MIN,
    STAGE_ROW,
  } from '$lib/showcase/resizable-stage'

  interface Props {
    // Width as a percentage of the stage row; the Splitter drags this down.
    value: number
    onChange: (value: number) => void
    // The demo's own sizing (height, etc.); the stage owns the width.
    paneClass?: string
    resizeLabel?: string
    children: Snippet
  }

  let { value, onChange, paneClass = '', resizeLabel = undefined, children }: Props = $props()

  const i18n = getI18nContext()
  const resolvedResizeLabel = $derived(resizeLabel ?? i18n.t('showcase.resizeDemo'))
</script>

<!-- Resizable demo stage: the demo fills the row by default and the handle on
  its right edge drags the width down, so a narrow-container layout can be
  inspected without resizing the window. -->
<div class={STAGE_ROW}>
  <div class={`${STAGE_PANE} ${paneClass}`} style={`flex-basis:${value}%`}>
    {@render children()}
  </div>
  <Splitter
    orientation="vertical"
    unit="%"
    {value}
    min={STAGE_RESIZE_MIN}
    max={STAGE_RESIZE_MAX}
    {onChange}
    ariaLabel={resolvedResizeLabel}
    lineClass={STAGE_HANDLE_LINE} />
</div>
