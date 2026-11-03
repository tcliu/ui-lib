<script lang="ts">
  import FormField from '#lib/components/FormField.svelte'
  import SelectDropdown from '#lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { enumField, sizeField } from '#showcase/playground/snippet-field.js'
  import { applied, eye, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { ALL_VARIANTS, buildIconsSnippet, ICON_COMPONENTS, ICON_ENTRIES, iconClassFor, iconLabel, variantFor } from './demo-snippet'
  import { parseSizeValue } from '#showcase/playground/size-input.js'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts at the component
  // default (the Value column shows it), so the cleared form applies no
  // overrides and Show-code omits the defaults. Clearing a Value unsets it;
  // Reset restores the defaults below. `pgTint` is
  // demo-only chrome with no prop row, so it keeps a settings panel below.
  const INITIAL = {
    size: staged('md'),
    tint: '',
    className: staged(''),
    variant: staged('regular'),
  }
  let pg = $state(structuredClone(INITIAL))

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
    { value: 'xl', label: 'xl' },
  ]
  const variantOptions = ALL_VARIANTS.map(value => ({ value, label: value }))
  const tintOptions = [
    { value: 'text-cyan-400', label: 'cyan' },
    { value: 'text-emerald-400', label: 'emerald' },
    { value: 'text-amber-400', label: 'amber' },
    { value: 'text-rose-400', label: 'rose' },
  ]
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  // The variant rides the glyphs that carry it; the rest keep their default.
  const demoVariant = $derived(applied(pg.variant))
  const galleryClass = $derived(iconClassFor(pg.tint, applied(pg.className) || ''))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() => buildIconsSnippet({ size: pg.size, tint: pg.tint, className: pg.className, variant: pg.variant }))

  // The page owns the preview so the shell can host the code toggle (and the
  // playground Reset) in the sticky title row while it renders the demo and
  // the editor below. The gallery seed names every glyph directly, so it
  // resolves through the preamble's shared imports and needs no scope: passing
  // the component map would collide with the preamble (its `Menu` key
  // re-declares the imported `Menu` component).
  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. Every gallery
  // tag carries the same `size`/`className`, and the glyphs that take a
  // `variant` add it, so the sync reads a chevron tag (ChevronDownIcon), the
  // first tag carrying every attribute. `className` rides the seed combined
  // with the tint and has no write-back: a seed edit cannot split the tint
  // back out, so it stays in the editor while the Value column keeps the
  // uncombined class.
  const fields: SyncableFieldConfig[] = $derived([
    {
      name: 'className',
      type: 'string?',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Color and extra classes; explicit size classes win over the size attributes.',
      editor: 'text',
      clearable: true,
      ...eye(pg.className),
      onChange: value => stage(pg.className, value),
      toggle: eyeToggle(pg.className),
    },
    sizeField({ note: 'Width/height attributes (12/16/20/24px for names, passthrough for numbers); composes with className.', ...eye(pg.size), options: sizeOptions }),
    enumField({ name: 'variant', type: ALL_VARIANTS.map(v => `'${v}'`).join(' | '), defaultValue: "'regular'", note: 'The rendering the variant-capable glyphs take; the others keep their default.', options: variantOptions, placeholder: 'regular', clearLabel: 'Clear variant', ...eye(pg.variant) }),
  ])

</script>

{#snippet settingsPanel()}
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Tint">
      <SelectDropdown
        buttonLabel={tintOptions.find(option => option.value === pg.tint)?.label ?? 'Default'}
        activeValue={pg.tint}
        ariaLabel="Tint"
        options={tintOptions}
        onSelect={value => (pg.tint = value)}
        clearable
        clearLabel="Clear tint"
        onClear={() => (pg.tint = '')} />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        activeValue={pg.size.value}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => stage(pg.size, value)}
        clearable
        clearLabel="Clear size"
        onClear={() => {
          pg.size.value = 'md'
          pg.size.on = false
        }} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage {fields} title="Icons" {code} onReset={clearPlayground} configPanel={settingsPanel}
    sync={{ tag: 'ChevronDownIcon' }}
    scope={{}}
  >
  <div
    class="grid grid-cols-4 gap-3 text-xs text-slate-400 sm:grid-cols-8 [&>span]:flex [&>span]:flex-col [&>span]:items-center [&>span]:gap-1">
    {#each ICON_ENTRIES as entry (iconLabel(entry))}
      {@const Icon = ICON_COMPONENTS[entry.name]}
      {@const variantProps = variantFor(entry.name, demoVariant)}
      <span
        ><Icon
          size={demoSize}
          className={galleryClass}
          {...variantProps} />{iconLabel(entry)}</span
      >{' '}
    {/each}
  </div>
</ShowcasePage>
