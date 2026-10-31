// A curated playground prop and its eye toggle, as one value instead of two
// independent state fields (`label`/`labelOn`, `options`/`optionsEnabled`).
// Every consumer — the demo's `$derived`s, the props-table row, the Show-code
// builder — reads the same pair, so the two halves cannot drift apart and the
// "off omits the prop but keeps its data" rule lives in one place.
//
// A plain object, never a class: Reset restores `structuredClone(INITIAL)`, and
// rune-backed class fields do not survive the clone. Mutate a pair in place
// (`.value`, `.on`, or `stage`); never reassign it, or a captured setter keeps
// writing to the stale object.
import type { FieldToggle } from '$lib/components/FieldTable.svelte'
import { flagOn, type TriState } from './snippet-build'
import { resetToggle, snippetToggle } from './snippet-field'

export interface Staged<T> {
  value: T
  // Whether the row's eye applies the prop to the demo and Show-code. Off
  // keeps the committed value parked so re-applying loses nothing.
  on: boolean
}

// A curated prop. `on` starts off, matching a default-valued row that applies
// no override; a non-default seed passes `true`.
export function staged<T>(value: T, on = false): Staged<T> {
  return { value, on }
}

// The prop's applied value: its value while the eye is on, else `undefined`
// so the demo and builder fall back to the component default.
export function applied<T>(pair: Staged<T>): T | undefined {
  return pair.on ? pair.value : undefined
}

// The same gate for a tri-state boolean prop, keeping `flagOn`'s unset
// handling (an empty tri-state stays `undefined` even while the eye is on).
export function appliedFlag(pair: Staged<TriState>): boolean | undefined {
  return pair.on ? flagOn(pair.value) : undefined
}

// Commit an edit and re-apply the eye, in place. The row builders already do
// this through `withEye`; a hand-declared row calls it so the rule has one
// implementation per commit.
export function stage<T>(pair: Staged<T>, value: T): void {
  pair.value = value
  pair.on = true
}

// The `value`/`onChange`/`enabled`/`setEnabled` quartet the shared row builders
// take, derived from the pair so a row declaration names it once.
export interface StagedEye<T> {
  value: T
  onChange: (value: T) => void
  enabled: boolean
  setEnabled: (on: boolean) => void
}

export function eye<T>(pair: Staged<T>): StagedEye<T> {
  return {
    value: pair.value,
    onChange: value => {
      pair.value = value
    },
    enabled: pair.on,
    setEnabled: on => {
      pair.on = on
    },
  }
}

// The quartet for a tri-state boolean row: the row edits a `TriState` while its
// builder takes a plain string, so the write narrows back at the pair.
export function eyeFlag(pair: Staged<TriState>): StagedEye<string> {
  return {
    value: pair.value,
    onChange: value => {
      pair.value = value as TriState
    },
    enabled: pair.on,
    setEnabled: on => {
      pair.on = on
    },
  }
}

// The eye toggle for an optional dialog row (off omits the prop, data stays).
export function eyeToggle(pair: Staged<unknown>): FieldToggle {
  return snippetToggle(pair.on, on => {
    pair.on = on
  })
}

// The eye toggle for required dialog content: off resets the committed data to
// the row's default, on only flips the flag.
export function eyeResetToggle(pair: Staged<unknown>, reset: () => void): FieldToggle {
  return resetToggle(
    pair.on,
    on => {
      pair.on = on
    },
    reset,
  )
}
