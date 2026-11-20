<script lang="ts">
  import ClearButton from '#lib/components/ClearButton.svelte'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '#showcase/playground/size-input.js'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { boolField, sizeField, textField } from '#showcase/playground/snippet-field.js'
  import { applied, appliedFlag, eye, eyeFlag, staged } from '#showcase/playground/staged.js'
  import { type TriState } from '#showcase/playground/snippet-build.js'
  import { buildClearButtonSnippet } from './demo-snippet'

  // Customizer playground state. Every option starts at the component default
  // (the Value column shows it), so the cleared form applies no overrides and
  // Show-code omits the defaults. `clicks` is demo-only interaction state.
  const INITIAL = {
    ariaLabel: staged(''),
    disabled: staged('no' as TriState),
    size: staged('md'),
    tooltip: staged(''),
    clicks: 0,
  }
  let pg = $state(structuredClone(INITIAL))

  const demoAriaLabel = $derived(applied(pg.ariaLabel) || undefined)
  const demoDisabled = $derived(appliedFlag(pg.disabled))
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoTooltip = $derived(applied(pg.tooltip) || undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildClearButtonSnippet({
      ariaLabel: pg.ariaLabel,
      disabled: pg.disabled,
      size: pg.size,
      tooltip: pg.tooltip,
    }),
  )

  // Editable rows first (primitives, data, and snippets, A–Z), then the
  // function props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name; defaults to the shared “Clear” label.', clearable: true, ...eye(pg.ariaLabel) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the clear action.', ...eyeFlag(pg.disabled) }),
    sizeField({ note: 'The field size whose clear cross this button matches; numbers are icon-scale pixels.', ...eye(pg.size) }),
    textField({ name: 'tooltip', type: 'string?', defaultValue: '—', note: 'Tooltip text.', clearable: true, ...eye(pg.tooltip) }),
    { name: 'onClick', type: '() => void', defaultValue: '—', note: 'Clear handler.' },
  ])
</script>

<ShowcasePage
    {fields}
    title="ClearButton"
    {code}
    onReset={clearPlayground}
    scope={{ clicks: pg.clicks }}
    sync={{ tag: 'ClearButton' }}
  >
    <span class="inline-flex items-center gap-3 text-sm text-slate-400">
      <ClearButton
        ariaLabel={demoAriaLabel}
        size={demoSize}
        disabled={demoDisabled}
        tooltip={demoTooltip}
        onClick={() => (pg.clicks += 1)} />
      {pg.clicks}
    </span>
</ShowcasePage>
