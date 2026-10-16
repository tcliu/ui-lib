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
  <path d="M 1 10a 9 9 0 1 0 9 -9a 9.75 9.75 0 0 0 -6.74 2.74L 1 6" />
  <path d="M 1 1v 5h 5" />
</svg>
