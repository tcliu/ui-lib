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

  // A resizable stage carries the width state its handle drags; a static stage
  // omits it and takes its width from `paneClass`. The union makes the width
  // props required exactly when the handle renders.
  interface BaseStageProps {
    // The demo's own sizing (height, etc.); the stage owns the width unless the
    // handle is off.
    paneClass?: string
    resizeLabel?: string
    children: Snippet
  }

  interface ResizableStageProps extends BaseStageProps {
    showHandle?: true
    // Width as a percentage of the stage row; the Splitter drags this down.
    value: number
    onChange: (value: number) => void
  }

  interface StaticStageProps extends BaseStageProps {
    // Renders the pane without the handle, for a demo whose pane owns a bounded
    // height (the DataTable demo); the pane takes its width from `paneClass`.
    showHandle: false
  }

  type Props = ResizableStageProps | StaticStageProps

  let props: Props = $props()

  const i18n = getI18nContext()
  const resolvedResizeLabel = $derived(props.resizeLabel ?? i18n.t('showcase.resizeDemo'))
</script>

<!-- Resizable demo stage: the demo fills the row by default and the handle on
  its right edge drags the width down, so a narrow-container layout can be
  inspected without resizing the window. `showHandle={false}` renders the same
  pane without the handle, for a demo whose pane owns a bounded height. -->
<div class={STAGE_ROW}>
  <div
    class={`${STAGE_PANE} ${props.paneClass ?? ''}`}
    style={props.showHandle === false ? undefined : `flex-basis:${props.value}%`}>
    {@render props.children()}
  </div>
  {#if props.showHandle !== false}
    <Splitter
      orientation="vertical"
      unit="%"
      value={props.value}
      min={STAGE_RESIZE_MIN}
      max={STAGE_RESIZE_MAX}
      onChange={props.onChange}
      ariaLabel={resolvedResizeLabel}
      lineClass={STAGE_HANDLE_LINE} />
  {/if}
</div>
