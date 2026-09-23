// Show-code source for the ChipDropdown demo section. Pure string building
// over the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.
// Single-quoted lines throughout: backticks and ${} inside them stay literal,
// so no escaping.

export type TriState = '' | 'yes' | 'no'

export interface ChipDropdownSnippetState {
  variant: string
  filterable: TriState
  disabled: TriState
  align: string
  filterPlaceholder: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

export function buildChipDropdownSnippet({
  variant,
  filterable,
  disabled,
  align,
  filterPlaceholder,
}: ChipDropdownSnippetState): string {
  return [
    '<ChipDropdown',
    '  label={labelFor(options, value)}',
    '  activeValue={value}',
    '  ariaLabel="Set status"',
    ...(variant ? [`  variant="${variant}"`] : []),
    ...flagLine('filterable', filterable),
    ...flagLine('disabled', disabled),
    ...(align ? [`  align="${align}"`] : []),
    ...(filterPlaceholder ? [`  filterPlaceholder="${escapeAttr(filterPlaceholder)}"`] : []),
    '  options={options}',
    '  onSelect={next => (value = next)} />',
    '<span class="text-sm text-slate-400">value: {value}</span>',
  ].join('\n')
}
