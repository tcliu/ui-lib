// Show-code source for the TextInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export interface TextInputSnippetState {
  ariaLabel: string
  ariaLabelOn: boolean
  // Bound value, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  value: string
  placeholder: string
  placeholderOn: boolean
  size: string
  sizeOn: boolean
  disabled: TriState
  disabledOn: boolean
  readonly: TriState
  readonlyOn: boolean
  required: TriState
  requiredOn: boolean
  id: string
  idOn: boolean
  inputClass: string
  inputClassOn: boolean
  className: string
  classNameOn: boolean
  clearable: TriState
  clearableOn: boolean
  clearLabel: string
  clearLabelOn: boolean
  clearPlacement: string
  clearPlacementOn: boolean
  defaultValue: string
  defaultValueOn: boolean
  autocomplete: string
  autocompleteOn: boolean
  inputmode: string
  inputmodeOn: boolean
  name: string
  nameOn: boolean
  type: string
  typeOn: boolean
  inputStyle: string
  inputStyleOn: boolean
  wrapperStyle: string
  wrapperStyleOn: boolean
  // Adornment text rendered through the leading/trailing snippets; edited
  // through FieldTable's snippet dialogs, like the options-json lists.
  leading: string
  trailing: string
  // Trailer text rendered outside the field through the trailer snippet.
  trailer: string
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

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// Element text for the adornment spans below.
function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: string, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`${indent}${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildTextInputSnippet({
  ariaLabel,
  ariaLabelOn,
  value,
  placeholder,
  placeholderOn,
  size,
  sizeOn,
  disabled,
  disabledOn,
  readonly,
  readonlyOn,
  required,
  requiredOn,
  id,
  idOn,
  inputClass,
  inputClassOn,
  className,
  classNameOn,
  clearable,
  clearableOn,
  clearLabel,
  clearLabelOn,
  clearPlacement,
  clearPlacementOn,
  defaultValue,
  defaultValueOn,
  autocomplete,
  autocompleteOn,
  inputmode,
  inputmodeOn,
  name,
  nameOn,
  type,
  typeOn,
  inputStyle,
  inputStyleOn,
  wrapperStyle,
  wrapperStyleOn,
  leading,
  trailing,
  trailer,
}: TextInputSnippetState): string {
  const attributeIndent = '    '
  const composedClassName = adornmentClassName(classNameOn ? className : '', leading, trailing)
  const hasSnippets = leading !== '' || trailing !== '' || trailer !== ''
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds;
    // escaping `<` stops a value from closing the surrounding script block.
    // `\u003c` is valid JSON, so the literal parses back to the original text.
    `  let value = $state(${JSON.stringify(value).replace(/</g, '\\u003c')})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    // A custom label renders as a literal while its eye is on; otherwise the
    // control reads the scope label, so the scope ref stands in.
    ...(ariaLabelOn && ariaLabel
      ? [`  <TextInput bind:value={value} ariaLabel="${escapeAttr(ariaLabel)}"`]
      : ['  <TextInput bind:value={value} ariaLabel={applyLabel}']),
    ...(placeholderOn && placeholder ? [`${attributeIndent}placeholder="${escapeAttr(placeholder)}"`] : []),
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, attributeIndent) : []),
    ...(disabledOn ? flagLine('disabled', disabled, attributeIndent, 'no') : []),
    ...(readonlyOn ? flagLine('readonly', readonly, attributeIndent, 'no') : []),
    ...(requiredOn ? flagLine('required', required, attributeIndent, 'no') : []),
    ...(idOn && id ? [`${attributeIndent}id="${escapeAttr(id)}"`] : []),
    ...(typeOn && type ? [`${attributeIndent}type="${escapeAttr(type)}"`] : []),
    ...(autocompleteOn && autocomplete ? [`${attributeIndent}autocomplete="${escapeAttr(autocomplete)}"`] : []),
    ...(inputmodeOn && inputmode ? [`${attributeIndent}inputmode="${escapeAttr(inputmode)}"`] : []),
    ...(nameOn && name ? [`${attributeIndent}name="${escapeAttr(name)}"`] : []),
    ...(inputClassOn && inputClass ? [`${attributeIndent}inputClass="${escapeAttr(inputClass)}"`] : []),
    ...(inputStyleOn && inputStyle ? [`${attributeIndent}inputStyle="${escapeAttr(inputStyle)}"`] : []),
    ...(wrapperStyleOn && wrapperStyle ? [`${attributeIndent}wrapperStyle="${escapeAttr(wrapperStyle)}"`] : []),
    ...(composedClassName ? [`${attributeIndent}className="${escapeAttr(composedClassName)}"`] : []),
    ...(clearableOn ? flagLine('clearable', clearable, attributeIndent, 'no') : []),
    ...(clearLabelOn && clearLabel ? [`${attributeIndent}clearLabel="${escapeAttr(clearLabel)}"`] : []),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(clearPlacementOn && clearPlacement && clearPlacement !== 'auto' ? [`${attributeIndent}clearPlacement="${escapeAttr(clearPlacement)}"`] : []),
    ...(defaultValueOn && defaultValue
      ? [`${attributeIndent}defaultValue="${escapeAttr(defaultValue)}"`]
      : []),
    ...(hasSnippets ? ['  >'] : ['  />']),
    ...(leading
      ? [
          '    {#snippet leading()}',
          `      <span class="${LEADING_SPAN}">${escapeText(leading)}</span>`,
          '    {/snippet}',
        ]
      : []),
    ...(trailing
      ? [
          '    {#snippet trailing()}',
          `      <span class="${TRAILING_SPAN}">${escapeText(trailing)}</span>`,
          '    {/snippet}',
        ]
      : []),
    ...(trailer
      ? [
          '    {#snippet trailer()}',
          `      <span class="${TRAILER_SPAN}">${escapeText(trailer)}</span>`,
          '    {/snippet}',
        ]
      : []),
    ...(hasSnippets ? ['  </TextInput>'] : []),
    `  <span class="text-sm text-slate-400">value: {value || '—'}</span>`,
    '</div>',
  ]
  return lines.join('\n')
}
