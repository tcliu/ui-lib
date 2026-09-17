<script lang="ts">
  interface Props {
    className?: string
  }

  let { className = '' }: Props = $props()
</script>

<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class={className}>
  <path d="m7 6-4 4 4 4" />
  <path d="m13 6 4 4-4 4" />
  <path d="M11 4 9 16" />
</svg>
