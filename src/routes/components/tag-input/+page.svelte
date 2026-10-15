<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import TagInput from '$lib/components/TagInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField, jsonField, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
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
  let pgValue = $state([...INITIAL_TAGS])
  let pgOptions = $state([...DEFAULT_OPTIONS])
  // The tag lists apply only while their eye toggle is on (both on, so the
  // cleared form renders the current demo).
  let pgValueEnabled = $state(true)
  let pgOptionsEnabled = $state(true)
  let pgPlaceholder = $state('')
  let pgPlaceholderOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgPalette = $state('')
  let pgPaletteOn = $state(false)
  let pgDisabled = $state<TriState>('no')
  let pgDisabledOn = $state(false)
  let pgId = $state('')
  let pgIdOn = $state(false)
  let pgChipClass = $state('')
  let pgChipClassOn = $state(false)
  let pgChipPrefix = $state('')
  let pgChipOn = $state(false)
  let pgOptionPrefix = $state('')
  let pgOptionOn = $state(false)
  let pgDefaultValue = $state<string[]>([])
  // The default list applies only while its eye toggle is on (off, so the
  // cleared form renders the component default).
  let pgDefaultValueOn = $state(false)
  let pgClearable = $state<TriState>('no')
  let pgClearableOn = $state(false)
  let pgClearLabel = $state('Clear tags')
  let pgClearLabelOn = $state(false)
  let pgClearPlacement = $state('auto')
  let pgClearPlacementOn = $state(false)
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(TAG_STAGE_DEFAULT_WIDTH)

  const disabled = $derived(pgDisabledOn ? flagOn(pgDisabled) : undefined)
  const clearable = $derived(pgClearableOn ? flagOn(pgClearable) : undefined)
  const demoClearLabel = $derived(pgClearLabelOn && pgClearLabel ? pgClearLabel : undefined)
  const demoClearPlacement = $derived(
    pgClearPlacementOn
      ? ((pgClearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pgDefaultValueOn ? pgDefaultValue : undefined)

  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)

  const paletteOptions = [{ value: 'alt', label: 'Alt palette' }]

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  function clearPlayground() {
    pgValue = [...INITIAL_TAGS]
    pgOptions = [...DEFAULT_OPTIONS]
    pgValueEnabled = true
    pgOptionsEnabled = true
    pgPlaceholder = ''
    pgPlaceholderOn = false
    pgSize = 'md'
    pgSizeOn = false
    pgPalette = ''
    pgPaletteOn = false
    pgDisabled = 'no'
    pgDisabledOn = false
    pgId = ''
    pgIdOn = false
    pgChipClass = ''
    pgChipClassOn = false
    pgChipPrefix = ''
    pgChipOn = false
    pgOptionPrefix = ''
    pgOptionOn = false
    pgDefaultValue = []
    pgDefaultValueOn = false
    pgClearable = 'no'
    pgClearableOn = false
    pgClearLabel = 'Clear tags'
    pgClearLabelOn = false
    pgClearPlacement = 'auto'
    pgClearPlacementOn = false
    pgStageWidth = TAG_STAGE_DEFAULT_WIDTH
  }

  const code = $derived.by(() =>
    buildTagInputSnippet({
      value: pgValue,
      valueEnabled: pgValueEnabled,
      options: pgOptions,
      optionsEnabled: pgOptionsEnabled,
      placeholder: pgPlaceholder,
      placeholderOn: pgPlaceholderOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      palette: pgPalette,
      paletteOn: pgPaletteOn,
      disabled: pgDisabled,
      disabledOn: pgDisabledOn,
      id: pgId,
      idOn: pgIdOn,
      chipClass: pgChipClass,
      chipClassOn: pgChipClassOn,
      chip: pgChipOn ? pgChipPrefix : '',
      option: pgOptionOn ? pgOptionPrefix : '',
      defaultValue: pgDefaultValue,
      defaultValueOn: pgDefaultValueOn,
      clearable: pgClearable,
      clearableOn: pgClearableOn,
      clearLabel: pgClearLabel,
      clearLabelOn: pgClearLabelOn,
      clearPlacement: pgClearPlacement,
      clearPlacementOn: pgClearPlacementOn,
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
      value: pgChipPrefix,
      onChange: value => (pgChipPrefix = value),
      toggle: snippetToggle(pgChipOn, enabled => (pgChipOn = enabled)),
    }),
    textField({ name: 'chipClass', type: 'string | ((tag: string) => string)?', defaultValue: '—', note: 'Chip classes; a string applies to all, a function overrides per tag (wins over the palette).', value: pgChipClass, onChange: v => (pgChipClass = v), clearable: true, enabled: pgChipClassOn, setEnabled: v => (pgChipClassOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear tags'", note: 'Accessible name for the clear button.', value: pgClearLabel, onChange: v => (pgClearLabel = v), editorDefaultValue: 'Clear tags', clearable: true, placeholder: 'Clear tags', enabled: pgClearLabelOn, setEnabled: v => (pgClearLabelOn = v) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the box edge; outside sits after it; auto renders inside with the tags.', options: clearPlacementOptions, value: pgClearPlacement, onChange: v => (pgClearPlacement = v), placeholder: 'auto', clearLabel: 'Clear placement', enabled: pgClearPlacementOn, setEnabled: v => (pgClearPlacementOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that resets the tags to the default value.', value: pgClearable, onChange: v => (pgClearable = v as TriState), enabled: pgClearableOn, setEnabled: v => (pgClearableOn = v) }),
    jsonField({
      name: 'defaultValue',
      type: 'string[]',
      note: 'Baseline the clear button compares against; the cross hides while the tags match it; the eye applies the list.',
      value: JSON.stringify(pgDefaultValue, null, 2),
      onChange: (draft: string) => {
        const parsed = parseTagListJson(draft)
        if (parsed) {
          pgDefaultValue = parsed
          pgDefaultValueOn = true
        }
      },
      dialog: { valid: (draft: string) => parseTagListJson(draft) != null, invalidMessage: 'Invalid default-value JSON. Use an array of strings.', title: 'Edit default value' },
      toggle: snippetToggle(pgDefaultValueOn, enabled => (pgDefaultValueOn = enabled)),
      sync: { kind: 'scriptJson', parseJson: parseTagListValue, setJson: value => (pgDefaultValue = value as typeof pgDefaultValue) },
    }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input.', value: pgDisabled, onChange: v => (pgDisabled = v as TriState), enabled: pgDisabledOn, setEnabled: v => (pgDisabledOn = v) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', value: pgId, onChange: v => (pgId = v), clearable: true, enabled: pgIdOn, setEnabled: v => (pgIdOn = v) }),
    snippetField({
      type: 'Snippet<[tag]>',
      name: 'option',
      note: 'Custom suggestion renderer; committing applies it, and the dialog edits its prefix text.',
      value: pgOptionPrefix,
      onChange: value => (pgOptionPrefix = value),
      toggle: snippetToggle(pgOptionOn, enabled => (pgOptionOn = enabled)),
    }),
    jsonField({
      name: 'options',
      type: 'string[]',
      note: 'Suggestions offered while typing; the eye applies the list.',
      value: JSON.stringify(pgOptions, null, 2),
      onChange: (draft: string) => {
        const parsed = parseTagListJson(draft)
        if (parsed) {
          pgOptions = parsed
          pgOptionsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseTagListJson(draft) != null, invalidMessage: 'Invalid options JSON. Use an array of strings.', title: 'Edit options' },
      toggle: snippetToggle(pgOptionsEnabled, enabled => (pgOptionsEnabled = enabled)),
      sync: { kind: 'scriptJson', parseJson: parseTagListValue, setJson: value => (pgOptions = value as typeof pgOptions) },
    }),
    {
      name: 'palette',
      type: 'readonly string[]',
      defaultValue: 'built-in',
      note: 'Per-tag colour classes; replaces the built-in palette.', editor: 'enum', options: paletteOptions, value: pgPalette, onChange: value => { pgPalette = value; pgPaletteOn = true; }, clearLabel: 'Clear palette', toggle: snippetToggle(pgPaletteOn, enabled => (pgPaletteOn = enabled)), sync: { kind: 'scopeReset', scopeRef: 'altPalette' } },
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Placeholder text.', value: pgPlaceholder, onChange: v => (pgPlaceholder = v), clearable: true, enabled: pgPlaceholderOn, setEnabled: v => (pgPlaceholderOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    jsonField({
      name: 'value',
      type: 'string[]',
      note: 'Selected tags; the eye applies the list (hiding the readout while off).',
      value: JSON.stringify(pgValue, null, 2),
      onChange: (draft: string) => {
        const parsed = parseTagListJson(draft)
        if (parsed) {
          pgValue = parsed
          pgValueEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseTagListJson(draft) != null, invalidMessage: 'Invalid value JSON. Use an array of strings.', title: 'Edit value' },
      toggle: snippetToggle(pgValueEnabled, enabled => (pgValueEnabled = enabled)),
      sync: { kind: 'scriptJson', parseJson: parseTagListValue, setJson: value => (pgValue = value as typeof pgValue) },
    }),
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
    }
  ])

</script>

{#snippet demoChip(tag: string, remove: () => void)}
  <span>{pgChipPrefix}{tag} <button type="button" onclick={remove} aria-label="Remove {tag}">×</button></span>
{/snippet}

{#snippet demoOption(tag: string)}
  <span>{pgOptionPrefix}{tag}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="TagInput"
    {code}
    onReset={clearPlayground}
    scope={{ altPalette: ALT_PALETTE }}
    stage={{ minWidth: TAG_STAGE_MIN_WIDTH }}
    bind:stageWidth={pgStageWidth}

    sync={{ tag: 'TagInput' }}
  >
    <TagInput
      value={pgValueEnabled ? pgValue : undefined}
      defaultValue={demoDefaultValue}
      options={pgOptionsEnabled ? pgOptions : undefined}
      placeholder={pgPlaceholderOn && pgPlaceholder ? pgPlaceholder : undefined}
      size={demoSize}
      palette={pgPaletteOn && pgPalette === 'alt' ? ALT_PALETTE : undefined}
      disabled={disabled}
      clearable={clearable}
      clearLabel={demoClearLabel}
      clearPlacement={demoClearPlacement}
      id={pgIdOn && pgId ? pgId : undefined}
      chipClass={pgChipClassOn && pgChipClass ? pgChipClass : undefined}
      chip={pgChipOn && pgChipPrefix ? demoChip : undefined}
      option={pgOptionOn && pgOptionPrefix ? demoOption : undefined}
      onChange={next => (pgValue = next)} />
    {#if pgValueEnabled}
      <span class="text-sm text-slate-400">tags: {pgValue.join(', ')}</span>
    {/if}
  </ShowcasePage>
