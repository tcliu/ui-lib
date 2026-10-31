<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import CheckIcon from '$lib/icons/CheckIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField, snippetDialog, snippetField } from '$showcase/snippet-field'
  import { applied, appliedFlag, eye, eyeFlag, eyeToggle, stage, staged } from '$showcase/staged'
  import { type TriState } from '$showcase/snippet-build'
  import { buildButtonSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // The label edits the demo content through the children row's code dialog;
  // `clicks` is interaction state.
  const INITIAL = {
    clicks: 0,
    variant: staged('secondary'),
    accent: staged('cyan'),
    size: staged('md'),
    disabled: staged('no' as TriState),
    pending: staged('no' as TriState),
    // The glyph is fixed: the eye is the row's control, so the pair carries
    // only the markup that seeds the row.
    icon: staged('<CheckIcon />'),
    // The label is the children content, so its eye also omits the snippet.
    label: staged('Apply', true),
    className: staged(''),
    ariaControls: staged(''),
    ariaExpanded: staged('' as TriState),
    ariaHaspopup: staged(''),
    ariaLabel: staged(''),
    ariaPressed: staged('' as TriState),
    tooltip: staged(''),
    tooltipAlign: staged('center'),
    type: staged('button'),
    focusRing: staged('yes' as TriState),
    preventFocusSteal: staged('no' as TriState),
  }
  let pg = $state(structuredClone(INITIAL))

  const variants = ['primary', 'secondary', 'danger', 'outline', 'ghost']
  const accents = ['cyan', 'emerald', 'amber', 'violet', 'rose']
  const tooltipAligns = ['center', 'left', 'right']
  const types = ['button', 'submit', 'reset']
  // The ARIA popup kinds, plus the boolean form (`aria-haspopup="true"`).
  const ariaHaspopupOptions = ['menu', 'listbox', 'tree', 'grid', 'dialog', 'true', 'false'].map(value => ({
    value,
    label: value,
  }))

  const demoVariant = $derived(
    (applied(pg.variant) || undefined) as 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | undefined,
  )
  const demoAccent = $derived(
    (applied(pg.accent) || undefined) as 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | undefined,
  )
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const disabled = $derived(appliedFlag(pg.disabled))
  const pending = $derived(appliedFlag(pg.pending))
  const ariaExpanded = $derived(appliedFlag(pg.ariaExpanded))
  const ariaPressed = $derived(appliedFlag(pg.ariaPressed))
  // The popup kind is a token or the boolean form; the editor carries both as
  // text, so the boolean spellings map back to real booleans.
  const demoAriaHaspopup = $derived.by(() => {
    const value = applied(pg.ariaHaspopup)
    if (!value) return undefined
    if (value === 'true') return true
    if (value === 'false') return false
    return value as 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  })
  const demoTooltipAlign = $derived(
    (applied(pg.tooltipAlign) || undefined) as 'center' | 'left' | 'right' | undefined,
  )
  const demoType = $derived((applied(pg.type) || undefined) as 'button' | 'submit' | 'reset' | undefined)
  const demoFocusRing = $derived(appliedFlag(pg.focusRing))
  const demoPreventFocusSteal = $derived(appliedFlag(pg.preventFocusSteal))
  const demoLabel = $derived(pg.label.value || i18n.t('common.apply'))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildButtonSnippet({
      label: pg.label,
      variant: pg.variant,
      accent: pg.accent,
      size: pg.size,
      disabled: pg.disabled,
      pending: pg.pending,
      icon: pg.icon,
      className: pg.className,
      ariaControls: pg.ariaControls,
      ariaExpanded: pg.ariaExpanded,
      ariaHaspopup: pg.ariaHaspopup,
      ariaLabel: pg.ariaLabel,
      ariaPressed: pg.ariaPressed,
      tooltip: pg.tooltip,
      tooltipAlign: pg.tooltipAlign,
      buttonType: pg.type,
      focusRing: pg.focusRing,
      preventFocusSteal: pg.preventFocusSteal,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'accent', type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'", defaultValue: "'cyan'", note: 'Tint for primary and outline.', options: accents.map(value => ({ value, label: value })), placeholder: 'cyan', clearLabel: 'Clear accent', ...eye(pg.accent) }),
    textField({ name: 'ariaControls', type: 'string?', defaultValue: '—', note: 'Id of the element the button controls (a popup trigger’s panel).', clearable: true, ...eye(pg.ariaControls) }),
    boolField({ name: 'ariaExpanded', defaultValue: '—', note: 'Disclosure state for popover triggers.', ...eyeFlag(pg.ariaExpanded) }),
    enumField({ name: 'ariaHaspopup', type: "'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | boolean", defaultValue: '—', note: 'Kind of popup the button opens; true/false set the boolean form.', options: ariaHaspopupOptions, clearLabel: 'Clear aria haspopup', ...eye(pg.ariaHaspopup) }),
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for icon-only buttons.', clearable: true, ...eye(pg.ariaLabel) }),
    boolField({ name: 'ariaPressed', defaultValue: '—', note: 'Toggle state for pressable buttons.', ...eyeFlag(pg.ariaPressed) }),
    snippetField({
      name: 'children',
      note: 'Button label/content; committing applies it.',
      value: demoLabel,
      onChange: value => stage(pg.label, value),
      sync: { kind: 'script', attr: 'label', unsetAbsent: true, set: value => { if (pg.label.on) pg.label.value = value } },
      toggle: eyeToggle(pg.label),
    }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes appended to the button.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Native disabled + reduced opacity.', ...eyeFlag(pg.disabled) }),
    boolField({ name: 'focusRing', defaultValue: 'true', note: 'Keyboard focus ring; disable only when focus stays visible another way.', ...eyeFlag(pg.focusRing) }),
    snippetField({
      name: 'icon',
      note: 'Leading icon; icon-only when no children. Button sizes it from its own size, so the glyph stays bare.',
      value: pg.icon.value,
      // The glyph is fixed: only the bare line validates, so a commit changes
      // nothing and the eye is the row's real control.
      onChange: () => {},
      dialog: snippetDialog(
        (draft: string) => (draft.trim() === '<CheckIcon />' ? '' : null),
        'Invalid icon markup. Keep the bare <CheckIcon /> line; Button sizes it from its own size.',
      ),
      toggle: eyeToggle(pg.icon),
    }),
    boolField({ name: 'pending', defaultValue: 'false', note: 'Disabled state with a spinner slot.', ...eyeFlag(pg.pending) }),
    boolField({ name: 'preventFocusSteal', defaultValue: 'false', note: 'Keeps focus on the current element when clicked.', ...eyeFlag(pg.preventFocusSteal) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    textField({ name: 'tooltip', type: 'string?', defaultValue: '—', note: 'Wraps the button with the positioned Tooltip.', clearable: true, ...eye(pg.tooltip) }),
    enumField({ name: 'tooltipAlign', type: "'center' | 'left' | 'right'", defaultValue: "'center'", note: 'Tooltip alignment.', options: tooltipAligns.map(value => ({ value, label: value })), placeholder: 'center', clearLabel: 'Clear tooltip align', ...eye(pg.tooltipAlign) }),
    enumField({ name: 'type', type: "'button' | 'submit' | 'reset'", defaultValue: "'button'", note: 'Native button type.', options: types.map(value => ({ value, label: value })), placeholder: 'button', clearLabel: 'Clear type', ...eye(pg.type) }),
    enumField({ name: 'variant', type: "'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'", defaultValue: "'secondary'", note: 'Visual treatment.', options: variants.map(value => ({ value, label: value })), placeholder: 'secondary', clearLabel: 'Clear variant', ...eye(pg.variant) }),
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
    scopeRefreshWhen={() => pg.label.value === ''}
  >
    <Button
      variant={demoVariant}
      accent={demoAccent}
      size={demoSize}
      {disabled}
      {pending}
      icon={applied(pg.icon) ? demoButtonIcon : undefined}
      className={applied(pg.className) || undefined}
      ariaLabel={applied(pg.ariaLabel) || undefined}
      ariaControls={applied(pg.ariaControls) || undefined}
      ariaExpanded={ariaExpanded}
      ariaHaspopup={demoAriaHaspopup}
      ariaPressed={ariaPressed}
      tooltip={applied(pg.tooltip) || undefined}
      tooltipAlign={demoTooltipAlign}
      type={demoType}
      focusRing={demoFocusRing}
      preventFocusSteal={demoPreventFocusSteal}
      onClick={() => (pg.clicks += 1)}
      children={pg.label.on ? demoChildren : undefined} />
  </ShowcasePage>
