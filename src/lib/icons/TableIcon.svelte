<script lang="ts">
  import { resolveIconPx, type IconSizeInput } from './icon-size'
  import { TABLE_STYLE, type TableVariant } from './icon-variants'

  interface Props {
    className?: string
    size?: IconSizeInput
    variant?: TableVariant
  }

  // Width/height attributes (not classes) so `size` composes with `className`:
  // explicit size classes in className still win, since CSS beats attributes.
  // The table mark: `regular` carries the header and column rules; each insert
  // rendering swaps them for the band boundary and tick of the edge it adds.

  let { className = '', size = 'md', variant = 'regular' }: Props = $props()

  const style = $derived(TABLE_STYLE[variant])
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
    <rect x="1.03" y="1.03" width="17.95" height="17.95" rx="1.28" />
    <path d="M 1.03 7.44h 17.95" />
    <path d="M 7.44 7.44v 11.54" />
  {:else if variant === 'insertRowAbove'}
    <rect x="1.03" y="1.03" width="17.95" height="17.95" rx="1.28" />
    <path d="M 1.03 6.15h 17.95" />
    <path d="M 10 1.03v 5.12" />
  {:else if variant === 'insertRowBelow'}
    <rect x="1.03" y="1.03" width="17.95" height="17.95" rx="1.28" />
    <path d="M 1.03 13.85h 17.95" />
    <path d="M 10 13.85v 5.13" />
  {:else if variant === 'insertColumnBefore'}
    <rect x="1.03" y="1.03" width="17.95" height="17.95" rx="1.28" />
    <path d="M 6.15 1.03v 17.95" />
    <path d="M 1.03 10h 5.12" />
  {:else}
    <rect x="1.03" y="1.03" width="17.95" height="17.95" rx="1.28" />
    <path d="M 13.85 1.03v 17.95" />
    <path d="M 13.85 10h 5.13" />
  {/if}
</svg>
