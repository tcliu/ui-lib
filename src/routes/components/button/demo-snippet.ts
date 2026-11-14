// Show-code source for the Button demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.
import { boolAttrLine, enumAttrLine, popupAttrLine, sizeAttrLine, textAttrLine, type TriState } from '#showcase/playground/snippet-build.js'
import type { Staged } from '#showcase/playground/staged.js'

export interface ButtonSnippetState {
  // The children content (the label) and whether the children snippet applies.
  label: Staged<string>
  variant: Staged<string>
  accent: Staged<string>
  size: Staged<string>
  disabled: Staged<TriState>
  pending: Staged<TriState>
  // The leading glyph and whether the icon snippet applies.
  icon: Staged<string>
  className: Staged<string>
  ariaControls: Staged<string>
  ariaExpanded: Staged<TriState>
  ariaHaspopup: Staged<string>
  ariaLabel: Staged<string>
  ariaPressed: Staged<TriState>
  tooltip: Staged<string>
  tooltipAlign: Staged<string>
  buttonType: Staged<string>
  focusRing: Staged<TriState>
  form: Staged<string>
  preventFocusSteal: Staged<TriState>
}

// A JS string literal for the leading script. JSON.stringify handles quotes and
// backslashes; escaping every `<` as `\u003c` stops a label from closing the
// surrounding `<script>` block or being mistaken for the demo tag by the
// snippet scanner. `\u003c` is valid JSON, so the literal parses back to the
// original text.
function scriptString(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function buildButtonSnippet({
  label,
  variant,
  accent,
  size,
  disabled,
  pending,
  icon,
  className,
  ariaControls,
  ariaExpanded,
  ariaHaspopup,
  ariaLabel,
  ariaPressed,
  tooltip,
  tooltipAlign,
  buttonType,
  focusRing,
  form,
  preventFocusSteal,
}: ButtonSnippetState): string {
  const lines = [
    // A custom label becomes a leading script-local; unset, the children read
    // the localized default from scope. `buildSource` drops the same-named
    // scope key once the snippet declares it, so the local value wins. The eye
    // toggle off means the children snippet is not applied at all.
    ...(label.on && label.value ? ['<script>', `  let label = $state(${scriptString(label.value)})`, '</script>'] : []),
    '<Button',
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...enumAttrLine('variant', variant, 'secondary'),
    ...enumAttrLine('accent', accent, 'cyan'),
    ...sizeAttrLine(size),
    ...boolAttrLine('disabled', disabled, 'no'),
    ...boolAttrLine('pending', pending, 'no'),
    ...textAttrLine('className', className),
    ...textAttrLine('ariaControls', ariaControls),
    ...boolAttrLine('ariaExpanded', ariaExpanded),
    ...popupAttrLine('ariaHaspopup', ariaHaspopup),
    ...textAttrLine('ariaLabel', ariaLabel),
    ...boolAttrLine('ariaPressed', ariaPressed),
    ...textAttrLine('tooltip', tooltip),
    ...enumAttrLine('tooltipAlign', tooltipAlign, 'center'),
    ...enumAttrLine('type', buttonType, 'button'),
    ...boolAttrLine('focusRing', focusRing, 'yes'),
    ...textAttrLine('form', form),
    ...boolAttrLine('preventFocusSteal', preventFocusSteal, 'no'),
    ...(label.on
      ? ['  onClick={() => (clicks += 1)}>{label} ({clicks})']
      : ['  onClick={() => (clicks += 1)}>']),
    ...(icon.on
      ? ['  {#snippet icon()}', '    <CheckIcon />', '  {/snippet}']
      : []),
    '</Button>',
  ]
  return lines.join('\n')
}
