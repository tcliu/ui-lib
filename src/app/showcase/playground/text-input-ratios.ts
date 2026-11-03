// The showcase surface for a component's `ratios` override: one JSON row, its
// validation, and the Show-code attribute (as a line or an inline fragment),
// shared by every sized input page instead of each re-declaring the dialog
// skeleton. Pure object construction and string scanning, so it unit-tests
// without a browser.
import type { Staged } from './staged'
import { applied, eyeToggle, stage } from './staged'
import { jsonField } from './snippet-field'
import type { SyncableFieldConfig } from './snippet-sync'

const DEFAULT_INVALID = 'Invalid ratios JSON. Use an object of positive numbers keyed by the shared ratio names.'

// Validate a parsed override against a base ratio set: a plain object whose
// keys are all base ratio names and whose values are positive finite numbers.
// Returns null for anything else, so the dialog can block OK instead of
// applying a partial shape or a zero/negative ratio (which yields an unusable
// metric such as a zero font size or a negative padding).
export function parseRatiosValue<T extends Record<string, number>>(base: T, value: unknown): Partial<T> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  const keys = Object.keys(base) as (keyof T)[]
  const ratios: Record<string, number> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (!keys.includes(key as keyof T)) {
      return null
    }
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) {
      return null
    }
    ratios[key] = raw
  }
  return ratios as Partial<T>
}

// Parse an override editor draft (a JSON object of numbers). Returns null for
// anything else, so the dialog can explain the expected shape.
export function parseRatiosJson<T extends Record<string, number>>(base: T, text: string): Partial<T> | null {
  try {
    return parseRatiosValue(base, JSON.parse(text))
  } catch {
    return null
  }
}

// The dialog's seed: the base ratios under the committed override, so the row
// opens on the values a caller tunes instead of an empty object. Valid JSON,
// unlike a JS object literal, so the seeded draft never trips validation.
function ratiosSeed<T extends Record<string, number>>(base: T, overrides: Partial<T>): string {
  return JSON.stringify({ ...base, ...overrides }, null, 2)
}

// The commit mapping: keep only the keys that differ from the base defaults,
// so a key left at its default (or a draft confirmed untouched) drops back to
// unset instead of staging the defaults as an override.
function ratiosOverride<T extends Record<string, number>>(base: T, ratios: Partial<T>): Partial<T> {
  const next: Record<string, number> = {}
  for (const [key, value] of Object.entries(ratios)) {
    if (value !== base[key as keyof T]) {
      next[key] = value
    }
  }
  return next as Partial<T>
}

// The demo's applied override: the committed object while the eye is on, else
// `undefined`; an empty object is the base default, so it applies nothing.
export function appliedRatios<T extends Record<string, number>>(pair: Staged<Partial<T>>): Partial<T> | undefined {
  const value = applied(pair)
  return value && Object.keys(value).length > 0 ? value : undefined
}

export interface RatioFieldOptions<T extends Record<string, number>> {
  base: T
  // Props-table type cell for this component's override type.
  type: string
  // Row note naming what this component's set tunes (each control's set and
  // derived metrics differ, so the page states its own).
  note: string
  value: Staged<Partial<T>>
}

// The `ratios` prop row shared by every sized input page.
export function componentRatiosField<T extends Record<string, number>>({
  base,
  type,
  note,
  value,
}: RatioFieldOptions<T>): SyncableFieldConfig {
  // One commit path for the dialog and the Show-code write-back: keep only the
  // keys that differ from the base defaults, so a key left at its default (or a
  // draft confirmed untouched) drops back to unset instead of staging the
  // defaults as an override; a real change re-applies the eye through `stage`.
  const commit = (draft: string) => {
    const parsed = parseRatiosJson(base, draft)
    if (!parsed) return
    const next = ratiosOverride(base, parsed)
    if (Object.keys(next).length === 0) {
      value.value = {}
      return
    }
    stage(value, next)
  }

  return jsonField({
    name: 'ratios',
    type,
    note,
    value: ratiosSeed(base, value.value),
    onChange: commit,
    dialog: {
      valid: draft => parseRatiosJson(base, draft) !== null,
      invalidMessage: DEFAULT_INVALID,
    },
    toggle: eyeToggle(value),
    sync: {
      kind: 'custom',
      read: attrs => {
        const attr = attrs?.get('ratios')
        // Absent skips the write-back: the eye's off-state omits the attribute,
        // so treating absence as a reset would wipe the committed override.
        if (!attr) return undefined
        return attr.kind === 'expression' ? attr.value : undefined
      },
      set: commit,
    },
  })
}

// The Show-code line for an applied override: an inline object expression while
// the eye is on and the object is non-empty.
export function ratiosAttrLine<T extends Record<string, number>>(pair: Staged<Partial<T>>, indent = '  '): string[] {
  const value = appliedRatios(pair)
  return value ? [`${indent}ratios={${JSON.stringify(value)}}`] : []
}

// The same line as an inline attribute fragment — a leading space, no newline —
// for a builder that closes its tag on one line (as `sizeAttributeFragment`
// does for a size override).
export function ratiosAttributeFragment<T extends Record<string, number>>(pair: Staged<Partial<T>>): string {
  return ratiosAttrLine(pair, '')
    .map(line => ` ${line.trim()}`)
    .join('')
}
