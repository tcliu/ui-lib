// Show-code source for the NumberInput demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

export type TriState = '' | 'yes' | 'no'

export interface NumberInputSnippetState {
  // Bound value, seeded as script-local state (like the stage size) so the
  // snippet text tracks value edits instead of hiding the value in scope.
  value: string
  min: string
  max: string
  step: string
  placeholder: string
  disabled: TriState
  showControls: TriState
  className: string
}

export const STEPLESS_CLASS = 'w-24 px-3 py-2 text-sm'

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function asNumber(value: string): number | null {
  if (value.trim() === '') {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState): string[] {
  if (value === '') {
    return []
  }
  return [`  ${name}${value === 'yes' ? '' : '={false}'}`]
}

function numberLine(name: string, value: string): string[] {
  const parsed = asNumber(value)
  return parsed === null ? [] : [`  ${name}={${parsed}}`]
}

export function buildNumberInputSnippet({
  value,
  min,
  max,
  step,
  placeholder,
  disabled,
  showControls,
  className,
}: NumberInputSnippetState): string {
  const lines = [
    '<script>',
    // JSON.stringify keeps the literal valid no matter what the value holds.
    `  let value = $state(${JSON.stringify(value)})`,
    '</script>',
    '<div class="flex flex-col gap-1">',
    '  <NumberInput bind:value={value} ariaLabel={applyLabel}',
    ...numberLine('min', min),
    ...numberLine('max', max),
    ...numberLine('step', step),
    ...(placeholder ? [`  placeholder="${escapeAttr(placeholder)}"`] : []),
    ...flagLine('disabled', disabled),
    ...flagLine('showControls', showControls),
    ...(className ? [`  className="${escapeAttr(className)}"`] : []),
    '  />',
    '  <span class="text-sm text-slate-400">value: {value}</span>',
    '</div>',
  ]
  return lines.join('\n')
}
