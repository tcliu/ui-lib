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
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  class={className}>
  <path d="M 19 10a 9 9 0 1 1 -9 -9c 2.52 0 4.93 1 6.74 2.74L 19 6" />
  <path d="M 19 1v 5h -5" />
</svg>
