<script lang="ts">
  type IconSize = 'xs' | 'sm' | 'md' | 'lg'
  type ChevronVariant = 'outline' | 'solid'

  interface Props {
    className?: string
    size?: IconSize
    variant?: ChevronVariant
  }

  // Width/height attributes (not classes) so `size` composes with `className`:
  // explicit size classes in className still win, since CSS beats attributes.
  const SIZE_PX: Record<IconSize, number> = { xs: 12, sm: 16, md: 20, lg: 24 }

  let { className = '', size = 'md', variant = 'outline' }: Props = $props()
</script>

{#if variant === 'solid'}
  <svg
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
    width={SIZE_PX[size]}
    height={SIZE_PX[size]}
    class={className}>
    <path
      fill-rule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
      clip-rule="evenodd" />
  </svg>
{:else}
  <svg
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    width={SIZE_PX[size]}
    height={SIZE_PX[size]}
    class={className}>
    <path d="M3 4.5 6 7.5 9 4.5" />
  </svg>
{/if}
