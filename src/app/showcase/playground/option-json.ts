// Shared options-JSON parser for the showcase options editor dialogs. The
// dropdown demos all take plain-data options (no nested functions), so a Value
// cell can offer them as editable JSON: bare strings or `{ value, label? }`
// objects, where a missing label displays as its own value. Pure parsing (no
// component import beyond the shared option type), so it unit-tests without a
// browser.
import type { SelectOption } from '#lib/components/SelectDropdown.svelte'

// Parse an options editor draft. Returns null for anything else (unparseable
// text, a non-array, or an entry without a string value), so the dialog can
// block OK and explain instead of applying half-shaped data.
export function parseOptionArrayJson(text: string): SelectOption[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) {
    return null
  }
  const out: SelectOption[] = []
  for (const entry of parsed) {
    if (typeof entry === 'string') {
      out.push(entry)
      continue
    }
    if (typeof entry !== 'object' || entry === null || typeof entry.value !== 'string') {
      return null
    }
    if (entry.label !== undefined && typeof entry.label !== 'string') {
      return null
    }
    out.push(entry.label === undefined ? { value: entry.value } : { value: entry.value, label: entry.label })
  }
  return out
}
