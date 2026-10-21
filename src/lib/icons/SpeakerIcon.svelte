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

<svg
  viewBox="0 0 20 20"
  fill="currentColor"
  aria-hidden="true"
  width={resolveIconPx(size)}
  height={resolveIconPx(size)}
  class={className}>
  <path
    d="M 10.08 2.66a 0.88 0.88 0 0 0 -1.48 -0.65L 3.86 5.3H 0.88a 0.88 0.88 0 0 0 -0.88 0.88v 7.64c 0 0.49 0.39 0.88 0.88 0.88h 2.98l 4.74 3.29a 0.88 0.88 0 0 0 1.48 -0.65V 2.66Z" />
  <path
    d="M 14.13 6a 0.88 0.88 0 0 0 -1.25 1.25a 4.99 4.99 0 0 1 0 7.06a 0.88 0.88 0 1 0 1.25 1.24a 6.76 6.76 0 0 0 0 -9.55Z" />
  <path
    d="M 17.03 3.88a 0.88 0.88 0 0 0 -1.24 1.24a 7.93 7.93 0 0 1 0 11.22a 0.88 0.88 0 1 0 1.24 1.25a 9.4 9.4 0 0 0 0 -13.71Z" />
</svg>
