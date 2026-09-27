<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte'
  import { createAppI18n, setI18nContext } from '$lib/i18n.svelte'

  // Realistic provider so the shells resolve labels without the fallback warning.
  setI18nContext(createAppI18n())

  let { outerOpen = true }: { outerOpen?: boolean } = $props()
</script>

<AppShell mode="floating" open={outerOpen}>
  <AppShell mode="floating" open />
</AppShell>
