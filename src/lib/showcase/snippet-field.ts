// Shared builders for the showcase's dialog-backed prop rows (`snippet` and
// `options-json`), so every page declares the same row skeleton, apply-eye
// toggle, and exact-shape dialog instead of repeating the literals. Pure
// object construction (no runes), so it unit-tests without a browser.
//
// A dialog row's `value` seed and `onChange` commit stay page-specific: they
// carry the demo's own parse/normalize/reset logic, which this module does not
// model. Only the repeated machinery lives here.

import type { FieldDialog, FieldOption, FieldToggle } from '$lib/components/FieldTable.svelte'
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

interface EyeOptions {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  // A bound-state row resets the bound state on eye-off (resetToggle).
  reset?: () => void
}

// Apply a staged-eye toggle to a row: committing re-applies the eye, and an
// eye-off resets the bound state when `reset` is given or keeps the committed
// data otherwise. `commit` is the page's own setter, so it never depends on
// the row's preliminary `onChange`.
function withEye(
  row: SyncableFieldConfig,
  commit: (value: string) => void,
  { enabled, setEnabled, reset }: EyeOptions,
): SyncableFieldConfig {
  return {
    ...row,
    onChange: next => {
      commit(next)
      setEnabled(true)
    },
    toggle: reset ? resetToggle(enabled, setEnabled, reset) : snippetToggle(enabled, setEnabled),
  }
}

export interface SizeFieldOptions {
  note: string
  // Curated size text (a step name, a pixel number, or unset).
  value: string
  onChange: (value: string) => void
  // The eye's on/off state; the row stages the prop while on.
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  // The scale prop's name (default `size`); also the snippet attribute the
  // write-back reads.
  name?: string
  clearLabel?: string
  // Optional narrowing of the named steps (e.g. the icon gallery's list).
  options?: FieldOption[]
  // Replaces the default size write-back (e.g. a `scopeText` size).
  sync?: FieldSyncMeta
}

// A `size`-editor prop row: the shared type/default/allowCustom/placeholder
// boilerplate plus the eye toggle and the size write-back (an absent attribute
// writes the current value back, a step name or pixel number sets, anything
// else is custom code the playground leaves alone). Only the row's note and its
// state pair stay page-specific.
export function sizeField({
  note,
  value,
  onChange,
  enabled,
  setEnabled,
  name = 'size',
  clearLabel = 'Clear size',
  options,
  sync,
}: SizeFieldOptions): SyncableFieldConfig {
  return withEye(
    {
      name,
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number",
      defaultValue: "'md'",
      note,
      editor: 'size',
      allowCustomValue: true,
      ...(options ? { options } : {}),
      value,
      onChange,
      placeholder: 'md',
      clearLabel,
      sync: sync ?? {
        kind: 'custom',
        read: attrs => {
          const attr = attrs?.get(name)
          // Absent writes the current value back (never a reset), so compiling a
          // snippet that omits the prop cannot wipe committed custom data.
          if (!attr) return value
          if (attr.kind === 'string') return attr.value
          if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
          return undefined
        },
      },
    },
    onChange,
    { enabled, setEnabled },
  )
}

export interface BoolFieldOptions {
  name: string
  // The row's Type cell (default `boolean`; use `boolean?` for an optional
  // prop).
  type?: string
  defaultValue: string
  note: string
  // The demo's tri-state (`''`/`yes`/`no`) for the prop.
  value: string
  onChange: (value: string) => void
  // Pass both to stage the row behind the eye; omit for an always-applied row.
  enabled?: boolean
  setEnabled?: (enabled: boolean) => void
  // A bound-state row resets the bound state on eye-off (resetToggle).
  reset?: () => void
  // Replaces the default `{ kind: 'tri' }` write-back.
  sync?: FieldSyncMeta
}

// A `boolean`-editor prop row: the shared type/editor/tri-sync boilerplate plus,
// when `enabled`/`setEnabled` are given, the staged-eye toggle (a `reset` makes
// eye-off restore the bound state). Only the row's note and its state pair stay
// page-specific.
export function boolField({ name, type = 'boolean', defaultValue, note, value, onChange, enabled, setEnabled, reset, sync }: BoolFieldOptions): SyncableFieldConfig {
  const row: SyncableFieldConfig = {
    name,
    type,
    defaultValue,
    note,
    editor: 'boolean',
    value,
    onChange,
    sync: sync ?? { kind: 'tri' },
  }
  if (enabled !== undefined && setEnabled !== undefined) {
    return withEye(row, onChange, { enabled, setEnabled, reset })
  }
  return row
}

export interface TextFieldOptions {
  name: string
  type: string
  defaultValue: string
  note: string
  value: string
  onChange: (value: string) => void
  editorDefaultValue?: string
  clearable?: boolean
  placeholder?: string
  clearLabel?: string
  enabled?: boolean
  setEnabled?: (enabled: boolean) => void
  reset?: () => void
  // Replaces the default `{ kind: 'text' }` write-back.
  sync?: FieldSyncMeta
}

// A `text`-editor prop row: the shared type/default/note/editor boilerplate
// plus, when `enabled`/`setEnabled` are given, the staged-eye toggle. Only the
// row's note and its state pair stay page-specific.
export function textField({
  name,
  type,
  defaultValue,
  note,
  value,
  onChange,
  editorDefaultValue,
  clearable,
  placeholder,
  clearLabel,
  enabled,
  setEnabled,
  reset,
  sync,
}: TextFieldOptions): SyncableFieldConfig {
  const row: SyncableFieldConfig = {
    name,
    type,
    defaultValue,
    ...(editorDefaultValue !== undefined ? { editorDefaultValue } : {}),
    note,
    editor: 'text',
    ...(clearable ? { clearable: true } : {}),
    value,
    onChange,
    ...(placeholder ? { placeholder } : {}),
    ...(clearLabel ? { clearLabel } : {}),
    sync: sync ?? { kind: 'text' },
  }
  if (enabled !== undefined && setEnabled !== undefined) {
    return withEye(row, onChange, { enabled, setEnabled, reset })
  }
  return row
}

export interface EnumFieldOptions {
  name: string
  type: string
  defaultValue: string
  note: string
  options: FieldOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  clearLabel?: string
  enabled?: boolean
  setEnabled?: (enabled: boolean) => void
  reset?: () => void
  // Replaces the default `{ kind: 'text' }` write-back.
  sync?: FieldSyncMeta
}

// An `enum`-editor prop row: the shared type/default/note/options boilerplate
// plus, when `enabled`/`setEnabled` are given, the staged-eye toggle. Only the
// row's note, options expression, and state pair stay page-specific.
export function enumField({
  name,
  type,
  defaultValue,
  note,
  options,
  value,
  onChange,
  placeholder,
  clearLabel,
  enabled,
  setEnabled,
  reset,
  sync,
}: EnumFieldOptions): SyncableFieldConfig {
  const row: SyncableFieldConfig = {
    name,
    type,
    defaultValue,
    note,
    editor: 'enum',
    options,
    value,
    onChange,
    ...(placeholder ? { placeholder } : {}),
    ...(clearLabel ? { clearLabel } : {}),
    sync: sync ?? { kind: 'text' },
  }
  if (enabled !== undefined && setEnabled !== undefined) {
    return withEye(row, onChange, { enabled, setEnabled, reset })
  }
  return row
}
