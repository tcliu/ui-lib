// Show-code source for the FormDialog demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

import {
  boolAttrLine,
  enumAttrLine,
  escapeAttr,
  escapeRawLine,
  textAttrLine,
  unescapeAttr,
  type TriState,
} from '#showcase/playground/snippet-build.js'
import { isBasicHtmlMarkup } from '#showcase/playground/snippet-html.js'
import { buildHeaderLine, parseHeaderMarkup } from '#showcase/playground/snippet-header.js'
import type { Staged } from '#showcase/playground/staged.js'

export interface FormDialogSnippetState {
  widthVariant: Staged<string>
  heightVariant: Staged<string>
  size: Staged<string>
  dirty: Staged<TriState>
  confirmOnDismiss: Staged<TriState>
  pending: Staged<TriState>
  saveDisabled: Staged<TriState>
  // Raw body markup committed from the row's code dialog; empty renders the
  // canonical TextInput below. Its eye off means the body snippet is not
  // applied.
  children: Staged<string>
  // Raw actions markup committed from the row's code dialog; empty renders the
  // canonical Format button below. Its eye off means no actions snippet is
  // applied.
  actions: Staged<string>
  // Raw footer markup committed from the row's code dialog; empty renders the
  // built-in save/reset row. Its eye off means the built-in row is used.
  footer: Staged<string>
  closeLabel: Staged<string>
  discardLabel: Staged<string>
  discardMessage: Staged<string>
  discardTitle: Staged<string>
  resetLabel: Staged<string>
  saveLabel: Staged<string>
  title: Staged<string>
  // Raw header markup committed from the row's code dialog; empty renders the
  // title fallback below. Its eye off means no header snippet is applied.
  header: Staged<string>
}

export interface EditBodyState {
  type: string
  label: string
}

// Canonical body markup: the shared TextInput bound to the scope draft, with
// its type and accessible name. Unset labels read the dialog title from scope.
// Unindented; the snippet builder indents committed lines at emit time.
export function buildEditBodyMarkup({ type, label }: EditBodyState): string {
  const typeAttr = ` type="${escapeAttr(type || 'text')}"`
  const labelAttr = label ? ` ariaLabel="${escapeAttr(label)}"` : ' ariaLabel={dialogTitle}'
  return `<TextInput bind:value={draft}${typeAttr}${labelAttr} />`
}

// The accessible name behind a TextInput line: the `{dialogTitle}` scope ref,
// a literal, or absent (the control renders with no name).
export type EditBodyAria = { kind: 'scope' } | { kind: 'literal'; value: string } | null

// A TextInput line renders as a live control in the static demo; any other
// committed markup renders verbatim.
export type EditBodySegment = { kind: 'textinput'; type: string; ariaLabel: EditBodyAria } | { kind: 'html'; html: string }

const TEXTINPUT_RE = /^<TextInput bind:value=\{draft\}(?: type="([^"]*)")?(?: ariaLabel=(?:"([^"]*)"|\{dialogTitle\}))? \/>$/

function parseAriaLabel(line: string): EditBodyAria | undefined {
  if (!line.includes('ariaLabel=')) {
    return null
  }
  if (line.includes('ariaLabel={dialogTitle}')) {
    return { kind: 'scope' }
  }
  const match = line.match(/ariaLabel="([^"]*)"/)
  if (!match || !match[1]) {
    return undefined
  }
  return { kind: 'literal', value: unescapeAttr(match[1]) }
}

// Normalize a committed draft for storage: one trimmed line per row.
export function normalizeEditBodyDraft(draft: string): string {
  return draft
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}

// Parse an edited body draft into the normalized markup to store, or null
// unless every line is a TextInput control or basic plain HTML/text (see
// `isBasicHtmlMarkup`). Text without markup is valid (it renders verbatim);
// an empty draft is not (the eye toggle covers removal).
export function parseEditBodyMarkup(draft: string): string | null {
  const normalized = normalizeEditBodyDraft(draft)
  if (normalized === '') {
    return null
  }
  const htmlLines: string[] = []
  for (const line of normalized.split('\n')) {
    const match = line.match(TEXTINPUT_RE)
    if (match) {
      if (match[1] !== undefined && match[1] === '') {
        return null
      }
      if (parseAriaLabel(line) === undefined) {
        return null
      }
      continue
    }
    htmlLines.push(line)
  }
  if (htmlLines.length > 0 && !isBasicHtmlMarkup(htmlLines.join('\n'))) {
    return null
  }
  return normalized
}

// Split validated body markup into the segments the static demo renders.
// Stored drafts are always valid, so the fallback only covers direct calls
// with unvalidated text.
export function parseEditBodySegments(markup: string): EditBodySegment[] | null {
  if (parseEditBodyMarkup(markup) === null) {
    return null
  }
  const segments: EditBodySegment[] = []
  let html: string[] = []
  const flush = () => {
    if (html.length > 0) {
      segments.push({ kind: 'html', html: html.join('\n') })
      html = []
    }
  }
  for (const line of normalizeEditBodyDraft(markup).split('\n')) {
    const match = line.match(TEXTINPUT_RE)
    const ariaLabel = match ? parseAriaLabel(line) : undefined
    if (match && ariaLabel !== undefined) {
      flush()
      segments.push({ kind: 'textinput', type: match[1] ?? '', ariaLabel })
    } else {
      html.push(line)
    }
  }
  flush()
  return segments
}

// Canonical actions markup: the shared outline Button behind the `actions`
// snippet. Unindented; the snippet builder indents it at emit time.
export function buildEditActionsMarkup({ label }: { label: string }): string {
  return `<Button variant="outline" type="button">${label || 'Format'}</Button>`
}

// Canonical footer markup: the caller's own action row, replacing the built-in
// save/reset pair. A submit button inside it submits the form.
export function buildEditFooterMarkup({ label }: { label: string }): string {
  return `<Button variant="primary" type="submit">${label || 'Save'}</Button>`
}

// Normalize a committed actions draft for storage: one trimmed line.
export function normalizeEditActionsDraft(draft: string): string {
  return draft
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}

const ACTIONS_RE = /^<Button variant="outline" type="button">([^<>{}]+)<\/Button>$/

const FOOTER_RE = /^<Button variant="primary" type="submit">([^<>{}]+)<\/Button>$/

// Parse the label out of validated actions markup, or null unless it is exactly
// the single outline Button line the static demo can reproduce.
export function parseEditActionsLabel(markup: string): string | null {
  const match = normalizeEditActionsDraft(markup).match(ACTIONS_RE)
  if (!match || !match[1] || match[1].trim() === '') {
    return null
  }
  return match[1]
}

// Parse an edited actions draft into the normalized markup to store, or null
// unless it is exactly the single outline Button line above; an empty draft is
// not (the eye toggle covers removal).
export function parseEditActionsMarkup(draft: string): string | null {
  const normalized = normalizeEditActionsDraft(draft)
  if (normalized === '') {
    return null
  }
  return parseEditActionsLabel(normalized) === null ? null : normalized
}

// Parse the label out of validated footer markup, or null unless it is exactly
// the single submit Button line the static demo can reproduce.
export function parseEditFooterLabel(markup: string): string | null {
  const match = normalizeEditActionsDraft(markup).match(FOOTER_RE)
  if (!match || !match[1] || match[1].trim() === '') {
    return null
  }
  return match[1]
}

// Parse an edited footer draft into the normalized markup to store, or null
// unless it is exactly the single submit Button line above.
export function parseEditFooterMarkup(draft: string): string | null {
  const normalized = normalizeEditActionsDraft(draft)
  if (normalized === '') {
    return null
  }
  return parseEditFooterLabel(normalized) === null ? null : normalized
}

// Verbatim body lines carry the user's literal text, so `&` is escaped for
// compilation; `<`/`{` cannot appear (validation rejects them).

// Actions labels carry the same literal text; the grammar already rejects
// `<`, `>` and `{`/`}`, so only `&` needs escaping.
function escapeActionsLabel(label: string): string {
  return label.replace(/&/g, '&amp;')
}

export function buildFormDialogSnippet({
  widthVariant,
  heightVariant,
  size,
  dirty,
  confirmOnDismiss,
  pending,
  saveDisabled,
  children,
  actions,
  footer,
  closeLabel,
  discardLabel,
  discardMessage,
  discardTitle,
  resetLabel,
  saveLabel,
  title,
  header,
}: FormDialogSnippetState): string {
  // The body sits at 4 spaces, matching the dialog. Unset labels read the
  // localized defaults from scope, so customized text rides literals while the
  // cleared form applies no overrides. The eye toggle off means no body is
  // applied; otherwise custom markup emits verbatim, unset the canonical
  // TextInput.
  const bodyIndent = '    '
  const childLines = !children.on
    ? []
    : children.value
      ? children.value.split('\n').map(line => (line ? `${bodyIndent}${escapeRawLine(line)}` : line))
      : [`${bodyIndent}${buildEditBodyMarkup({ type: '', label: '' })}`]
  // The actions snippet sits first inside the dialog so its buttons land
  // before OK. The committed line carries the label only; the formatting
  // handler is fixed, matching the static demo's Format button.
  const actionLabel = actions.on ? (parseEditActionsLabel(actions.value) ?? 'Format') : null
  const actionLines =
    actionLabel === null
      ? []
      : [
          `${bodyIndent}{#snippet actions()}`,
          `${bodyIndent}  <Button variant="outline" type="button" onClick={() => { try { draft = JSON.stringify(JSON.parse(draft), null, 2) } catch {} }}>${escapeActionsLabel(actionLabel)}</Button>`,
          `${bodyIndent}{/snippet}`,
        ]
  // The header snippet sits inside the dialog behind the body so the seed
  // compiles the same Copyable title the static demo renders; the committed
  // line emits verbatim (validation at commit guarantees the shape).
  const headerLines =
    header.on && header.value
      ? ['    {#snippet header()}', `      ${escapeActionsLabel(header.value)}`, '    {/snippet}']
      : []
  // The footer snippet replaces the built-in save/reset row; it renders inside
  // the form, so a submit button in it submits the form.
  const footerLabel = footer.on ? (parseEditFooterLabel(footer.value) ?? 'Save') : null
  const footerLines =
    footerLabel === null
      ? []
      : [
          `${bodyIndent}{#snippet footer()}`,
          `${bodyIndent}  ${footer.value.split('\n').map(line => (line ? `    ${escapeRawLine(line)}` : line)).join('\n')}`,
          `${bodyIndent}{/snippet}`,
        ]
  const labelLine = (name: string, pair: Staged<string>, scopeRef: string): string =>
    pair.on && pair.value ? `${bodyIndent}${name}="${escapeAttr(pair.value)}"` : `${bodyIndent}${name}={${scopeRef}}`
  return [
    '<Button variant="primary" onClick={() => (open = true)}>{openDialogLabel}</Button>',
    '',
    '{#if open}',
    '  <FormDialog',
    labelLine('title', title, 'dialogTitle'),
    labelLine('closeLabel', closeLabel, 'closeLabel'),
    labelLine('saveLabel', saveLabel, 'okLabel'),
    labelLine('resetLabel', resetLabel, 'resetLabel'),
    labelLine('discardTitle', discardTitle, 'discardTitle'),
    labelLine('discardMessage', discardMessage, 'discardMessage'),
    labelLine('discardLabel', discardLabel, 'discardLabel'),
    ...enumAttrLine('widthVariant', widthVariant, 'md', '    '),
    ...enumAttrLine('heightVariant', heightVariant, 'auto', '    '),
    // The dialog's footprint steps run past the shared size axis (`2xl`–`7xl`),
    // which `sizeAttrLine` drops as unparsable, so the shorthand stays a text
    // attribute.
    ...textAttrLine('size', size, '    '),
    ...boolAttrLine('dirty', dirty, 'no', '    '),
    ...boolAttrLine('confirmOnDismiss', confirmOnDismiss, 'no', '    '),
    ...boolAttrLine('pending', pending, 'no', '    '),
    ...boolAttrLine('saveDisabled', saveDisabled, 'no', '    '),
    '    onSave={() => (open = false)}',
    '    onReset={() => (draft = saved)}',
    ...(childLines.length > 0 || actionLines.length > 0 || headerLines.length > 0 || footerLines.length > 0
      ? [
          '    onClose={() => (open = false)}>',
          ...actionLines,
          ...headerLines,
          ...childLines,
          ...footerLines,
          '  </FormDialog>',
        ]
      : ['    onClose={() => (open = false)} />']),
    '{/if}',
  ].join('\n')
}
