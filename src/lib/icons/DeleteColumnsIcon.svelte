<script lang="ts">
  interface Props {
    className?: string
  }

  let { className = '' }: Props = $props()
</script>

<svg
  viewBox="0 0 20 20"
  fill="none"
  stroke="currentColor"
  stroke-width="1.82"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  class={className}>
  <path d="M 3.18 3.18h 2.27l 1.14 -1.13l 2.27 -1.14h 2.28l 2.27 1.14l 1.14 1.13h 2.27" />
  <path d="M 4.32 5.45l 1.13 13.64h 6.82l 1.14 -13.64" />
  <path d="M 7.73 8.86v 6.82M 10 8.86v 6.82" />
</svg>
