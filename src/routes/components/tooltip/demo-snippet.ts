// Show-code source for the Tooltip demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import { escapeAttr } from '$showcase/snippet-build'
import type { Staged } from '$showcase/staged'

export interface TooltipSnippetState {
  // Required content: the eye resets to the default label instead of omitting
  // it, so the value always applies and `on` only tracks the row's state.
  label: Staged<string>
  align: Staged<string>
  className: Staged<string>
}

export const STYLED_CLASS = 'border-cyan-500/40 text-cyan-200'

// A JS string literal for the leading script. JSON.stringify handles quotes and
// backslashes; escaping every `<` as `\u003c` stops a label from closing the
// surrounding `<script>` block. `\u003c` is valid JSON, so the literal parses
// back to the original text.
function scriptString(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function buildTooltipSnippet({ label, align, className }: TooltipSnippetState): string {
  const alignAttr = align.on && align.value && align.value !== 'center' ? ` align="${escapeAttr(align.value)}"` : ''
  const classAttr = className.on && className.value ? ` className="${escapeAttr(className.value)}"` : ''
  // A custom label becomes a leading script-local; unset, the children read
  // the localized default from scope. `buildSource` drops the same-named
  // scope key once the snippet declares it, so the local value wins.
  const text = label.value ? '{label}' : '{applyLabel}'
  return [
    ...(label.value ? ['<script>', `  let label = $state(${scriptString(label.value)})`, '</script>'] : []),
    `<Button bind:buttonEl={explicitTrigger}>${text}</Button>`,
    `<Tooltip trigger={explicitTrigger}${alignAttr}${classAttr}>${text}</Tooltip>`,
  ].join('\n')
}
