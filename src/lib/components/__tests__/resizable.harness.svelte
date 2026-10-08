<script lang="ts">
  import Resizable from '$lib/components/Resizable.svelte'
  import { createAppI18n, setI18nContext } from '$lib/i18n.svelte'

  // Realistic provider so the handles resolve labels without the fallback warning.
  setI18nContext(createAppI18n())

  interface HarnessProps {
    minWidth?: number
    minHeight?: number
    maxWidth?: number | 'parent'
    maxHeight?: number | 'parent'
    // Width-only mode: omit the height so the frame hugs its content.
    autoHeight?: boolean
    onResize?: (width: number, height: number | undefined) => void
    onResizeEnd?: () => void
  }

  let { minWidth, minHeight, maxWidth, maxHeight, autoHeight, onResize, onResizeEnd }: HarnessProps = $props()

  let width = $state(200)
  let height = $state(150)
</script>

<Resizable
  {width}
  height={autoHeight ? undefined : height}
  onResize={(nextWidth, nextHeight) => {
    width = nextWidth
    if (nextHeight !== undefined) height = nextHeight
    onResize?.(nextWidth, nextHeight)
  }}
  {minWidth}
  {minHeight}
  {maxWidth}
  {maxHeight}
  {onResizeEnd}>
  <div data-testid="resizable-content">content</div>
</Resizable>
