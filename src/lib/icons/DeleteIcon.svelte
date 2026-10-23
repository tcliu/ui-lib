<script lang="ts">
  import { resolveIconPx, type IconSizeInput } from './icon-size'
  import { DELETE_STYLE, type DeleteVariant } from './icon-variants'

  interface Props {
    className?: string
    size?: IconSizeInput
    variant?: DeleteVariant
  }

  // Width/height attributes (not classes) so `size` composes with `className`:
  // explicit size classes in className still win, since CSS beats attributes.
  // The delete mark: `regular` is the filled trash can; `rows` and `columns`
  // keep the can as an outline and mark the affected band inside it.

  let { className = '', size = 'md', variant = 'regular' }: Props = $props()

  const style = $derived(DELETE_STYLE[variant])
</script>

<svg
  viewBox="0 0 20 20"
  fill={variant === 'regular' ? 'currentColor' : 'none'}
  stroke={variant === 'regular' ? 'none' : 'currentColor'}
  stroke-width={style.stroke}
  stroke-linecap={style.linecap}
  stroke-linejoin={style.linejoin}
  aria-hidden="true"
  width={resolveIconPx(size)}
  height={resolveIconPx(size)}
  class={className}>
  {#if variant === 'regular'}
    <path
      fill-rule="evenodd"
      d="M 8.28 0a 2.41 2.41 0 0 0 -2.31 1.7L 5.71 2.41H 2.41a 1.03 1.03 0 0 0 0 2.07h 0.61l 1.15 12.58A 3.1 3.1 0 0 0 7.26 20h 5.48a 3.1 3.1 0 0 0 3.09 -2.94l 1.15 -12.58h 0.61a 1.03 1.03 0 0 0 0 -2.07h -3.3l -0.26 -0.71a 2.41 2.41 0 0 0 -2.31 -1.7h -3.44Z"
      clip-rule="evenodd" />
  {:else if variant === 'rows'}
    <path d="M 1.18 4.12h 17.64" />
    <path d="M 7.06 4.12V 1.18h 5.88v 2.94" />
    <path d="M 4.12 4.12l 1.03 14.7h 9.7L 15.88 4.12" />
    <path d="M 8.53 8.53v 5.88M 11.47 8.53v 5.88" />
  {:else}
    <path d="M 3.18 3.18h 2.27l 1.14 -1.13l 2.27 -1.14h 2.28l 2.27 1.14l 1.14 1.13h 2.27" />
    <path d="M 4.32 5.45l 1.13 13.64h 6.82l 1.14 -13.64" />
    <path d="M 7.73 8.86v 6.82M 10 8.86v 6.82" />
  {/if}
</svg>
