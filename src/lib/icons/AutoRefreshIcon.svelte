<script lang="ts">
  import { resolveIconPx, type IconSizeInput } from './icon-size'

  interface Props {
    className?: string
    size?: IconSizeInput
  }

  // Width/height attributes (not classes) so `size` composes with `className`:
  // explicit size classes in className still win, since CSS beats attributes.

  let { className = '', size = 'md' }: Props = $props()
</script>

<!-- Clock plus a partial rotation: "refresh, on a schedule". The ring's
     stroke reaches the box edge, so the glyph fills the grid like every other
     square icon. -->
<svg
  viewBox="0 0 20 20"
  fill="none"
  stroke="currentColor"
  stroke-width="2.16"
  aria-hidden="true"
  width={resolveIconPx(size)}
  height={resolveIconPx(size)}
  class={className}>
  <circle cx="10" cy="10" r="8.92" />
  <path d="M 10 5.16V 10l 3.31 2.04" />
</svg>
