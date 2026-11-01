// Shared helpers for the showcase pages and their demo builders. Each builder
// (`<slug>/demo-snippet.ts`) emits Show-code for one component; the escaping
// rules, the tri-state type, and its tri-state-to-prop conversion were
// re-declared in nearly every page before, so a single copy here keeps the
// emitted markup and the demo's prop values identical across pages. Pure
// functions, so they unit-test without a browser.

import { sizeAttributeLine } from './size-input'
import type { Staged } from './staged'

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

// The attribute lines below gate a curated prop on its `Staged` eye exactly
// once, so a builder never re-derives the predicate and the emitted markup
// stays byte-identical across pages. `indent` is the line's leading
// whitespace; a nested block passes its own.

// A quoted string attribute: emitted while the eye is on and a value is set.
export function textAttrLine(name: string, pair: Staged<string>, indent = '  '): string[] {
  return pair.on && pair.value ? [`${indent}${name}="${escapeAttr(pair.value)}"`] : []
}

// A fixed-option prop, omitted at the component default so Show-code stays
// minimal.
export function enumAttrLine(name: string, pair: Staged<string>, def: string, indent = '  '): string[] {
  return pair.on && pair.value && pair.value !== def ? [`${indent}${name}="${escapeAttr(pair.value)}"`] : []
}

// A tri-state boolean attribute: bare while Yes, `={false}` while No, omitted
// while unset or at the default.
export function boolAttrLine(name: string, pair: Staged<TriState>, def: TriState = '', indent = '  '): string[] {
  if (!pair.on || pair.value === '' || pair.value === def) {
    return []
  }
  return [`${indent}${name}${pair.value === 'yes' ? '' : '={false}'}`]
}

// A `size` attribute: emitted only while the eye is on, a size is set, and it
// differs from the component default.
export function sizeAttrLine(pair: Staged<string>, indent = '  ', def = 'md', attr = 'size'): string[] {
  return pair.on && pair.value !== '' && pair.value !== def ? sizeAttributeLine(pair.value, indent, attr) : []
}

// `aria-haspopup`: a popup kind renders as a string attribute, the boolean form
// as an expression.
export function popupAttrLine(name: string, pair: Staged<string>, indent = '  '): string[] {
  if (!pair.on || !pair.value) {
    return []
  }
  if (pair.value === 'true' || pair.value === 'false') {
    return [`${indent}${name}={${pair.value}}`]
  }
  return [`${indent}${name}="${escapeAttr(pair.value)}"`]
}
