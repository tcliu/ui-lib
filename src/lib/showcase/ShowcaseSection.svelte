<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    title: string
    children: Snippet
  }

  let { title, children }: Props = $props()
</script>

<section aria-label={title} class="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
  <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
  <div class="flex flex-wrap items-start gap-4">
    {@render children()}
  </div>
</section>
