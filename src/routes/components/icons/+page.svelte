<script lang="ts">
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetToggle } from '$lib/showcase/snippet-field'
  import { buildIconsSnippet, ICON_COMPONENTS, ICON_ENTRIES, iconClassFor, iconLabel } from './demo-snippet'
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
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
    { value: 'xl', label: 'xl' },
  ]
  const tintOptions = [
    { value: 'text-cyan-400', label: 'cyan' },
    { value: 'text-emerald-400', label: 'emerald' },
    { value: 'text-amber-400', label: 'amber' },
    { value: 'text-rose-400', label: 'rose' },
  ]
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const galleryClass = $derived(iconClassFor(pgTint, pgClassNameOn ? pgClassName : ''))

  function clearPlayground() {
    pgSize = 'md'
    pgSizeOn = false
    pgTint = ''
    pgClassName = ''
    pgClassNameOn = false
  }

  const code = $derived.by(() => buildIconsSnippet({ size: pgSize, sizeOn: pgSizeOn, tint: pgTint, className: pgClassName, classNameOn: pgClassNameOn }))

  // The page owns the preview so the shell can host the code toggle (and the
  // playground Reset) in the sticky title row while it renders the demo and
  // the editor below. The gallery seed names every glyph directly, so it
  // resolves through the preamble's shared imports and needs no scope: passing
  // the component map would collide with the preamble (its `Menu` key
  // re-declares the imported `Menu` component).
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({}),
    sync: { tag: 'CheckIcon', getFields: () => syncFields },
  })

  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. Every gallery
  // tag carries the same attributes, so the sync reads the first one
  // (CheckIcon). `className` rides the seed combined with the tint and has no
  // write-back: a seed edit cannot split the tint back out, so it stays in
  // the editor while the Value column keeps the uncombined class.
  const fields: SyncableFieldConfig[] = $derived([
    {
      name: 'className',
      type: 'string?',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Color and extra classes; explicit size classes win over the size attributes; the eye stages the customization.',
      editor: 'text',
      clearable: true,
      value: pgClassName,
      onChange: value => {
        pgClassName = value
        pgClassNameOn = true
      },
      toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)),
    },
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number",
      defaultValue: "'md'",
      note: 'Width/height attributes (12/16/20/24px for names, passthrough for numbers); composes with className; the eye stages the customization.',
      editor: 'size',
      allowCustomValue: true,
      options: sizeOptions,
      value: pgSize,
      onChange: value => {
        pgSize = value
        pgSizeOn = true
      },
      placeholder: 'md',
      clearLabel: 'Clear size',
      toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)),
      sync: {
        kind: 'custom',
        read: attrs => {
          const attr = attrs?.get('size')
          // Absent restores the default, like the builder omitting the fragment;
          // string and numeric shapes set, anything else is custom code the
          // playground leaves alone.
          if (!attr) return 'md'
          if (attr.kind === 'string') return attr.value
          if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
          return undefined
        },
      },
    },
  ])

  const syncFields = $derived(syncFieldsOf(fields))
</script>

{#snippet settingsPanel()}
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Tint">
      <SelectDropdown
        buttonLabel={tintOptions.find(option => option.value === pgTint)?.label ?? 'Default'}
        activeValue={pgTint}
        ariaLabel="Tint"
        options={tintOptions}
        onSelect={value => (pgTint = value)}
        clearable
        clearLabel="Clear tint"
        onClear={() => (pgTint = '')} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage {fields} title="Icons" {code} {preview} onReset={clearPlayground} configPanel={settingsPanel}>
  <div
    class="grid grid-cols-4 gap-3 text-xs text-slate-400 sm:grid-cols-8 [&>span]:flex [&>span]:flex-col [&>span]:items-center [&>span]:gap-1">
    {#each ICON_ENTRIES as entry (iconLabel(entry))}
      {@const Icon = ICON_COMPONENTS[entry.name]}
      <span
        ><Icon
          size={demoSize}
          className={galleryClass} />{iconLabel(entry)}</span
      >{' '}
    {/each}
  </div>
</ShowcasePage>
