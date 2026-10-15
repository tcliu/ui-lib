<script lang="ts">
  import { resolveIconPx, type IconSizeInput } from './icon-size'

  interface Props {
    className?: string
    size?: IconSizeInput
  }

  // Width/height attributes (not classes) so `size` composes with `className`:
  // explicit size classes in className still win, since CSS beats attributes.
  // The viewBox is cropped to the glyph (20x10 with a 1-unit breather), so the
  // height is half the width: a square render would letterbox the padding back
  // and the stacked sort pair would gap again without negative margins.

  let { className = '', size = 'md' }: Props = $props()
</script>

<svg
  viewBox="0 7 20 10"
  fill="currentColor"
  aria-hidden="true"
  width={resolveIconPx(size)}
  height={resolveIconPx(size) / 2}
  class={className}>
  <path d="M10 16 4 8h12l-6 8Z" />
</svg>
