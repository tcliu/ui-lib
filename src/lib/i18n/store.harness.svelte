<script lang="ts">
  import { getI18nContext, setI18nContext, type I18nStore } from './store.svelte'

  // A provider plus the read a child renders with: the two must name the same
  // context. `provide` off exercises the provider-less fallback. Context is
  // only visible during init, so both happen in one call the compiler reads as
  // a closure rather than a captured value.
  let {
    store,
    provide = true,
    onRead,
  }: { store: I18nStore; provide?: boolean; onRead: (store: I18nStore) => void } = $props()

  function connect() {
    if (provide) setI18nContext(store)
    onRead(getI18nContext())
  }

  connect()
</script>
