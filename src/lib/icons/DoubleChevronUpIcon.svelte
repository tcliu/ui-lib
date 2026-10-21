<script lang="ts">
  import { resolveIconPx, type IconSizeInput } from './icon-size'
  import { DOUBLE_CHEVRON_STYLE, type DoubleChevronVariant } from './icon-variants'

  interface Props {
    className?: string
    size?: IconSizeInput
    variant?: DoubleChevronVariant
  }

  // Width/height attributes (not classes) so `size` composes with `className`:
  // explicit size classes in className still win, since CSS beats attributes.
  // The double chevrons are the single chevron repeated along its axis, sharing
  // the set's lighter `regular` stroke and scaled as a pair so the ink fills the
  // box on the stacking axis; `variant` picks the treatment — regular by
  // default, bold a chunky flat-ended, sharp-apex pair whose inset artwork still
  // fits the box, heavy the full-extent pair whose two chevrons close up.

  let { className = '', size = 'md', variant = 'regular' }: Props = $props()

  const style = $derived(DOUBLE_CHEVRON_STYLE[variant])
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
    <path d="M 3.4 8L 10 1.4L 16.6 8M 3.4 18.6L 10 12L 16.6 18.6" />
  {:else if variant === 'bold'}
    <path d="M 4.1 9.08L 10 3.18L 15.9 9.08M 4.1 18.38L 10 12.48L 15.9 18.38" />
  {:else}
    <path d="M 18.33 10L 10 2.59L 1.67 10M 18.33 17.41L 10 10L 1.67 17.41" />
  {/if}
</svg>
