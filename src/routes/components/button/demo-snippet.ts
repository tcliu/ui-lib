// Show-code source for the Button demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.
import { escapeAttr } from '$lib/showcase/snippet-build'
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export interface ButtonSnippetState {
  label: string
  childrenEnabled: boolean
  variant: string
  variantOn: boolean
  accent: string
  accentOn: boolean
  size: string
  sizeOn: boolean
  disabled: TriState
  disabledOn: boolean
  pending: TriState
  pendingOn: boolean
  iconOn: boolean
  className: string
  classNameOn: boolean
  ariaControls: string
  ariaControlsOn: boolean
  ariaExpanded: TriState
  ariaExpandedOn: boolean
  ariaHaspopup: string
  ariaHaspopupOn: boolean
  ariaLabel: string
  ariaLabelOn: boolean
  ariaPressed: TriState
  ariaPressedOn: boolean
  tooltip: string
  tooltipOn: boolean
  tooltipAlign: string
  tooltipAlignOn: boolean
  buttonType: string
  buttonTypeOn: boolean
  focusRing: TriState
  focusRingOn: boolean
  preventFocusSteal: TriState
  preventFocusStealOn: boolean
}

// A JS string literal for the leading script. JSON.stringify handles quotes and
// backslashes; escaping every `<` as `\u003c` stops a label from closing the
// surrounding `<script>` block or being mistaken for the demo tag by the
// snippet scanner. `\u003c` is valid JSON, so the literal parses back to the
// original text.
function scriptString(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

// The popup-kind attribute: a kind renders as a string attribute, the boolean
// form as an expression.
function haspopupLine(name: string, value: string): string[] {
  if (value === 'true' || value === 'false') {
    return [`  ${name}={${value}}`]
  }
  return [`  ${name}="${escapeAttr(value)}"`]
}

export function buildButtonSnippet({
  label,
  childrenEnabled,
  variant,
  variantOn,
  accent,
  accentOn,
  size,
  sizeOn,
  disabled,
  disabledOn,
  pending,
  pendingOn,
  iconOn,
  className,
  classNameOn,
  ariaControls,
  ariaControlsOn,
  ariaExpanded,
  ariaExpandedOn,
  ariaHaspopup,
  ariaHaspopupOn,
  ariaLabel,
  ariaLabelOn,
  ariaPressed,
  ariaPressedOn,
  tooltip,
  tooltipOn,
  tooltipAlign,
  tooltipAlignOn,
  buttonType,
  buttonTypeOn,
  focusRing,
  focusRingOn,
  preventFocusSteal,
  preventFocusStealOn,
}: ButtonSnippetState): string {
  const lines = [
    // A custom label becomes a leading script-local; unset, the children read
    // the localized default from scope. `buildSource` drops the same-named
    // scope key once the snippet declares it, so the local value wins. The eye
    // toggle off means the children snippet is not applied at all.
    ...(childrenEnabled && label ? ['<script>', `  let label = $state(${scriptString(label)})`, '</script>'] : []),
    '<Button',
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(variantOn && variant && variant !== 'secondary' ? [`  variant="${variant}"`] : []),
    ...(accentOn && accent && accent !== 'cyan' ? [`  accent="${accent}"`] : []),
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size) : []),
    ...(disabledOn ? flagLine('disabled', disabled, 'no') : []),
    ...(pendingOn ? flagLine('pending', pending, 'no') : []),
    ...(classNameOn && className ? [`  className="${escapeAttr(className)}"`] : []),
    ...(ariaControlsOn && ariaControls ? [`  ariaControls="${escapeAttr(ariaControls)}"`] : []),
    ...(ariaExpandedOn ? flagLine('ariaExpanded', ariaExpanded) : []),
    ...(ariaHaspopupOn && ariaHaspopup ? haspopupLine('ariaHaspopup', ariaHaspopup) : []),
    ...(ariaLabelOn && ariaLabel ? [`  ariaLabel="${escapeAttr(ariaLabel)}"`] : []),
    ...(ariaPressedOn ? flagLine('ariaPressed', ariaPressed) : []),
    ...(tooltipOn && tooltip ? [`  tooltip="${escapeAttr(tooltip)}"`] : []),
    ...(tooltipAlignOn && tooltipAlign && tooltipAlign !== 'center' ? [`  tooltipAlign="${tooltipAlign}"`] : []),
    ...(buttonTypeOn && buttonType && buttonType !== 'button' ? [`  type="${buttonType}"`] : []),
    ...(focusRingOn ? flagLine('focusRing', focusRing, 'yes') : []),
    ...(preventFocusStealOn ? flagLine('preventFocusSteal', preventFocusSteal, 'no') : []),
    ...(childrenEnabled
      ? ['  onClick={() => (clicks += 1)}>{label} ({clicks})']
      : ['  onClick={() => (clicks += 1)}>']),
    ...(iconOn
      ? ['  {#snippet icon()}', '    <CheckIcon />', '  {/snippet}']
      : []),
    '</Button>',
  ]
  return lines.join('\n')
}
