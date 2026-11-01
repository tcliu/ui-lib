<script lang="ts">
  import Spinner from '$lib/components/Spinner.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import { sizeField } from '$showcase/playground/snippet-field'
  import { applied, eye, eyeToggle, stage, staged } from '$showcase/playground/staged'
  import { buildSpinnerSnippet } from './demo-snippet'
  import { parseSizeValue } from '$showcase/playground/size-input'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts at the component
  // default (the Value column shows it), so the cleared form applies no
  // overrides and Show-code omits the defaults. Clearing a Value unsets it;
  // Reset restores the defaults below. `pgTint` is
  // demo-only chrome with no prop row, so it keeps a settings panel below.
  const INITIAL = {
    size: staged('md'),
    tint: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))

  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoTint = $derived(applied(pg.tint) || undefined)
  const reloadLabel = $derived(i18n.t('common.reload'))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() => buildSpinnerSnippet({ size: pg.size, tint: pg.tint }))

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The demo's
  // spinner carries the seed's attributes, so the sync reads its tag.
  // `className` rides the seed combined with the tint and has no write-back:
  // a seed edit cannot split the tint back out, so it stays in the editor
  // while the Value column keeps the uncombined class.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Color and extra classes; explicit size classes win over the size attributes.', editor: 'text', clearable: true, ...eye(pg.tint), onChange: value => stage(pg.tint, value), toggle: eyeToggle(pg.tint) },
    sizeField({ note: 'Width/height attributes (18/21/24/27/30px for names, passthrough for numbers); composes with className.', ...eye(pg.size) }),
  ])

  // The reload label reads the locale from scope, which reseeding never
  // refreshes; recompile the draft on those scope changes without touching
  // the editor text.
  </script>

<ShowcasePage
    {fields}
    title="Spinner"
    {code}
    onReset={clearPlayground}
    scope={{ reloadLabel }}

    sync={{ tag: 'Spinner' }}
    scopeRefresh={() => [reloadLabel]}
  >
    <span class="inline-flex items-center gap-2 text-sm text-slate-300">
      <Spinner size={demoSize} className={demoTint} />
      {reloadLabel}
    </span>
  </ShowcasePage>
