// Shared builders for the showcase's dialog-backed prop rows (`snippet` and
// `options-json`), so every page declares the same row skeleton, apply-eye
// toggle, and exact-shape dialog instead of repeating the literals. Pure
// object construction (no runes), so it unit-tests without a browser.
//
// A dialog row's `value` seed and `onChange` commit stay page-specific: they
// carry the demo's own parse/normalize/reset logic, which this module does not
// model. Only the repeated machinery lives here.

import type { FieldDialog, FieldToggle } from '$lib/components/FieldTable.svelte'
import type { FieldSyncMeta, SyncableFieldConfig } from './snippet-sync'

// The apply/unapply eye toggle beside a dialog row's edit icon: `enabled` is
// the page's live flag, `setEnabled` its setter. Optional props omit while
// off (committed data preserved); required content resets to its default.
export function snippetToggle(enabled: boolean, setEnabled: (enabled: boolean) => void): FieldToggle {
  return { enabled, onToggle: setEnabled }
}

// The eye toggle for required dialog content (no unset state to fall back
// to): turning off resets the committed data via `onReset`, turning on only
// flips the flag. A later commit re-applies like any other row (the page's
// `onChange` sets its flag), so reset is the row default, not a dead end.
export function resetToggle(
  enabled: boolean,
  setEnabled: (enabled: boolean) => void,
  onReset: () => void,
): FieldToggle {
  return {
    enabled,
    onToggle: next => {
      setEnabled(next)
      if (!next) onReset()
    },
  }
}

// The markup dialog for a snippet row: OK stays enabled only while `parse`
// accepts the draft (returns non-null), so a committed edit never drops a facet
// the static demo cannot reproduce.
export function snippetDialog<T>(parse: (draft: string) => T | null, invalidMessage: string): FieldDialog {
  return { valid: (draft: string) => parse(draft) !== null, invalidMessage }
}

export interface SnippetFieldOptions {
  name: string
  note: string
  // Overrides the row's `type` cell (default `'Snippet'`) for a parameterized
  // snippet (e.g. `Snippet<[AppShellHeaderApi]>`).
  type?: string
  // Dialog seed; the page resolves it (committed state or the canonical builder).
  value: string
  onChange: (draft: string) => void
  placeholder?: string
  dialog?: FieldDialog
  toggle?: FieldToggle
  sync?: FieldSyncMeta
}

// A `Snippet`-typed prop row: the shared `type`/`defaultValue`/`editor`
// boilerplate plus the optional placeholder, toggle, dialog, and write-back.
export function snippetField({
  name,
  note,
  type = 'Snippet',
  value,
  onChange,
  placeholder,
  dialog,
  toggle,
  sync,
}: SnippetFieldOptions): SyncableFieldConfig {
  return {
    name,
    type,
    defaultValue: '—',
    note,
    editor: 'snippet',
    value,
    onChange,
    ...(placeholder ? { placeholder } : {}),
    ...(dialog ? { dialog } : {}),
    ...(toggle ? { toggle } : {}),
    ...(sync ? { sync } : {}),
  }
}

export interface JsonFieldOptions {
  name: string
  note: string
  // The row's `type` cell (e.g. `DemoRow[]`, `AppShellPaneConfig`); JSON rows
  // have no shared type the way snippet rows do, so it is always explicit.
  type: string
  // Dialog seed; the page resolves it (committed state stringified, or the
  // canonical builder output).
  value: string
  onChange: (draft: string) => void
  placeholder?: string
  dialog?: FieldDialog
  toggle?: FieldToggle
  sync?: FieldSyncMeta
}

// An `options-json`-edited prop row: the same skeleton as `snippetField` with
// the JSON editor instead of the markup editor. The `value`/`onChange` pair
// stays page-specific (stringify/parse of the demo's own data shape); the eye
// from `toggle` applies the committed data, or resets required content.
export function jsonField({
  name,
  note,
  type,
  value,
  onChange,
  placeholder,
  dialog,
  toggle,
  sync,
}: JsonFieldOptions): SyncableFieldConfig {
  return {
    name,
    type,
    defaultValue: '—',
    note,
    editor: 'options-json',
    value,
    onChange,
    ...(placeholder ? { placeholder } : {}),
    ...(dialog ? { dialog } : {}),
    ...(toggle ? { toggle } : {}),
    ...(sync ? { sync } : {}),
  }
}
