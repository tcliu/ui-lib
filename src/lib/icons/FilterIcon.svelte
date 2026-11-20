<script lang="ts">
  import { resolveIconPx, type IconSizeInput } from './icon-size'
  import { FILTER_VARIANTS, type FilterVariant } from './icon-variants'

  interface Props {
    className?: string
    size?: IconSizeInput
    // `regular` is the solid funnel; `sheets` the spreadsheet app's three-bar
    // funnel, lighter in a dense header row.
    variant?: FilterVariant
  }

  // Width/height attributes (not classes) so `size` composes with `className`:
  // explicit size classes in className still win, since CSS beats attributes.
  let { className = '', size = 'md', variant = FILTER_VARIANTS[0] }: Props = $props()
</script>

<svg
  viewBox="0 0 20 20"
  fill="currentColor"
  aria-hidden="true"
  width={resolveIconPx(size)}
  height={resolveIconPx(size)}
  class={className}>
  {#if variant === 'regular'}
    <path d="M 0 1H 20L 12 10V 15.5L 8 19.5V 10Z" />
  {:else}
    <!-- Three centered bars, each shorter than the one above, the mark a
         spreadsheet's filter column shows at rest. -->
    <path d="M 0 2.5H 20V 6H 0ZM 3.5 8.5H 16.5V 12H 3.5ZM 7 14H 13V 17.5H 7Z" />
  {/if}
</svg>
