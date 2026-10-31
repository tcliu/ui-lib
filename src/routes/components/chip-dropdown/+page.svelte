<script lang="ts">
  import ChipDropdown from '$lib/components/ChipDropdown.svelte'
  import { type SelectOption } from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseOptionArrayJson } from '$showcase/option-json'
  import { parseSizeValue } from '$showcase/size-input'
  import { enumField, textField, boolField, sizeField, jsonField } from '$showcase/snippet-field'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/staged'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { type TriState } from '$showcase/snippet-build'
  import {
    buildChipDropdownSnippet,
    CHIP_STAGE_DEFAULT_WIDTH,
    CHIP_STAGE_MIN_WIDTH,
    DEFAULT_CHIP_DROPDOWN_ARIA_LABEL,
  } from './demo-snippet'

  const i18n = getI18nContext()

  const DEFAULT_OPTIONS: SelectOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'archived', label: 'Archived' },
  ]

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. `ariaLabel` is seeded to
  // the demo's accessible name. Options are committed state edited
  // through the JSON dialog below.
  const INITIAL = {
    options: staged(DEFAULT_OPTIONS, true),
    value: staged('active', true),
    defaultValue: staged(''),
    label: staged(''),
    ariaLabel: staged(DEFAULT_CHIP_DROPDOWN_ARIA_LABEL, true),
    variant: staged('violet'),
    filterable: staged('no' as TriState),
    disabled: staged('no' as TriState),
    align: staged('left'),
    filterPlaceholder: staged('Search...'),
    filterLabel: staged('Search'),
    buttonClass: staged(''),
    emptyText: staged('No options'),
    clearable: staged('no' as TriState),
    clearLabel: staged('Clear selection'),
    autoPlace: staged('yes' as TriState),
    panelClass: staged(''),
    size: staged('md'),
    stageWidth: CHIP_STAGE_DEFAULT_WIDTH,
  }
  let pg = $state(structuredClone(INITIAL))
  // The component requires options, so the eye resets to the defaults
  // instead of omitting; committing re-applies.
  // Stage width is interaction state, not a curated option; Reset restores it.

  function labelFor(list: SelectOption[], current: string): string {
    for (const option of list) {
      if (typeof option === 'string') {
        if (option === current) return option
      } else if (option.value === current) {
        return option.label ?? option.value
      }
    }
    return current
  }

  const demoVariant = $derived(
    (applied(pg.variant) || undefined) as 'sky' | 'violet' | 'amber' | 'fuchsia' | 'emerald' | undefined,
  )
  const filterable = $derived(appliedFlag(pg.filterable))
  const disabled = $derived(appliedFlag(pg.disabled))
  const clearable = $derived(appliedFlag(pg.clearable))
  const demoClearLabel = $derived(applied(pg.clearLabel) || undefined)
  const demoDefaultValue = $derived(applied(pg.defaultValue) || undefined)
  const autoPlace = $derived(appliedFlag(pg.autoPlace))
  const demoAlign = $derived((applied(pg.align) || undefined) as 'left' | 'right' | undefined)
  const demoButtonClass = $derived(applied(pg.buttonClass) || undefined)
  const demoFilterPlaceholder = $derived(applied(pg.filterPlaceholder) || undefined)
  const demoFilterLabel = $derived(applied(pg.filterLabel) || undefined)
  const demoEmptyText = $derived(applied(pg.emptyText) || undefined)
  const demoPanelClass = $derived(applied(pg.panelClass) || undefined)
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })

  const variantOptions = ['sky', 'violet', 'amber', 'fuchsia', 'emerald'].map(value => ({ value, label: value }))
  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  // Options JSON editor: FieldTable owns the dialog; this row seeds it from
  // `value` and commits through `onChange`.
  const code = $derived.by(() =>
    buildChipDropdownSnippet({
      label: pg.label,
      ariaLabel: pg.ariaLabel,
      value: pg.value,
      defaultValue: pg.defaultValue,
      size: pg.size,
      variant: pg.variant,
      filterable: pg.filterable,
      disabled: pg.disabled,
      align: pg.align,
      filterPlaceholder: pg.filterPlaceholder,
      filterLabel: pg.filterLabel,
      buttonClass: pg.buttonClass,
      emptyText: pg.emptyText,
      clearable: pg.clearable,
      clearLabel: pg.clearLabel,
      autoPlace: pg.autoPlace,
      panelClass: pg.panelClass,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'activeValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Committed option value (not its label); marked in the panel.', editor: 'text', clearable: true, ...eye(pg.value), onChange: value => stage(pg.value, value), toggle: eyeToggle(pg.value), sync: { kind: 'script', attr: 'value', literalAttr: 'activeValue' } },
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger.', options: alignOptions, placeholder: 'left', clearLabel: 'Clear align', ...eye(pg.align) }),
    textField({ name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the trigger.', clearable: true, ...eye(pg.ariaLabel) }),
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', ...eyeFlag(pg.autoPlace) }),
    textField({ name: 'buttonClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the trigger chip classes.', clearable: true, ...eye(pg.buttonClass) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear selection'", note: 'Accessible name for the clear button.', editorDefaultValue: 'Clear selection', clearable: true, placeholder: 'Clear selection', ...eye(pg.clearLabel) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that selects the default value.', ...eyeFlag(pg.clearable) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against: the option value (not its label); the cross hides while the committed value matches it.', editorDefaultValue: '', clearable: true, ...eye(pg.defaultValue) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the trigger.', ...eyeFlag(pg.disabled) }),
    textField({ name: 'emptyText', type: 'string?', defaultValue: '—', note: 'Shown when the filtered panel is empty; falls back to the localized label.', clearable: true, ...eye(pg.emptyText) }),
    textField({ name: 'filterPlaceholder', type: 'string?', defaultValue: '—', note: 'Search input placeholder; falls back to the localized label.', clearable: true, ...eye(pg.filterPlaceholder) }),
    textField({ name: 'filterLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the search input; falls back to the shared Search label.', clearable: true, ...eye(pg.filterLabel) }),
    boolField({ name: 'filterable', defaultValue: 'false', note: 'Adds a search field to the panel.', ...eyeFlag(pg.filterable) }),
    textField({ name: 'label', type: 'string', defaultValue: '—', note: 'Trigger chip text; usually the selected label.', clearable: true, ...eye(pg.label) }),
    jsonField({
      name: 'options',
      type: '(string | { value: string; label?: string })[]',
      note: "Selectable chips; a bare string (or a missing label) displays as its own value. The eye resets to the default chips.",
      value: JSON.stringify(pg.options.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseOptionArrayJson(draft)
        if (parsed) {
          stage(pg.options, parsed)
        }
      },
      dialog: { valid: (draft: string) => parseOptionArrayJson(draft) != null, invalidMessage: 'Invalid options JSON. Use an array of strings or { value, label? } objects.' },
      toggle: eyeResetToggle(pg.options, () => (pg.options.value = DEFAULT_OPTIONS)),
    }),
    textField({ name: 'panelClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the floating panel classes.', clearable: true, ...eye(pg.panelClass) }),
    sizeField({ note: 'Chip scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    enumField({ name: 'variant', type: "'sky' | 'violet' | 'amber' | 'fuchsia' | 'emerald'", defaultValue: "'violet'", note: 'Chip color scheme.', options: variantOptions, placeholder: 'violet', clearLabel: 'Clear variant', ...eye(pg.variant) }),
    {
      name: 'onClear',
      type: '() => void',
      defaultValue: 'onSelect(default)',
      note: 'Clear handler; selects the default value when omitted.',
    },
    { name: 'onSelect', type: '(value: string) => void', defaultValue: '—', note: 'Called with the chosen value.' }
  ])

  // Snippet write-backs derive from the field rows above; `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text.

  // The seed covers every override except the options array (the snippet reads
  // it from scope), so only options edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  </script>

<ShowcasePage
    {fields}
    title="ChipDropdown"
    {code}
    onReset={clearPlayground}
    scope={{ options: pg.options.value, labelFor }}
    stage={{ minWidth: CHIP_STAGE_MIN_WIDTH }}
    bind:stageWidth={pg.stageWidth}

    sync={{ tag: 'ChipDropdown' }}
    scopeRefresh={() => [pg.options.value]}
  >
    <ChipDropdown
      label={applied(pg.label) || labelFor(pg.options.value, pg.value.value)}
      activeValue={applied(pg.value) || undefined}
      defaultValue={demoDefaultValue}
      ariaLabel={applied(pg.ariaLabel) || DEFAULT_CHIP_DROPDOWN_ARIA_LABEL}
      variant={demoVariant}
      size={demoSize}
      {filterable}
      {disabled}
      {clearable}
      clearLabel={demoClearLabel}
      align={demoAlign}
      buttonClass={demoButtonClass}
      filterPlaceholder={demoFilterPlaceholder}
      filterLabel={demoFilterLabel}
      emptyText={demoEmptyText}
      {autoPlace}
      panelClass={demoPanelClass}
      options={pg.options.value}
      onSelect={next => (pg.value.value = next)} />
    <span class="text-sm text-slate-400">value: {pg.value.value}</span>
  </ShowcasePage>
