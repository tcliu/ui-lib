// Shared snippet-to-playground sync for the showcase pages. A page whose
// Show-code seed renders its demo component tag uses this to write a compiled
// edit's recognized attributes back into playground state, so snippet edits
// surface in the props table's Value column. The page declares a table of
// `SyncField` entries (attribute name, shape, and a setter closing over its
// own state); this module owns the parsing loop. Pure string scanning (no
// compiler import), so it unit-tests without a browser.
//
// Shapes (anything unlisted leaves the playground alone, and a draft without
// a complete demo tag touches nothing):
// - text: string literal sets; absent writes the row's literal default back
//   (`editorDefaultValue`, else the Value cell's placeholder), falling back to
//   unset when the row has no literal default; other shapes skip.
// - tri: bare sets 'yes', `{true}`/`{false}` set yes/no; absent writes the
//   row's boolean default back ('yes'/'no'), staying unset when the row has
//   none.
// - number: numeric expression sets (optional `pattern`); absent writes the
//   row's literal default back like text, unset when the row has none.
// - scopeText: a `{scopeRef}` expression unsets like absence (e.g.
//   `ariaLabel={applyLabel}`); string literals set.
// - scopeReset: like scopeText but never sets (e.g. the tag palette, which the
//   page only ever clears back to the default).
// - scopeFlag: a `{scopeRef}` expression sets 'yes' (e.g. `icon={checkIcon}`);
//   absent unsets.
// - script: a `let <attr> = $state(…)` declaration sets when present (or
//   unsets with `unsetAbsent`); with `literalAttr`, a string literal there
//   takes precedence (e.g. a hand-written `activeValue="…"` wins over the
//   seeded script-local value).
// - scriptJson: a `let <attr> = $state([…])` declaration validated by
//   `parseJson` sets when valid.
// - custom: `read` decides (e.g. the menu item labels).

import {
  extractComponentAttributes,
  extractScriptJsonConst,
  extractScriptValue,
  type SnippetAttribute,
} from './snippet-attributes'
import { splitLeadingScript } from './snippet-source'
import type { FieldConfig } from '$lib/components/FieldTable.svelte'

export type SyncKind =
  | 'text'
  | 'tri'
  | 'number'
  | 'scopeText'
  | 'scopeReset'
  | 'scopeFlag'
  | 'script'
  | 'scriptJson'
  | 'custom'

export interface SyncField {
  attr: string
  kind: SyncKind
  // scopeText/scopeReset/scopeFlag: the scope ref meaning unset (or set, for
  // scopeFlag).
  scopeRef?: string
  // number: numeric shape; defaults to an optional-decimal number.
  pattern?: RegExp
  // text: literal values that mean unset (e.g. a placeholder the builder
  // omits, so writing it back would fight the default).
  unsetValues?: readonly string[]
  // script: a tag attribute whose string literal takes precedence over the
  // seeded script-local; with `unsetAbsent`, a missing declaration unsets
  // instead of skipping.
  literalAttr?: string
  unsetAbsent?: boolean
  // scriptJson: validates the parsed array; setJson runs on truthy results.
  parseJson?: (raw: unknown) => unknown
  setJson?: (value: unknown) => void
  // custom: reads the value from the tag attributes and/or the script
  // declarations; null/undefined skips.
  read?: (
    attrs: Map<string, SnippetAttribute> | null,
    declarations: string,
  ) => string | null | undefined
  set?: (value: string) => void
  // text/tri/number: the row's current value. An absent attribute writes this
  // back (rather than resetting to the default) so compiling a snippet that
  // omits an eye row's prop never stages the default into the form.
  currentValue?: () => string
}

const NUMERIC_RE = /^-?\d+(\.\d+)?$/

function readText(attrs: Map<string, SnippetAttribute>, name: string): string | undefined {
  if (!attrs.has(name)) {
    return ''
  }
  const attr = attrs.get(name)!
  return attr.kind === 'string' ? attr.value : undefined
}

function readTri(attrs: Map<string, SnippetAttribute>, name: string): string | undefined {
  if (!attrs.has(name)) {
    return ''
  }
  const attr = attrs.get(name)!
  if (attr.kind === 'bare') {
    return 'yes'
  }
  if (attr.kind === 'expression' && (attr.value === 'true' || attr.value === 'false')) {
    return attr.value === 'true' ? 'yes' : 'no'
  }
  return undefined
}

export interface SyncOptions {
  // Demo component tag. Null skips tag parsing entirely (script-only pages);
  // otherwise a missing tag leaves everything alone.
  tag: string | null
  fields: SyncField[]
  // Runs after syncing (e.g. `preview.syncSeed`), so the reseed effect keeps
  // the user's editor text.
  onDone: () => void
}

// A FieldTable row plus its snippet write-back shape, so a page declares each
// editable prop once: the row drives the Value column, `sync` drives the
// snippet-to-state write-back. `attr` defaults to the row name (override when
// the snippet shape lives under another key, e.g. the label script-local
// behind a `children` row); `set` defaults to the row's `onChange`.
export type FieldSyncMeta = Omit<SyncField, 'attr' | 'set' | 'setJson' | 'currentValue'> & {
  attr?: string
  set?: (value: string) => void
  setJson?: (value: unknown) => void
}

export interface SyncableFieldConfig extends FieldConfig {
  sync?: FieldSyncMeta
}

// Derive a page's sync table from its combined field declarations. Rows
// without `sync` (read-only props, snippet-only rows) contribute nothing.
export function syncFieldsOf(fields: SyncableFieldConfig[]): SyncField[] {
  return fields.flatMap((field): SyncField[] => {
    if (!field.sync) {
      return []
    }
    const { attr, set, setJson, ...shape } = field.sync
    // An empty write means the attribute is absent (or unset). Rather than
    // leaving the row unset, resolve it back to the row's own default so the
    // Value column and the demo keep showing what the builder omits: a tri row
    // restores its boolean default (yes/no), a text/number row its literal
    // default (`editorDefaultValue`, else the Value cell's placeholder). A row
    // with neither stays unset. Owning the restore here keeps a page from
    // dropping the fallback its hand-written setter used to carry; an explicit
    // `set` still keeps full control.
    // The row's literal (text/number/custom) or boolean (tri) default. Custom
    // reads (e.g. `size`) carry theirs through `placeholder`/`editorDefaultValue`
    // too, so one value covers every kind.
    const literalDefault =
      shape.kind === 'tri'
        ? field.defaultValue === 'true'
          ? 'yes'
          : field.defaultValue === 'false'
            ? 'no'
            : ''
        : (field.editorDefaultValue ?? field.placeholder ?? '')
    const resolvesEmpty =
      shape.kind === 'tri' || shape.kind === 'text' || shape.kind === 'number' ? literalDefault : ''
    // An eye row that prefills a literal default never stages it: an absent
    // attribute writes the row's current value back, and a write that lands on
    // the default unstages the eye.
    const eyeDefault = Boolean(field.toggle) && literalDefault !== ''
    const currentValue =
      eyeDefault && (shape.kind === 'text' || shape.kind === 'tri' || shape.kind === 'number')
        ? () => field.value ?? ''
        : undefined
    const setter =
      set ??
      (field.onChange
        ? (value: string) => {
            const next = value === '' ? resolvesEmpty : value
            field.onChange?.(next)
            if (eyeDefault && next === literalDefault) field.toggle?.onToggle(false)
          }
        : undefined)
    return [
      {
        ...shape,
        attr: attr ?? field.name,
        set: setter,
        ...(currentValue ? { currentValue } : {}),
        ...(setJson ? { setJson } : {}),
      },
    ]
  })
}

export function syncSnippetToState(source: string, { tag, fields, onDone }: SyncOptions): void {
  const attrs = tag ? extractComponentAttributes(source, tag) : null
  if (tag && !attrs) {
    return
  }
  // The script split runs only for pages declaring script-backed fields.
  const needsScript = fields.some(
    field => field.kind === 'script' || field.kind === 'scriptJson' || field.kind === 'custom',
  )
  const declarations = needsScript ? splitLeadingScript(source).declarations : ''
  for (const field of fields) {
    switch (field.kind) {
      case 'text': {
        if (!attrs) break
        const cv = field.currentValue
        if (!attrs.has(field.attr) && cv) {
          field.set?.(cv())
          break
        }
        const next = readText(attrs, field.attr)
        if (next !== undefined) {
          field.set?.(field.unsetValues?.includes(next) ? '' : next)
        }
        break
      }
      case 'tri': {
        if (!attrs) break
        const cv = field.currentValue
        if (!attrs.has(field.attr) && cv) {
          field.set?.(cv())
          break
        }
        const next = readTri(attrs, field.attr)
        if (next !== undefined) {
          field.set?.(next)
        }
        break
      }
      case 'number': {
        if (!attrs) break
        if (!attrs.has(field.attr)) {
          field.set?.(field.currentValue ? field.currentValue() : '')
          break
        }
        const attr = attrs.get(field.attr)!
        const pattern = field.pattern ?? NUMERIC_RE
        // A non-numeric expression is custom code: leave the playground alone.
        if (attr.kind === 'expression' && pattern.test(attr.value)) {
          field.set?.(attr.value)
        }
        break
      }
      case 'scopeText': {
        if (!attrs) break
        const attr = attrs.get(field.attr)
        if (!attr || (attr.kind === 'expression' && attr.value === field.scopeRef)) {
          field.set?.('')
        } else if (attr.kind === 'string') {
          field.set?.(attr.value)
        }
        break
      }
      case 'scopeReset': {
        if (!attrs) break
        const attr = attrs.get(field.attr)
        if (!attr || (attr.kind === 'expression' && attr.value === field.scopeRef)) {
          field.set?.('')
        }
        break
      }
      case 'scopeFlag': {
        if (!attrs) break
        const attr = attrs.get(field.attr)
        if (!attr) {
          field.set?.('')
        } else if (attr.kind === 'expression' && attr.value === field.scopeRef) {
          field.set?.('yes')
        }
        break
      }
      case 'script': {
        const literal = field.literalAttr ? attrs?.get(field.literalAttr) : undefined
        if (literal?.kind === 'string') {
          field.set?.(literal.value)
          break
        }
        const next = extractScriptValue(declarations, field.attr)
        if (next !== null) {
          field.set?.(next)
        } else if (field.unsetAbsent) {
          field.set?.('')
        }
        break
      }
      case 'scriptJson': {
        const parsed = field.parseJson?.(extractScriptJsonConst(declarations, field.attr))
        if (parsed) {
          field.setJson?.(parsed)
        }
        break
      }
      case 'custom': {
        const next = field.read?.(attrs, declarations)
        if (next !== null && next !== undefined) {
          field.set?.(next)
        }
        break
      }
    }
  }
  onDone()
}
