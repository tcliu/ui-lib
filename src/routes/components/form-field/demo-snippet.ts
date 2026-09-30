// Show-code source for the FormField demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

export interface FormFieldSnippetState {
  label: string
  htmlFor: string
  className: string
  layout: string
}

export const STYLED_CLASS = 'rounded-md border border-cyan-500/40 p-3'
const INPUT_CLASS =
  'w-56 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus-visible:border-cyan-500'

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildFormFieldSnippet({ label, htmlFor, className, layout }: FormFieldSnippetState): string {
  const labelAttr = label ? ` label="${escapeAttr(label)}"` : ' label={defaultLabel}'
  const forAttr = htmlFor ? ` htmlFor="${escapeAttr(htmlFor)}"` : ''
  const layoutAttr = layout ? ` layout="${escapeAttr(layout)}"` : ''
  const classAttr = className ? ` className="${escapeAttr(className)}"` : ''
  const idAttr = htmlFor ? `    id="${escapeAttr(htmlFor)}"\n` : ''
  return [
    `<FormField${labelAttr}${forAttr}${layoutAttr}${classAttr}>`,
    '  <input',
    '    type="text"',
    '    bind:value',
    `${idAttr}    class="${INPUT_CLASS}" />`,
    '</FormField>',
  ].join('\n')
}
