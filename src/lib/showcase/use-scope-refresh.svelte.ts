import type { SnippetPreview } from './use-snippet-preview.svelte'

// Recompiles a page's live preview when a value its snippet reads from `scope`
// changes without changing the seed (a demo label, a locale, a prop the seed
// omits). `read` registers the reactive dependencies by reading them; `when`
// optionally gates the refresh (e.g. only while an unset label reads the
// localized default). Call once per page during component init.
export function useScopeRefresh(preview: SnippetPreview, read: () => unknown, when?: () => boolean): void {
  $effect(() => {
    read()
    if (preview.live && (when ? when() : true)) preview.refresh()
  })
}
