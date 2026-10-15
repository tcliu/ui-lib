<script lang="ts">
  import Spinner from '$lib/components/Spinner.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetToggle } from '$lib/showcase/snippet-field'
  import { buildSpinnerSnippet } from './demo-snippet'
  import { parseSizeValue } from '$lib/showcase/size-input'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts at the component
  // default (the Value column shows it), so the cleared form applies no
  // overrides and Show-code omits the defaults. Clearing a Value unsets it;
  // Reset restores the defaults below. `pgTint` is
  // demo-only chrome with no prop row, so it keeps a settings panel below.
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgTint = $state('')
  let pgTintOn = $state(false)

  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const demoTint = $derived(pgTintOn && pgTint ? pgTint : undefined)
  const reloadLabel = $derived(i18n.t('common.reload'))

  function clearPlayground() {
    pgSize = 'md'
    pgSizeOn = false
    pgTint = ''
    pgTintOn = false
  }

  const code = $derived.by(() => buildSpinnerSnippet({ size: pgSize, sizeOn: pgSizeOn, tint: pgTint, tintOn: pgTintOn }))

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ reloadLabel }),
    sync: { tag: 'Spinner', getFields: () => syncFields },
  })

  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The demo's
  // spinner carries the seed's attributes, so the sync reads its tag.
  // `className` rides the seed combined with the tint and has no write-back:
  // a seed edit cannot split the tint back out, so it stays in the editor
  // while the Value column keeps the uncombined class.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Color and extra classes; explicit size classes win over the size attributes; the eye stages the customization.', editor: 'text', clearable: true, value: pgTint, onChange: value => { pgTint = value; pgTintOn = true; }, toggle: snippetToggle(pgTintOn, enabled => (pgTintOn = enabled)) },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Width/height attributes (18/21/24/27/30px for names, passthrough for numbers); composes with className; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, placeholder: 'md', clearLabel: 'Clear size', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'custom', read: attrs => {
      const attr = attrs?.get('size')
      // Absent restores the default, like the builder omitting the fragment;
      // string and numeric shapes set, anything else is custom code the
      // playground leaves alone.
      if (!attr) return 'md'
      if (attr.kind === 'string') return attr.value
      if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
      return undefined
    } } },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // The reload label reads the locale from scope, which reseeding never
  // refreshes; recompile the draft on those scope changes without touching
  // the editor text.
  useScopeRefresh(preview, () => [reloadLabel])
</script>

<ShowcasePage
    {fields}
    title="Spinner"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{ reloadLabel }}
>
    <span class="inline-flex items-center gap-2 text-sm text-slate-300">
      <Spinner size={demoSize} className={demoTint} />
      {reloadLabel}
    </span>
  </ShowcasePage>
