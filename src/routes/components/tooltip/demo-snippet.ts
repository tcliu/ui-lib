// Show-code source for the Tooltip demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface TooltipSnippetState {
  label: string
  align: string
  alignOn: boolean
  className: string
  classNameOn: boolean
}

export const STYLED_CLASS = 'border-cyan-500/40 text-cyan-200'

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// A JS string literal for the leading script. JSON.stringify handles quotes and
// backslashes; escaping every `<` as `\u003c` stops a label from closing the
// surrounding `<script>` block. `\u003c` is valid JSON, so the literal parses
// back to the original text.
function scriptString(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function buildTooltipSnippet({ label, align, alignOn, className, classNameOn }: TooltipSnippetState): string {
  const alignAttr = alignOn && align && align !== 'center' ? ` align="${align}"` : ''
  const classAttr = classNameOn && className ? ` className="${className}"` : ''
  // A custom label becomes a leading script-local; unset, the children read
  // the localized default from scope. `buildSource` drops the same-named
  // scope key once the snippet declares it, so the local value wins.
  const text = label ? '{label}' : '{applyLabel}'
  return [
    ...(label ? ['<script>', `  let label = $state(${scriptString(label)})`, '</script>'] : []),
    `<Button bind:buttonEl={explicitTrigger}>${text}</Button>`,
    `<Tooltip trigger={explicitTrigger}${alignAttr}${classAttr}>${text}</Tooltip>`,
  ].join('\n')
}
