<script lang="ts">
  import { resolveIconPx, type IconSizeInput } from './icon-size'

  interface Props {
    className?: string
    size?: IconSizeInput
  }

  // Width/height attributes (not classes) so `size` composes with `className`:
  // explicit size classes in className still win, since CSS beats attributes.
  // The expand mark: the same rounded panel and divider as `CollapseIcon`, with
  // the chevron inside the left pane pointing into the panel, so a closed
  // drawer's toggle opens it.

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
  <path d="M 3.9 7.3L 6.45 10L 3.9 12.7" />
</svg>
