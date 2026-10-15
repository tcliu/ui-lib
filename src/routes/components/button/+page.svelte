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
  const INITIAL = {
    clicks: 0,
    variant: 'secondary',
    variantOn: false,
    accent: 'cyan',
    accentOn: false,
    size: 'md',
    sizeOn: false,
    disabled: 'no' as TriState,
    disabledOn: false,
    pending: 'no' as TriState,
    pendingOn: false,
    iconOn: false,
    label: 'Apply',
    childrenEnabled: true,
    className: '',
    classNameOn: false,
    ariaLabel: '',
    ariaLabelOn: false,
    ariaExpanded: '' as TriState,
    ariaExpandedOn: false,
    ariaPressed: '' as TriState,
    ariaPressedOn: false,
    tooltip: '',
    tooltipOn: false,
    tooltipAlign: 'center',
    tooltipAlignOn: false,
    type: 'button',
    typeOn: false,
    focusRing: 'yes' as TriState,
    focusRingOn: true,
    preventFocusSteal: 'no' as TriState,
    preventFocusStealOn: false,
  }
  let pg = $state(structuredClone(INITIAL))

  const variants = ['primary', 'secondary', 'danger', 'outline', 'ghost']
  const accents = ['cyan', 'emerald', 'amber', 'violet', 'rose']
  const tooltipAligns = ['center', 'left', 'right']
  const types = ['button', 'submit', 'reset']

  const demoVariant = $derived(
    pg.variantOn
      ? ((pg.variant || undefined) as 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | undefined)
      : undefined,
  )
  const demoAccent = $derived(
    pg.accentOn
      ? ((pg.accent || undefined) as 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | undefined)
      : undefined,
  )
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const disabled = $derived(pg.disabledOn ? flagOn(pg.disabled) : undefined)
  const pending = $derived(pg.pendingOn ? flagOn(pg.pending) : undefined)
  const ariaExpanded = $derived(pg.ariaExpandedOn ? flagOn(pg.ariaExpanded) : undefined)
  const ariaPressed = $derived(pg.ariaPressedOn ? flagOn(pg.ariaPressed) : undefined)
  const demoTooltipAlign = $derived(
    pg.tooltipAlignOn ? ((pg.tooltipAlign || undefined) as 'center' | 'left' | 'right' | undefined) : undefined,
  )
  const demoType = $derived(pg.typeOn ? ((pg.type || undefined) as 'button' | 'submit' | 'reset' | undefined) : undefined)
  const demoFocusRing = $derived(pg.focusRingOn ? (pg.focusRing === '' ? undefined : pg.focusRing === 'yes') : undefined)
  const demoPreventFocusSteal = $derived(pg.preventFocusStealOn ? flagOn(pg.preventFocusSteal) : undefined)
  const demoLabel = $derived(pg.label || i18n.t('common.apply'))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildButtonSnippet({
      label: pg.label,
      childrenEnabled: pg.childrenEnabled,
      variant: pg.variant,
      variantOn: pg.variantOn,
      accent: pg.accent,
      accentOn: pg.accentOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      disabled: pg.disabled,
      disabledOn: pg.disabledOn,
      pending: pg.pending,
      pendingOn: pg.pendingOn,
      iconOn: pg.iconOn,
      className: pg.className,
      classNameOn: pg.classNameOn,
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      ariaExpanded: pg.ariaExpanded,
      ariaExpandedOn: pg.ariaExpandedOn,
      ariaPressed: pg.ariaPressed,
      ariaPressedOn: pg.ariaPressedOn,
      tooltip: pg.tooltip,
      tooltipOn: pg.tooltipOn,
      tooltipAlign: pg.tooltipAlign,
      tooltipAlignOn: pg.tooltipAlignOn,
      buttonType: pg.type,
      buttonTypeOn: pg.typeOn,
      focusRing: pg.focusRing,
      focusRingOn: pg.focusRingOn,
      preventFocusSteal: pg.preventFocusSteal,
      preventFocusStealOn: pg.preventFocusStealOn,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'accent', type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'", defaultValue: "'cyan'", note: 'Tint for primary and outline.', options: accents.map(value => ({ value, label: value })), value: pg.accent, onChange: v => (pg.accent = v), placeholder: 'cyan', clearLabel: 'Clear accent', enabled: pg.accentOn, setEnabled: v => (pg.accentOn = v) }),
    boolField({ name: 'ariaExpanded', defaultValue: '—', note: 'Disclosure state for popover triggers.', value: pg.ariaExpanded, onChange: v => (pg.ariaExpanded = v as TriState), enabled: pg.ariaExpandedOn, setEnabled: v => (pg.ariaExpandedOn = v) }),
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for icon-only buttons.', value: pg.ariaLabel, onChange: v => (pg.ariaLabel = v), clearable: true, enabled: pg.ariaLabelOn, setEnabled: v => (pg.ariaLabelOn = v) }),
    boolField({ name: 'ariaPressed', defaultValue: '—', note: 'Toggle state for pressable buttons.', value: pg.ariaPressed, onChange: v => (pg.ariaPressed = v as TriState), enabled: pg.ariaPressedOn, setEnabled: v => (pg.ariaPressedOn = v) }),
    snippetField({
      name: 'children',
      note: 'Button label/content; committing applies it.',
      value: demoLabel,
      onChange: value => (pg.label = value, pg.childrenEnabled = true),
      sync: { kind: 'script', attr: 'label', unsetAbsent: true, set: value => { if (pg.childrenEnabled) pg.label = value } },
      toggle: snippetToggle(pg.childrenEnabled, enabled => (pg.childrenEnabled = enabled)),
    }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes appended to the button.', value: pg.className, onChange: v => (pg.className = v), editorDefaultValue: '', clearable: true, enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Native disabled + reduced opacity.', value: pg.disabled, onChange: v => (pg.disabled = v as TriState), enabled: pg.disabledOn, setEnabled: v => (pg.disabledOn = v) }),
    boolField({ name: 'focusRing', defaultValue: 'true', note: 'Keyboard focus ring; disable only when focus stays visible another way.', value: pg.focusRing, onChange: v => (pg.focusRing = v as TriState), enabled: pg.focusRingOn, setEnabled: v => (pg.focusRingOn = v) }),
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
      toggle: snippetToggle(pg.iconOn, enabled => (pg.iconOn = enabled)),
    }),
    boolField({ name: 'pending', defaultValue: 'false', note: 'Disabled state with a spinner slot.', value: pg.pending, onChange: v => (pg.pending = v as TriState), enabled: pg.pendingOn, setEnabled: v => (pg.pendingOn = v) }),
    boolField({ name: 'preventFocusSteal', defaultValue: 'false', note: 'Keeps focus on the current element when clicked.', value: pg.preventFocusSteal, onChange: v => (pg.preventFocusSteal = v as TriState), enabled: pg.preventFocusStealOn, setEnabled: v => (pg.preventFocusStealOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    textField({ name: 'tooltip', type: 'string?', defaultValue: '—', note: 'Wraps the button with the positioned Tooltip.', value: pg.tooltip, onChange: v => (pg.tooltip = v), clearable: true, enabled: pg.tooltipOn, setEnabled: v => (pg.tooltipOn = v) }),
    enumField({ name: 'tooltipAlign', type: "'center' | 'left' | 'right'", defaultValue: "'center'", note: 'Tooltip alignment.', options: tooltipAligns.map(value => ({ value, label: value })), value: pg.tooltipAlign, onChange: v => (pg.tooltipAlign = v), placeholder: 'center', clearLabel: 'Clear tooltip align', enabled: pg.tooltipAlignOn, setEnabled: v => (pg.tooltipAlignOn = v) }),
    enumField({ name: 'type', type: "'button' | 'submit' | 'reset'", defaultValue: "'button'", note: 'Native button type.', options: types.map(value => ({ value, label: value })), value: pg.type, onChange: v => (pg.type = v), placeholder: 'button', clearLabel: 'Clear type', enabled: pg.typeOn, setEnabled: v => (pg.typeOn = v) }),
    enumField({ name: 'variant', type: "'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'", defaultValue: "'secondary'", note: 'Visual treatment.', options: variants.map(value => ({ value, label: value })), value: pg.variant, onChange: v => (pg.variant = v), placeholder: 'secondary', clearLabel: 'Clear variant', enabled: pg.variantOn, setEnabled: v => (pg.variantOn = v) }),
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

{#snippet demoChildren()}
  {demoLabel} ({pg.clicks})
{/snippet}

<ShowcasePage
    {fields}
    title="Button"
    {code}
    onReset={clearPlayground}
    scope={{ clicks: pg.clicks, label: demoLabel }}

    sync={{ tag: 'Button' }}
    scopeRefresh={() => [demoLabel]}
    scopeRefreshWhen={() => pg.label === ''}
  >
    <Button
      variant={demoVariant}
      accent={demoAccent}
      size={demoSize}
      {disabled}
      {pending}
      icon={pg.iconOn ? demoButtonIcon : undefined}
      className={pg.classNameOn && pg.className ? pg.className : undefined}
      ariaLabel={pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : undefined}
      ariaExpanded={ariaExpanded}
      ariaPressed={ariaPressed}
      tooltip={pg.tooltipOn && pg.tooltip ? pg.tooltip : undefined}
      tooltipAlign={demoTooltipAlign}
      type={demoType}
      focusRing={demoFocusRing}
      preventFocusSteal={demoPreventFocusSteal}
      onClick={() => (pg.clicks += 1)}
      children={pg.childrenEnabled ? demoChildren : undefined} />
  </ShowcasePage>
