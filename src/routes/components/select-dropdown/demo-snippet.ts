// Show-code source for the SelectDropdown demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

export type TriState = '' | 'yes' | 'no'

export interface SelectDropdownSnippetState {
  size: string
  filterable: TriState
  controlClass: string
  clearable: TriState
  align: string
}

export const FILTERABLE_CONTROL =
  'w-40 rounded-md border border-slate-700 bg-slate-950 pl-3 pr-7 py-2 text-sm text-slate-100 outline-none transition motion-reduce:transition-none hover:border-cyan-500 focus-visible:border-cyan-500'

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildSelectDropdownSnippet({
  size,
  filterable,
  controlClass,
  clearable,
  align,
}: SelectDropdownSnippetState): string {
  const lines = [
    '<SelectDropdown',
    '  buttonLabel={labelFor(options, value)}',
    '  activeValue={value}',
    '  ariaLabel="default"',
    ...(size ? [`  size="${size}"`] : []),
    ...flagLine('filterable', filterable),
    ...(controlClass ? [`  controlClass="${controlClass}"`] : []),
    ...flagLine('clearable', clearable),
    ...(align ? [`  align="${align}"`] : []),
    '  options={options}',
    '  onSelect={next => (value = next)} />',
    '<span class="text-sm text-slate-400">value: {value}</span>',
  ]
  return lines.join('\n')
}
