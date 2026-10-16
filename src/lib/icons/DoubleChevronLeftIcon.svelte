<script lang="ts">
  import { resolveIconPx, type IconSizeInput } from './icon-size'
  import { CHEVRON_STYLE, type ChevronVariant } from './chevron-stroke'

  interface Props {
    className?: string
    size?: IconSizeInput
    variant?: ChevronVariant
  }

  // Width/height attributes (not classes) so `size` composes with `className`:
  // explicit size classes in className still win, since CSS beats attributes.
  // The double chevrons are the single chevron repeated along its axis, sharing
  // the set's lighter `regular` stroke and scaled as a pair so the ink fills the
  // box on the stacking axis; `variant` picks the treatment — regular by
  // default, bold a chunky flat-ended, sharp-apex pair whose inset artwork still
  // fits the box.

  let { className = '', size = 'md', variant = 'regular' }: Props = $props()

  const style = $derived(CHEVRON_STYLE[variant])
</script>

<svg
  viewBox="0 0 20 20"
  fill="none"
  stroke="currentColor"
  stroke-width={style.stroke}
  stroke-linecap={style.linecap}
  stroke-linejoin={style.linejoin}
  aria-hidden="true"
  width={resolveIconPx(size)}
  height={resolveIconPx(size)}
  class={className}>
  {#if variant === 'regular'}
    <path d="M 8 3.4L 1.4 10L 8 16.6M 18.6 3.4L 12 10L 18.6 16.6" />
  {:else}
    <path d="M 9.08 4.1L 3.18 10L 9.08 15.9M 18.38 4.1L 12.48 10L 18.38 15.9" />
  {/if}
</svg>
