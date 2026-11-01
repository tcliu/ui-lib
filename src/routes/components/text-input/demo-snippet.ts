// Show-code source for the TextInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.
import { boolAttrLine, enumAttrLine, escapeAttr, escapeText, sizeAttrLine, textAttrLine, type TriState } from '$showcase/playground/snippet-build'
import { applied, type Staged } from '$showcase/playground/staged'

export interface TextInputSnippetState {
  ariaLabel: Staged<string>
  // Bound value, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  value: Staged<string>
  placeholder: Staged<string>
  size: Staged<string>
  disabled: Staged<TriState>
  hideOutline: Staged<TriState>
  readonly: Staged<TriState>
  required: Staged<TriState>
  id: Staged<string>
  inputClass: Staged<string>
  variant: Staged<string>
  className: Staged<string>
  clearable: Staged<TriState>
  clearLabel: Staged<string>
  clearPlacement: Staged<string>
  defaultValue: Staged<string>
  autocomplete: Staged<string>
  inputmode: Staged<string>
  name: Staged<string>
  type: Staged<string>
  inputStyle: Staged<string>
  wrapperStyle: Staged<string>
  // Adornment text rendered through the leading/trailing snippets; edited
  // through FieldTable's snippet dialogs, like the options-json lists.
  leading: Staged<string>
  trailing: Staged<string>
  // Trailer text rendered outside the field through the trailer snippet.
  trailer: Staged<string>
}

// Adornment chrome shared by the demo and the seed below, so static demo,
// Show-code, and live render stay identical.
export const ADORNMENT_SPAN = 'pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-slate-500'
export const LEADING_SPAN = `${ADORNMENT_SPAN} left-3`
export const TRAILING_SPAN = `${ADORNMENT_SPAN} right-3`
// The trailer sits outside the field in the flex row, so it is only styled —
// no absolute placement and no input gutter.
export const TRAILER_SPAN = 'shrink-0 text-sm text-slate-500'
export const LEADING_GUTTER = 'pl-8'
export const TRAILING_GUTTER = 'pr-8'

// Gutter classes clearing the adornments, composed ahead of the caller's own
// classes so both render paths agree.
export function adornmentClassName(className: string, leading: string, trailing: string): string {
  return [leading ? LEADING_GUTTER : '', trailing ? TRAILING_GUTTER : '', className].filter(Boolean).join(' ')
}

// Element text for the adornment spans below.

export function buildTextInputSnippet(state: TextInputSnippetState): string {
  const {
    ariaLabel,
    value,
    placeholder,
    size,
    disabled,
    hideOutline,
    readonly,
    required,
    id,
    inputClass,
    variant,
    className,
    clearable,
    clearLabel,
    clearPlacement,
    defaultValue,
    autocomplete,
    inputmode,
    name,
    type,
    inputStyle,
    wrapperStyle,
    leading,
    trailing,
    trailer,
  } = state
  const attributeIndent = '    '
  const appliedLeading = applied(leading) ?? ''
  const appliedTrailing = applied(trailing) ?? ''
  const appliedTrailer = applied(trailer) ?? ''
  const composedClassName = adornmentClassName(applied(className) ?? '', appliedLeading, appliedTrailing)
  const hasSnippets = appliedLeading !== '' || appliedTrailing !== '' || appliedTrailer !== ''
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds;
    // escaping `<` stops a value from closing the surrounding script block.
    // `\u003c` is valid JSON, so the literal parses back to the original text.
    `  let value = $state(${JSON.stringify(value.value).replace(/</g, '\\u003c')})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    // A custom label renders as a literal while its eye is on; otherwise the
    // control reads the scope label, so the scope ref stands in.
    ...(ariaLabel.on && ariaLabel.value
      ? [`  <TextInput bind:value={value} ariaLabel="${escapeAttr(ariaLabel.value)}"`]
      : ['  <TextInput bind:value={value} ariaLabel={applyLabel}']),
    ...textAttrLine('placeholder', placeholder, attributeIndent),
    ...sizeAttrLine(size, attributeIndent),
    ...boolAttrLine('disabled', disabled, 'no', attributeIndent),
    ...boolAttrLine('hideOutline', hideOutline, 'no', attributeIndent),
    ...boolAttrLine('readonly', readonly, 'no', attributeIndent),
    ...boolAttrLine('required', required, 'no', attributeIndent),
    ...textAttrLine('id', id, attributeIndent),
    ...textAttrLine('type', type, attributeIndent),
    ...textAttrLine('autocomplete', autocomplete, attributeIndent),
    ...textAttrLine('inputmode', inputmode, attributeIndent),
    ...textAttrLine('name', name, attributeIndent),
    ...textAttrLine('inputClass', inputClass, attributeIndent),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...enumAttrLine('variant', variant, 'bordered', attributeIndent),
    ...textAttrLine('inputStyle', inputStyle, attributeIndent),
    ...textAttrLine('wrapperStyle', wrapperStyle, attributeIndent),
    ...(composedClassName ? [`${attributeIndent}className="${escapeAttr(composedClassName)}"`] : []),
    ...boolAttrLine('clearable', clearable, 'no', attributeIndent),
    ...textAttrLine('clearLabel', clearLabel, attributeIndent),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...enumAttrLine('clearPlacement', clearPlacement, 'auto', attributeIndent),
    ...textAttrLine('defaultValue', defaultValue, attributeIndent),
    ...(hasSnippets ? ['  >'] : ['  />']),
    ...(appliedLeading
      ? [
          '    {#snippet leading()}',
          `      <span class="${LEADING_SPAN}">${escapeText(appliedLeading)}</span>`,
          '    {/snippet}',
        ]
      : []),
    ...(appliedTrailing
      ? [
          '    {#snippet trailing()}',
          `      <span class="${TRAILING_SPAN}">${escapeText(appliedTrailing)}</span>`,
          '    {/snippet}',
        ]
      : []),
    ...(appliedTrailer
      ? [
          '    {#snippet trailer()}',
          `      <span class="${TRAILER_SPAN}">${escapeText(appliedTrailer)}</span>`,
          '    {/snippet}',
        ]
      : []),
    ...(hasSnippets ? ['  </TextInput>'] : []),
    `  <span class="text-sm text-slate-400">value: {value || '—'}</span>`,
    '</div>',
  ]
  return lines.join('\n')
}
