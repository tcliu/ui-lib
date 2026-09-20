// Show-code source for the Chip demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export type TriState = '' | 'yes' | 'no'

export interface ChipSnippetState {
  mode: string
  label: string
  chipClass: string
  active: TriState
}

export const DEFAULT_CHIP_CLASS = 'rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200'

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

export function buildChipSnippet({ mode, label, chipClass, active }: ChipSnippetState): string {
  const labelAttr = label ? `label="${escapeAttr(label)}"` : 'label={defaultLabel}'
  const classAttr = `chipClass="${escapeAttr(chipClass || DEFAULT_CHIP_CLASS)}"`
  if (mode === 'removable') {
    return [
      '{#if !removed}',
      '  <Chip',
      `    ${labelAttr}`,
      `    ${classAttr}`,
      '    onRemove={() => (removed = true)} />',
      '{/if}',
    ].join('\n')
  }
  const lines = [
    '<Chip',
    `  ${labelAttr}`,
    `  ${classAttr}`,
    ...(mode === 'toggle' ? [...flagLine('active', active), '  onclick={() => (chipActive = !chipActive)}'] : []),
    '/>',
  ]
  return lines.join('\n')
}
