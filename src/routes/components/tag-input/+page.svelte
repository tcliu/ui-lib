<script lang="ts">
  import { flagOn } from '$showcase/snippet-build'
  import TagInput from '$lib/components/TagInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField, jsonField, snippetField, snippetToggle } from '$showcase/snippet-field'
  import {
    buildTagInputSnippet,
    parseTagListJson,
    parseTagListValue,
    TAG_STAGE_DEFAULT_WIDTH,
    TAG_STAGE_MIN_WIDTH,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  const INITIAL_TAGS = ['svelte', 'kit']
  const DEFAULT_OPTIONS = ['svelte', 'kit', 'icons', 'forms', 'tables']

  // An alternate palette, to show the `palette` prop overriding the built-in
  // per-tag colours.
  const ALT_PALETTE = [
    'border-amber-700 bg-amber-950/50 text-amber-200',
    'border-teal-700 bg-teal-950/50 text-teal-200',
    'border-fuchsia-700 bg-fuchsia-950/50 text-fuchsia-200',
  ]

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. The tag lists are committed
  // state seeded from the defaults above.
  const INITIAL = {
    value: [...INITIAL_TAGS],
    options: [...DEFAULT_OPTIONS],
    valueEnabled: true,
    optionsEnabled: true,
    placeholder: '',
    placeholderOn: false,
    size: 'md',
    sizeOn: false,
    palette: '',
    paletteOn: false,
    disabled: 'no' as TriState,
    disabledOn: false,
    id: '',
    idOn: false,
    chipClass: '',
    chipClassOn: false,
    chipPrefix: '',
    chipOn: false,
    optionPrefix: '',
    optionOn: false,
    defaultValue: [] as string[],
    defaultValueOn: false,
    clearable: 'no' as TriState,
    clearableOn: false,
    clearLabel: 'Clear tags',
    clearLabelOn: false,
    clearPlacement: 'auto',
    clearPlacementOn: false,
    stageWidth: TAG_STAGE_DEFAULT_WIDTH,
  }
  let pg = $state(structuredClone(INITIAL))
  // The tag lists apply only while their eye toggle is on (both on, so the
  // cleared form renders the current demo).
  // The default list applies only while its eye toggle is on (off, so the
  // cleared form renders the component default).
  // Stage width is interaction state, not a curated option; Reset restores it.

  const disabled = $derived(pg.disabledOn ? flagOn(pg.disabled) : undefined)
  const clearable = $derived(pg.clearableOn ? flagOn(pg.clearable) : undefined)
  const demoClearLabel = $derived(pg.clearLabelOn && pg.clearLabel ? pg.clearLabel : undefined)
  const demoClearPlacement = $derived(
    pg.clearPlacementOn
      ? ((pg.clearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pg.defaultValueOn ? pg.defaultValue : undefined)

  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)

  const paletteOptions = [{ value: 'alt', label: 'Alt palette' }]

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildTagInputSnippet({
      value: pg.value,
      valueEnabled: pg.valueEnabled,
      options: pg.options,
      optionsEnabled: pg.optionsEnabled,
      placeholder: pg.placeholder,
      placeholderOn: pg.placeholderOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      palette: pg.palette,
      paletteOn: pg.paletteOn,
      disabled: pg.disabled,
      disabledOn: pg.disabledOn,
      id: pg.id,
      idOn: pg.idOn,
      chipClass: pg.chipClass,
      chipClassOn: pg.chipClassOn,
      chip: pg.chipOn ? pg.chipPrefix : '',
      option: pg.optionOn ? pg.optionPrefix : '',
      defaultValue: pg.defaultValue,
      defaultValueOn: pg.defaultValueOn,
      clearable: pg.clearable,
      clearableOn: pg.clearableOn,
      clearLabel: pg.clearLabel,
      clearLabelOn: pg.clearLabelOn,
      clearPlacement: pg.clearPlacement,
      clearPlacementOn: pg.clearPlacementOn,
    }),
  )

  
  // Editable rows first (primitives, plain data, and snippets, A–Z), then the
  // function props (A–Z). Snippet rows keep no Value editor yet; the snippet
  // playground remains their customization surface.
  const fields: SyncableFieldConfig[] = $derived([
    snippetField({
      type: 'Snippet<[tag, remove]>',
      name: 'chip',
      note: 'Custom chip renderer; committing applies it, and the dialog edits its prefix text.',
      value: pg.chipPrefix,
      onChange: value => (pg.chipPrefix = value),
      toggle: snippetToggle(pg.chipOn, enabled => (pg.chipOn = enabled)),
    }),
    textField({ name: 'chipClass', type: 'string | ((tag: string) => string)?', defaultValue: '—', note: 'Chip classes; a string applies to all, a function overrides per tag (wins over the palette) and owns the whole class string, shape included.', value: pg.chipClass, onChange: v => (pg.chipClass = v), clearable: true, enabled: pg.chipClassOn, setEnabled: v => (pg.chipClassOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear tags'", note: 'Accessible name for the clear button.', value: pg.clearLabel, onChange: v => (pg.clearLabel = v), editorDefaultValue: 'Clear tags', clearable: true, placeholder: 'Clear tags', enabled: pg.clearLabelOn, setEnabled: v => (pg.clearLabelOn = v) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the box edge; outside sits after it; auto renders inside with the tags.', options: clearPlacementOptions, value: pg.clearPlacement, onChange: v => (pg.clearPlacement = v), placeholder: 'auto', clearLabel: 'Clear placement', enabled: pg.clearPlacementOn, setEnabled: v => (pg.clearPlacementOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that resets the tags to the default value.', value: pg.clearable, onChange: v => (pg.clearable = v as TriState), enabled: pg.clearableOn, setEnabled: v => (pg.clearableOn = v) }),
    jsonField({
      name: 'defaultValue',
      type: 'string[]?',
      note: 'Baseline the clear button compares against; the cross hides while the tags match it; the eye applies the list.',
      value: JSON.stringify(pg.defaultValue, null, 2),
      onChange: (draft: string) => {
        const parsed = parseTagListJson(draft)
        if (parsed) {
          pg.defaultValue = parsed
          pg.defaultValueOn = true
        }
      },
      dialog: { valid: (draft: string) => parseTagListJson(draft) != null, invalidMessage: 'Invalid default-value JSON. Use an array of strings.', title: 'Edit default value' },
      toggle: snippetToggle(pg.defaultValueOn, enabled => (pg.defaultValueOn = enabled)),
      sync: { kind: 'scriptJson', parseJson: parseTagListValue, setJson: value => (pg.defaultValue = value as typeof pg.defaultValue) },
    }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input.', value: pg.disabled, onChange: v => (pg.disabled = v as TriState), enabled: pg.disabledOn, setEnabled: v => (pg.disabledOn = v) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', value: pg.id, onChange: v => (pg.id = v), clearable: true, enabled: pg.idOn, setEnabled: v => (pg.idOn = v) }),
    snippetField({
      type: 'Snippet<[tag]>',
      name: 'option',
      note: 'Custom suggestion renderer; committing applies it, and the dialog edits its prefix text.',
      value: pg.optionPrefix,
      onChange: value => (pg.optionPrefix = value),
      toggle: snippetToggle(pg.optionOn, enabled => (pg.optionOn = enabled)),
    }),
    jsonField({
      name: 'options',
      type: 'string[]?',
      note: 'Suggestions offered while typing; the eye applies the list.',
      value: JSON.stringify(pg.options, null, 2),
      onChange: (draft: string) => {
        const parsed = parseTagListJson(draft)
        if (parsed) {
          pg.options = parsed
          pg.optionsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseTagListJson(draft) != null, invalidMessage: 'Invalid options JSON. Use an array of strings.', title: 'Edit options' },
      toggle: snippetToggle(pg.optionsEnabled, enabled => (pg.optionsEnabled = enabled)),
      sync: { kind: 'scriptJson', parseJson: parseTagListValue, setJson: value => (pg.options = value as typeof pg.options) },
    }),
    {
      name: 'palette',
      type: 'readonly string[]?',
      defaultValue: 'built-in',
      note: 'Per-tag colour classes; replaces the built-in palette.', editor: 'enum', options: paletteOptions, value: pg.palette, onChange: value => { pg.palette = value; pg.paletteOn = true; }, clearLabel: 'Clear palette', toggle: snippetToggle(pg.paletteOn, enabled => (pg.paletteOn = enabled)), sync: { kind: 'scopeReset', scopeRef: 'altPalette' } },
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Placeholder text.', value: pg.placeholder, onChange: v => (pg.placeholder = v), clearable: true, enabled: pg.placeholderOn, setEnabled: v => (pg.placeholderOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    jsonField({
      name: 'value',
      type: 'string[]?',
      note: 'Selected tags; the eye applies the list (hiding the readout while off).',
      value: JSON.stringify(pg.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseTagListJson(draft)
        if (parsed) {
          pg.value = parsed
          pg.valueEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseTagListJson(draft) != null, invalidMessage: 'Invalid value JSON. Use an array of strings.', title: 'Edit value' },
      toggle: snippetToggle(pg.valueEnabled, enabled => (pg.valueEnabled = enabled)),
      sync: { kind: 'scriptJson', parseJson: parseTagListValue, setJson: value => (pg.value = value as typeof pg.value) },
    }),
    { name: 'chipStyle', type: '(tag: string) => string | undefined', defaultValue: '—', note: 'Inline style per tag for the chip; the caller owns the colour treatment.' },
    { name: 'onChange', type: '(next: string[]) => void', defaultValue: '—', note: 'Called with the new tag list.' },
    {
      name: 'onClear',
      type: '() => void',
      defaultValue: 'onChange(default)',
      note: 'Clear handler; resets to the default value when omitted.',
    },
    {
      name: 'onQueryChange',
      type: '(query: string) => void',
      defaultValue: '—',
      note: 'Called on every keystroke; supply externally filtered options.',
    },
    { name: 'optionDotStyle', type: '(tag: string) => string | undefined', defaultValue: '—', note: 'Inline style for the dot before the option label; the dot itself is the component’s.' },
  ])

</script>

{#snippet demoChip(tag: string, remove: () => void)}
  <span>{pg.chipPrefix}{tag} <button type="button" onclick={remove} aria-label="Remove {tag}">×</button></span>
{/snippet}

{#snippet demoOption(tag: string)}
  <span>{pg.optionPrefix}{tag}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="TagInput"
    {code}
    onReset={clearPlayground}
    scope={{ altPalette: ALT_PALETTE }}
    stage={{ minWidth: TAG_STAGE_MIN_WIDTH }}
    bind:stageWidth={pg.stageWidth}

    sync={{ tag: 'TagInput' }}
  >
    <TagInput
      value={pg.valueEnabled ? pg.value : undefined}
      defaultValue={demoDefaultValue}
      options={pg.optionsEnabled ? pg.options : undefined}
      placeholder={pg.placeholderOn && pg.placeholder ? pg.placeholder : undefined}
      size={demoSize}
      palette={pg.paletteOn && pg.palette === 'alt' ? ALT_PALETTE : undefined}
      disabled={disabled}
      clearable={clearable}
      clearLabel={demoClearLabel}
      clearPlacement={demoClearPlacement}
      id={pg.idOn && pg.id ? pg.id : undefined}
      chipClass={pg.chipClassOn && pg.chipClass ? pg.chipClass : undefined}
      chip={pg.chipOn && pg.chipPrefix ? demoChip : undefined}
      option={pg.optionOn && pg.optionPrefix ? demoOption : undefined}
      onChange={next => (pg.value = next)} />
    {#if pg.valueEnabled}
      <span class="text-sm text-slate-400">tags: {pg.value.join(', ')}</span>
    {/if}
  </ShowcasePage>
