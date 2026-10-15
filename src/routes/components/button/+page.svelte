<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import CheckIcon from '$lib/icons/CheckIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import {
    buildButtonSnippet,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // The label edits the demo content through the children row's code dialog;
  // `clicks` is interaction state.
  let pgClicks = $state(0)
  let pgVariant = $state('secondary')
  let pgVariantOn = $state(false)
  let pgAccent = $state('cyan')
  let pgAccentOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgDisabled = $state<TriState>('no')
  let pgDisabledOn = $state(false)
  let pgPending = $state<TriState>('no')
  let pgPendingOn = $state(false)
  let pgIconOn = $state(false)
  let pgLabel = $state('Apply')
  let pgChildrenEnabled = $state(true)
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)
  let pgAriaLabel = $state('')
  let pgAriaLabelOn = $state(false)
  let pgAriaExpanded = $state<TriState>('')
  let pgAriaExpandedOn = $state(false)
  let pgAriaPressed = $state<TriState>('')
  let pgAriaPressedOn = $state(false)
  let pgTooltip = $state('')
  let pgTooltipOn = $state(false)
  let pgTooltipAlign = $state('center')
  let pgTooltipAlignOn = $state(false)
  let pgType = $state('button')
  let pgTypeOn = $state(false)
  let pgFocusRing = $state<TriState>('yes')
  let pgFocusRingOn = $state(true)
  let pgPreventFocusSteal = $state<TriState>('no')
  let pgPreventFocusStealOn = $state(false)

  const variants = ['primary', 'secondary', 'danger', 'outline', 'ghost']
  const accents = ['cyan', 'emerald', 'amber', 'violet', 'rose']
  const tooltipAligns = ['center', 'left', 'right']
  const types = ['button', 'submit', 'reset']

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoVariant = $derived(
    pgVariantOn
      ? ((pgVariant || undefined) as 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | undefined)
      : undefined,
  )
  const demoAccent = $derived(
    pgAccentOn
      ? ((pgAccent || undefined) as 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | undefined)
      : undefined,
  )
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const disabled = $derived(pgDisabledOn ? flagOn(pgDisabled) : undefined)
  const pending = $derived(pgPendingOn ? flagOn(pgPending) : undefined)
  const ariaExpanded = $derived(pgAriaExpandedOn ? flagOn(pgAriaExpanded) : undefined)
  const ariaPressed = $derived(pgAriaPressedOn ? flagOn(pgAriaPressed) : undefined)
  const demoTooltipAlign = $derived(
    pgTooltipAlignOn ? ((pgTooltipAlign || undefined) as 'center' | 'left' | 'right' | undefined) : undefined,
  )
  const demoType = $derived(pgTypeOn ? ((pgType || undefined) as 'button' | 'submit' | 'reset' | undefined) : undefined)
  const demoFocusRing = $derived(pgFocusRingOn ? (pgFocusRing === '' ? undefined : pgFocusRing === 'yes') : undefined)
  const demoPreventFocusSteal = $derived(pgPreventFocusStealOn ? flagOn(pgPreventFocusSteal) : undefined)
  const demoLabel = $derived(pgLabel || i18n.t('common.apply'))

  function clearPlayground() {
    pgClicks = 0
    pgVariant = 'secondary'
    pgVariantOn = false
    pgAccent = 'cyan'
    pgAccentOn = false
    pgSize = 'md'
    pgSizeOn = false
    pgDisabled = 'no'
    pgDisabledOn = false
    pgPending = 'no'
    pgPendingOn = false
    pgIconOn = false
    pgLabel = 'Apply'
    pgChildrenEnabled = true
    pgClassName = ''
    pgClassNameOn = false
    pgAriaLabel = ''
    pgAriaLabelOn = false
    pgAriaExpanded = ''
    pgAriaExpandedOn = false
    pgAriaPressed = ''
    pgAriaPressedOn = false
    pgTooltip = ''
    pgTooltipOn = false
    pgTooltipAlign = 'center'
    pgTooltipAlignOn = false
    pgType = 'button'
    pgTypeOn = false
    pgFocusRing = 'yes'
    pgFocusRingOn = true
    pgPreventFocusSteal = 'no'
    pgPreventFocusStealOn = false
  }

  const code = $derived.by(() =>
    buildButtonSnippet({
      label: pgLabel,
      childrenEnabled: pgChildrenEnabled,
      variant: pgVariant,
      variantOn: pgVariantOn,
      accent: pgAccent,
      accentOn: pgAccentOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      disabled: pgDisabled,
      disabledOn: pgDisabledOn,
      pending: pgPending,
      pendingOn: pgPendingOn,
      iconOn: pgIconOn,
      className: pgClassName,
      classNameOn: pgClassNameOn,
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      ariaExpanded: pgAriaExpanded,
      ariaExpandedOn: pgAriaExpandedOn,
      ariaPressed: pgAriaPressed,
      ariaPressedOn: pgAriaPressedOn,
      tooltip: pgTooltip,
      tooltipOn: pgTooltipOn,
      tooltipAlign: pgTooltipAlign,
      tooltipAlignOn: pgTooltipAlignOn,
      buttonType: pgType,
      buttonTypeOn: pgTypeOn,
      focusRing: pgFocusRing,
      focusRingOn: pgFocusRingOn,
      preventFocusSteal: pgPreventFocusSteal,
      preventFocusStealOn: pgPreventFocusStealOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ clicks: pgClicks, label: demoLabel }),
    sync: { tag: 'Button', getFields: () => syncFields },
  })

  const fields: SyncableFieldConfig[] = $derived([
    { name: 'accent', type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'", defaultValue: "'cyan'", note: 'Tint for primary and outline; the eye stages the customization.', editor: 'enum', options: accents.map(value => ({ value, label: value })), value: pgAccent, onChange: value => { pgAccent = value; pgAccentOn = true; }, placeholder: 'cyan', clearLabel: 'Clear accent', toggle: snippetToggle(pgAccentOn, enabled => (pgAccentOn = enabled)), sync: { kind: 'text' } },
    { name: 'ariaExpanded', type: 'boolean', defaultValue: '—', note: 'Disclosure state for popover triggers; the eye stages the customization.', editor: 'boolean', value: pgAriaExpanded, onChange: value => { pgAriaExpanded = value as TriState; pgAriaExpandedOn = true; }, toggle: snippetToggle(pgAriaExpandedOn, enabled => (pgAriaExpandedOn = enabled)), sync: { kind: 'tri' } },
    { name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for icon-only buttons; the eye stages the customization.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'ariaPressed', type: 'boolean', defaultValue: '—', note: 'Toggle state for pressable buttons; the eye stages the customization.', editor: 'boolean', value: pgAriaPressed, onChange: value => { pgAriaPressed = value as TriState; pgAriaPressedOn = true; }, toggle: snippetToggle(pgAriaPressedOn, enabled => (pgAriaPressedOn = enabled)), sync: { kind: 'tri' } },
    snippetField({
      name: 'children',
      note: 'Button label/content; committing applies it.',
      value: demoLabel,
      onChange: value => (pgLabel = value, pgChildrenEnabled = true),
      sync: { kind: 'script', attr: 'label', unsetAbsent: true, set: value => { if (pgChildrenEnabled) pgLabel = value } },
      toggle: snippetToggle(pgChildrenEnabled, enabled => (pgChildrenEnabled = enabled)),
    }),
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes appended to the button; the eye stages the customization.', editor: 'text', clearable: true, value: pgClassName, onChange: value => { pgClassName = value; pgClassNameOn = true; }, toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Native disabled + reduced opacity; the eye stages the customization.', editor: 'boolean', value: pgDisabled, onChange: value => { pgDisabled = value as TriState; pgDisabledOn = true; }, toggle: snippetToggle(pgDisabledOn, enabled => (pgDisabledOn = enabled)), sync: { kind: 'tri' } },
    { name: 'focusRing', type: 'boolean', defaultValue: 'true', note: 'Keyboard focus ring; disable only when focus stays visible another way; the eye stages the customization.', editor: 'boolean', value: pgFocusRing, onChange: value => { pgFocusRing = value as TriState; pgFocusRingOn = true; }, toggle: snippetToggle(pgFocusRingOn, enabled => (pgFocusRingOn = enabled)), sync: { kind: 'tri' } },
    snippetField({
      name: 'icon',
      note: 'Leading icon; icon-only when no children. Button sizes it from its own size, so the glyph stays bare.',
      value: '<CheckIcon />',
      // The glyph is fixed: only the bare line validates, so a commit changes
      // nothing and the eye is the row's real control.
      onChange: () => {},
      dialog: snippetDialog(
        (draft: string) => (draft.trim() === '<CheckIcon />' ? '' : null),
        'Invalid icon markup. Keep the bare <CheckIcon /> line; Button sizes it from its own size.',
      ),
      toggle: snippetToggle(pgIconOn, enabled => (pgIconOn = enabled)),
    }),
    { name: 'pending', type: 'boolean', defaultValue: 'false', note: 'Disabled state with a spinner slot; the eye stages the customization.', editor: 'boolean', value: pgPending, onChange: value => { pgPending = value as TriState; pgPendingOn = true; }, toggle: snippetToggle(pgPendingOn, enabled => (pgPendingOn = enabled)), sync: { kind: 'tri' } },
    { name: 'preventFocusSteal', type: 'boolean', defaultValue: 'false', note: 'Keeps focus on the current element when clicked; the eye stages the customization.', editor: 'boolean', value: pgPreventFocusSteal, onChange: value => { pgPreventFocusSteal = value as TriState; pgPreventFocusStealOn = true; }, toggle: snippetToggle(pgPreventFocusStealOn, enabled => (pgPreventFocusStealOn = enabled)), sync: { kind: 'tri' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Control scale; numbers are icon-scale pixels interpolated between the steps; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, placeholder: 'md', clearLabel: 'Clear size', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'custom', read: attrs => {
      const attr = attrs?.get('size')
      // Absent restores the default, like the builder omitting the line;
      // string and numeric shapes set, anything else is custom code the
      // playground leaves alone.
      if (!attr) return 'md'
      if (attr.kind === 'string') return attr.value
      if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
      return undefined
    } } },
    { name: 'tooltip', type: 'string?', defaultValue: '—', note: 'Wraps the button with the positioned Tooltip; the eye stages the customization.', editor: 'text', clearable: true, value: pgTooltip, onChange: value => { pgTooltip = value; pgTooltipOn = true; }, toggle: snippetToggle(pgTooltipOn, enabled => (pgTooltipOn = enabled)), sync: { kind: 'text' } },
    { name: 'tooltipAlign', type: "'center' | 'left' | 'right'", defaultValue: "'center'", note: 'Tooltip alignment; the eye stages the customization.', editor: 'enum', options: tooltipAligns.map(value => ({ value, label: value })), value: pgTooltipAlign, onChange: value => { pgTooltipAlign = value; pgTooltipAlignOn = true; }, placeholder: 'center', clearLabel: 'Clear tooltip align', toggle: snippetToggle(pgTooltipAlignOn, enabled => (pgTooltipAlignOn = enabled)), sync: { kind: 'text' } },
    { name: 'type', type: "'button' | 'submit' | 'reset'", defaultValue: "'button'", note: 'Native button type; the eye stages the customization.', editor: 'enum', options: types.map(value => ({ value, label: value })), value: pgType, onChange: value => { pgType = value; pgTypeOn = true; }, placeholder: 'button', clearLabel: 'Clear type', toggle: snippetToggle(pgTypeOn, enabled => (pgTypeOn = enabled)), sync: { kind: 'text' } },
    { name: 'variant', type: "'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'", defaultValue: "'secondary'", note: 'Visual treatment; the eye stages the customization.', editor: 'enum', options: variants.map(value => ({ value, label: value })), value: pgVariant, onChange: value => { pgVariant = value; pgVariantOn = true; }, placeholder: 'secondary', clearLabel: 'Clear variant', toggle: snippetToggle(pgVariantOn, enabled => (pgVariantOn = enabled)), sync: { kind: 'text' } },
    { name: 'buttonEl', type: 'HTMLButtonElement | null', defaultValue: 'null', note: 'Bindable native button element.' },
    { name: 'onClick', type: '(event: MouseEvent) => void', defaultValue: '—', note: 'Click handler.' },
    { name: 'onKeyDown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown handler.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // With an unset label the demo reads the localized default from scope, which
  // reseeding never refreshes; recompile the draft on those scope changes
  // without touching the editor text. Customized labels ride the seed instead.
  useScopeRefresh(preview, () => [demoLabel], () => pgLabel === '')
</script>

{#snippet demoButtonIcon()}
  <CheckIcon />
{/snippet}

<ShowcasePage
    {fields}
    title="Button"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{ clicks: pgClicks, label: demoLabel }}
>
    <Button
      variant={demoVariant}
      accent={demoAccent}
      size={demoSize}
      {disabled}
      {pending}
      icon={pgIconOn ? demoButtonIcon : undefined}
      className={pgClassNameOn && pgClassName ? pgClassName : undefined}
      ariaLabel={pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : undefined}
      ariaExpanded={ariaExpanded}
      ariaPressed={ariaPressed}
      tooltip={pgTooltipOn && pgTooltip ? pgTooltip : undefined}
      tooltipAlign={demoTooltipAlign}
      type={demoType}
      focusRing={demoFocusRing}
      preventFocusSteal={demoPreventFocusSteal}
      onClick={() => (pgClicks += 1)}>
      {#if pgChildrenEnabled}{demoLabel} ({pgClicks}){/if}
    </Button>
  </ShowcasePage>
