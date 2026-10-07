// Shared playground size input: a step name, an icon-scale pixel number, or
// unset. Anything else is invalid and renders the component default.

export type SizeName = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_NAMES: SizeName[] = ['xs', 'sm', 'md', 'lg']

export function parseSizeValue(size: string): SizeName | number | undefined {
  if (size === '') {
    return undefined
  }
  if (/^\d+(\.\d+)?$/.test(size)) {
    return Number(size)
  }
  return (SIZE_NAMES as string[]).includes(size) ? (size as SizeName) : undefined
}

// A `size=` attribute line for block-style snippets: named steps render as
// strings, pixel numbers as expressions, invalid input renders nothing (the
// demo falls back to the default).
export function sizeAttributeLine(size: string, indent = '  '): string[] {
  const parsed = parseSizeValue(size)
  if (parsed === undefined) {
    return []
  }
  return typeof parsed === 'number' ? [`${indent}size={${parsed}}`] : [`${indent}size="${parsed}"`]
}

// A `size` attribute fragment for inline snippets (leading space, no indent).
export function sizeAttributeFragment(size: string): string {
  const parsed = parseSizeValue(size)
  if (parsed === undefined) {
    return ''
  }
  return typeof parsed === 'number' ? ` size={${parsed}}` : ` size="${parsed}"`
}
