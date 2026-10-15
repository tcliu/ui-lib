<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import Button from '$lib/components/Button.svelte'
  import CheckIcon from '$lib/icons/CheckIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField, snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
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

  
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'accent', type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'", defaultValue: "'cyan'", note: 'Tint for primary and outline.', options: accents.map(value => ({ value, label: value })), value: pgAccent, onChange: v => (pgAccent = v), placeholder: 'cyan', clearLabel: 'Clear accent', enabled: pgAccentOn, setEnabled: v => (pgAccentOn = v) }),
    boolField({ name: 'ariaExpanded', defaultValue: '—', note: 'Disclosure state for popover triggers.', value: pgAriaExpanded, onChange: v => (pgAriaExpanded = v as TriState), enabled: pgAriaExpandedOn, setEnabled: v => (pgAriaExpandedOn = v) }),
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for icon-only buttons.', value: pgAriaLabel, onChange: v => (pgAriaLabel = v), clearable: true, enabled: pgAriaLabelOn, setEnabled: v => (pgAriaLabelOn = v) }),
    boolField({ name: 'ariaPressed', defaultValue: '—', note: 'Toggle state for pressable buttons.', value: pgAriaPressed, onChange: v => (pgAriaPressed = v as TriState), enabled: pgAriaPressedOn, setEnabled: v => (pgAriaPressedOn = v) }),
    snippetField({
      name: 'children',
      note: 'Button label/content; committing applies it.',
      value: demoLabel,
      onChange: value => (pgLabel = value, pgChildrenEnabled = true),
      sync: { kind: 'script', attr: 'label', unsetAbsent: true, set: value => { if (pgChildrenEnabled) pgLabel = value } },
      toggle: snippetToggle(pgChildrenEnabled, enabled => (pgChildrenEnabled = enabled)),
    }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes appended to the button.', value: pgClassName, onChange: v => (pgClassName = v), editorDefaultValue: '', clearable: true, enabled: pgClassNameOn, setEnabled: v => (pgClassNameOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Native disabled + reduced opacity.', value: pgDisabled, onChange: v => (pgDisabled = v as TriState), enabled: pgDisabledOn, setEnabled: v => (pgDisabledOn = v) }),
    boolField({ name: 'focusRing', defaultValue: 'true', note: 'Keyboard focus ring; disable only when focus stays visible another way.', value: pgFocusRing, onChange: v => (pgFocusRing = v as TriState), enabled: pgFocusRingOn, setEnabled: v => (pgFocusRingOn = v) }),
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
    boolField({ name: 'pending', defaultValue: 'false', note: 'Disabled state with a spinner slot.', value: pgPending, onChange: v => (pgPending = v as TriState), enabled: pgPendingOn, setEnabled: v => (pgPendingOn = v) }),
    boolField({ name: 'preventFocusSteal', defaultValue: 'false', note: 'Keeps focus on the current element when clicked.', value: pgPreventFocusSteal, onChange: v => (pgPreventFocusSteal = v as TriState), enabled: pgPreventFocusStealOn, setEnabled: v => (pgPreventFocusStealOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    textField({ name: 'tooltip', type: 'string?', defaultValue: '—', note: 'Wraps the button with the positioned Tooltip.', value: pgTooltip, onChange: v => (pgTooltip = v), clearable: true, enabled: pgTooltipOn, setEnabled: v => (pgTooltipOn = v) }),
    enumField({ name: 'tooltipAlign', type: "'center' | 'left' | 'right'", defaultValue: "'center'", note: 'Tooltip alignment.', options: tooltipAligns.map(value => ({ value, label: value })), value: pgTooltipAlign, onChange: v => (pgTooltipAlign = v), placeholder: 'center', clearLabel: 'Clear tooltip align', enabled: pgTooltipAlignOn, setEnabled: v => (pgTooltipAlignOn = v) }),
    enumField({ name: 'type', type: "'button' | 'submit' | 'reset'", defaultValue: "'button'", note: 'Native button type.', options: types.map(value => ({ value, label: value })), value: pgType, onChange: v => (pgType = v), placeholder: 'button', clearLabel: 'Clear type', enabled: pgTypeOn, setEnabled: v => (pgTypeOn = v) }),
    enumField({ name: 'variant', type: "'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'", defaultValue: "'secondary'", note: 'Visual treatment.', options: variants.map(value => ({ value, label: value })), value: pgVariant, onChange: v => (pgVariant = v), placeholder: 'secondary', clearLabel: 'Clear variant', enabled: pgVariantOn, setEnabled: v => (pgVariantOn = v) }),
    { name: 'buttonEl', type: 'HTMLButtonElement | null', defaultValue: 'null', note: 'Bindable native button element.' },
    { name: 'onClick', type: '(event: MouseEvent) => void', defaultValue: '—', note: 'Click handler.' },
    { name: 'onKeyDown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown handler.' },
  ])


  // With an unset label the demo reads the localized default from scope, which
  // reseeding never refreshes; recompile the draft on those scope changes
  // without touching the editor text. Customized labels ride the seed instead.
  </script>

{#snippet demoButtonIcon()}
  <CheckIcon />
{/snippet}

<ShowcasePage
    {fields}
    title="Button"
    {code}
    onReset={clearPlayground}
    scope={{ clicks: pgClicks, label: demoLabel }}

    sync={{ tag: 'Button' }}
    scopeRefresh={() => [demoLabel]}
    scopeRefreshWhen={() => pgLabel === ''}
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
