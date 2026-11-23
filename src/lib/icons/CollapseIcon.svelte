<script lang="ts">
  import { resolveIconPx, type IconSizeInput } from './icon-size'

  interface Props {
    className?: string
    size?: IconSizeInput
  }

  // Width/height attributes (not classes) so `size` composes with `className`:
  // explicit size classes in className still win, since CSS beats attributes.
  // The collapse mark: a rounded panel split by a divider, the chevron inside
  // the left pane pointing at the edge the pane collapses toward.
  // `ExpandIcon` is the same panel with the mirrored chevron, so a drawer
  // toggle swaps the pair as its pane closes and opens. The frame's stroke
  // reaches all four edges, and the chevron's ink stays 0.75 units clear of the
  // frame and the divider.

  let { className = '', size = 'md' }: Props = $props()
</script>

<svg
  viewBox="0 0 20 20"
  fill="none"
  stroke="currentColor"
  stroke-width="2.1"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  width={resolveIconPx(size)}
  height={resolveIconPx(size)}
  class={className}>
  <rect x="1.05" y="1.05" width="17.9" height="17.9" rx="3.1" />
  <line x1="9.3" y1="1.05" x2="9.3" y2="18.95" />
  <path d="M 6.45 7.3L 3.9 10L 6.45 12.7" />
</svg>
