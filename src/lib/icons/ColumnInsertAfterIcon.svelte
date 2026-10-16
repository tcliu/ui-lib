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
  stroke-width="2.05"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  class={className}>
  <rect x="1.03" y="1.03" width="17.95" height="17.95" rx="1.28" />
  <path d="M 13.85 1.03v 17.95" />
  <path d="M 13.85 10h 5.13" />
</svg>
