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
  <path d="M 1.03 7.44h 17.95M 7.44 1.03v 17.95" />
  <path d="M 8.72 10h 5.13" />
  <path d="M 12.56 7.44l 2.57 2.56l -2.57 2.56" />
</svg>
