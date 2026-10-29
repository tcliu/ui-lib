// Shared helpers for the showcase pages and their demo builders. Each builder
// (`<slug>/demo-snippet.ts`) emits Show-code for one component; the escaping
// rules, the tri-state type, and its tri-state-to-prop conversion were
// re-declared in nearly every page before, so a single copy here keeps the
// emitted markup and the demo's prop values identical across pages. Pure
// functions, so they unit-test without a browser.

// The tri-state a boolean prop's Value cell carries: '' unset, 'yes'/'no'.
export type TriState = '' | 'yes' | 'no'

// A boolean prop's tri-state maps to the demo's prop value: unset renders the
// component default, Yes/No force the value.
export function flagOn(value: TriState): boolean | undefined {
  return value === '' ? undefined : value === 'yes'
}

// Attribute-value escaping for a double-quoted attribute.
export function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// Element-text escaping for text content between tags.
export function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Ampersand-only escaping for a raw markup line that keeps its own tags.
export function escapeRawLine(value: string): string {
  return value.replace(/&/g, '&amp;')
}

// Reverse of `escapeAttr`, for reading a committed attribute back out.
export function unescapeAttr(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}
