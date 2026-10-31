<script lang="ts">
  import TagInput from '$lib/components/TagInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField, jsonField, snippetField } from '$showcase/snippet-field'
  import { applied, appliedFlag, eye, eyeFlag, eyeToggle, stage, staged } from '$showcase/staged'
  import { type TriState } from '$showcase/snippet-build'
  import {
    buildTagInputSnippet,
    parseTagListJson,
    parseTagListValue,
    TAG_STAGE_DEFAULT_WIDTH,
    TAG_STAGE_MIN_WIDTH,
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
    value: staged([...INITIAL_TAGS], true),
    options: staged([...DEFAULT_OPTIONS], true),
    placeholder: staged(''),
    size: staged('md'),
    palette: staged(''),
    disabled: staged('no' as TriState),
    id: staged(''),
    chipClass: staged(''),
    chip: staged(''),
    option: staged(''),
    defaultValue: staged([] as string[]),
    clearable: staged('no' as TriState),
    clearLabel: staged('Clear tags'),
    clearPlacement: staged('auto'),
    stageWidth: TAG_STAGE_DEFAULT_WIDTH,
  }
  let pg = $state(structuredClone(INITIAL))
  // The tag lists apply only while their eye toggle is on (both on, so the
  // cleared form renders the current demo).
  // The default list applies only while its eye toggle is on (off, so the
  // cleared form renders the component default).
  // Stage width is interaction state, not a curated option; Reset restores it.

  const disabled = $derived(appliedFlag(pg.disabled))
  const clearable = $derived(appliedFlag(pg.clearable))
  const demoClearLabel = $derived(applied(pg.clearLabel) || undefined)
  const demoClearPlacement = $derived(
    (applied(pg.clearPlacement) || undefined) as 'auto' | 'inside' | 'outside' | undefined,
  )
  const demoDefaultValue = $derived(applied(pg.defaultValue))

  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })

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
      options: pg.options,
      placeholder: pg.placeholder,
      size: pg.size,
      palette: pg.palette,
      disabled: pg.disabled,
      id: pg.id,
      chipClass: pg.chipClass,
      chip: pg.chip,
      option: pg.option,
      defaultValue: pg.defaultValue,
      clearable: pg.clearable,
      clearLabel: pg.clearLabel,
      clearPlacement: pg.clearPlacement,
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
      value: pg.chip.value,
      onChange: value => (pg.chip.value = value),
      toggle: eyeToggle(pg.chip),
    }),
    textField({ name: 'chipClass', type: 'string | ((tag: string) => string)?', defaultValue: '—', note: 'Chip classes; a string applies to all, a function overrides per tag (wins over the palette) and owns the whole class string, shape included.', clearable: true, ...eye(pg.chipClass) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear tags'", note: 'Accessible name for the clear button.', editorDefaultValue: 'Clear tags', clearable: true, placeholder: 'Clear tags', ...eye(pg.clearLabel) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the box edge; outside sits after it; auto renders inside with the tags.', options: clearPlacementOptions, placeholder: 'auto', clearLabel: 'Clear placement', ...eye(pg.clearPlacement) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that resets the tags to the default value.', ...eyeFlag(pg.clearable) }),
    jsonField({
      name: 'defaultValue',
      type: 'string[]?',
      note: 'Baseline the clear button compares against; the cross hides while the tags match it; the eye applies the list.',
      value: JSON.stringify(pg.defaultValue.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseTagListJson(draft)
        if (parsed) {
          stage(pg.defaultValue, parsed)
        }
      },
      dialog: { valid: (draft: string) => parseTagListJson(draft) != null, invalidMessage: 'Invalid default-value JSON. Use an array of strings.', title: 'Edit default value' },
      toggle: eyeToggle(pg.defaultValue),
      sync: { kind: 'scriptJson', parseJson: parseTagListValue, setJson: value => (pg.defaultValue.value = value as string[]) },
    }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input.', ...eyeFlag(pg.disabled) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', clearable: true, ...eye(pg.id) }),
    snippetField({
      type: 'Snippet<[tag]>',
      name: 'option',
      note: 'Custom suggestion renderer; committing applies it, and the dialog edits its prefix text.',
      value: pg.option.value,
      onChange: value => (pg.option.value = value),
      toggle: eyeToggle(pg.option),
    }),
    jsonField({
      name: 'options',
      type: 'string[]?',
      note: 'Suggestions offered while typing; the eye applies the list.',
      value: JSON.stringify(pg.options.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseTagListJson(draft)
        if (parsed) {
          stage(pg.options, parsed)
        }
      },
      dialog: { valid: (draft: string) => parseTagListJson(draft) != null, invalidMessage: 'Invalid options JSON. Use an array of strings.', title: 'Edit options' },
      toggle: eyeToggle(pg.options),
      sync: { kind: 'scriptJson', parseJson: parseTagListValue, setJson: value => (pg.options.value = value as string[]) },
    }),
    {
      name: 'palette',
      type: 'readonly string[]?',
      defaultValue: 'built-in',
      note: 'Per-tag colour classes; replaces the built-in palette.', editor: 'enum', options: paletteOptions, clearLabel: 'Clear palette', ...eye(pg.palette), onChange: value => stage(pg.palette, value), toggle: eyeToggle(pg.palette), sync: { kind: 'scopeReset', scopeRef: 'altPalette' } },
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Placeholder text.', clearable: true, ...eye(pg.placeholder) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    jsonField({
      name: 'value',
      type: 'string[]?',
      note: 'Selected tags; the eye applies the list (hiding the readout while off).',
      value: JSON.stringify(pg.value.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseTagListJson(draft)
        if (parsed) {
          stage(pg.value, parsed)
        }
      },
      dialog: { valid: (draft: string) => parseTagListJson(draft) != null, invalidMessage: 'Invalid value JSON. Use an array of strings.', title: 'Edit value' },
      toggle: eyeToggle(pg.value),
      sync: { kind: 'scriptJson', parseJson: parseTagListValue, setJson: value => (pg.value.value = value as string[]) },
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
  <span>{pg.chip.value}{tag} <button type="button" onclick={remove} aria-label="Remove {tag}">×</button></span>
{/snippet}

{#snippet demoOption(tag: string)}
  <span>{pg.option.value}{tag}</span>
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
      value={applied(pg.value)}
      defaultValue={demoDefaultValue}
      options={applied(pg.options)}
      placeholder={applied(pg.placeholder) || undefined}
      size={demoSize}
      palette={pg.palette.on && pg.palette.value === 'alt' ? ALT_PALETTE : undefined}
      disabled={disabled}
      clearable={clearable}
      clearLabel={demoClearLabel}
      clearPlacement={demoClearPlacement}
      id={applied(pg.id) || undefined}
      chipClass={applied(pg.chipClass) || undefined}
      chip={applied(pg.chip) ? demoChip : undefined}
      option={applied(pg.option) ? demoOption : undefined}
      onChange={next => (pg.value.value = next)} />
    {#if pg.value.on}
      <span class="text-sm text-slate-400">tags: {pg.value.value.join(', ')}</span>
    {/if}
  </ShowcasePage>
