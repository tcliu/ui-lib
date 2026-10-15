// Show-code source for the EditDialog demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

import { isBasicHtmlMarkup } from '$lib/showcase/snippet-html'
import { buildHeaderLine, parseHeaderMarkup } from '$lib/showcase/snippet-header'

export type TriState = '' | 'yes' | 'no'

export interface EditDialogSnippetState {
  widthVariant: string
  widthVariantOn: boolean
  heightVariant: string
  heightVariantOn: boolean
  size: string
  sizeOn: boolean
  dirty: TriState
  dirtyOn: boolean
  pending: TriState
  pendingOn: boolean
  saveDisabled: TriState
  saveDisabledOn: boolean
  // Raw body markup committed from the row's code dialog; empty renders the
  // canonical TextInput below.
  children: string
  // The eye toggle off means the body snippet is not applied.
  childrenEnabled: boolean
  // Raw actions markup committed from the row's code dialog; empty renders the
  // canonical Format button below.
  actions: string
  // The eye toggle off means no actions snippet is applied.
  actionsEnabled: boolean
  closeLabel: string
  closeLabelOn: boolean
  discardLabel: string
  discardLabelOn: boolean
  discardMessage: string
  discardMessageOn: boolean
  discardTitle: string
  discardTitleOn: boolean
  resetLabel: string
  resetLabelOn: boolean
  saveLabel: string
  saveLabelOn: boolean
  title: string
  titleOn: boolean
  // Raw header markup committed from the row's code dialog; empty renders the
  // title fallback below.
  header: string
  // The eye toggle off means no header snippet is applied.
  headerOn: boolean
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

// Normalize a committed actions draft for storage: one trimmed line.
export function normalizeEditActionsDraft(draft: string): string {
  return draft
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}

const ACTIONS_RE = /^<Button variant="outline" type="button">([^<>{}]+)<\/Button>$/

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

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function unescapeAttr(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`    ${name}${value === 'yes' ? '' : '={false}'}`]
}

// Verbatim body lines carry the user's literal text, so `&` is escaped for
// compilation; `<`/`{` cannot appear (validation rejects them).
function escapeRawLine(line: string): string {
  return line.replace(/&/g, '&amp;')
}

// Actions labels carry the same literal text; the grammar already rejects
// `<`, `>` and `{`/`}`, so only `&` needs escaping.
function escapeActionsLabel(label: string): string {
  return label.replace(/&/g, '&amp;')
}

export function buildEditDialogSnippet({
  widthVariant,
  widthVariantOn,
  heightVariant,
  heightVariantOn,
  size,
  sizeOn,
  dirty,
  dirtyOn,
  pending,
  pendingOn,
  saveDisabled,
  saveDisabledOn,
  children,
  childrenEnabled,
  actions,
  actionsEnabled,
  closeLabel,
  closeLabelOn,
  discardLabel,
  discardLabelOn,
  discardMessage,
  discardMessageOn,
  discardTitle,
  discardTitleOn,
  resetLabel,
  resetLabelOn,
  saveLabel,
  saveLabelOn,
  title,
  titleOn,
  header,
  headerOn,
}: EditDialogSnippetState): string {
  // The body sits at 4 spaces, matching the dialog. Unset labels read the
  // localized defaults from scope, so customized text rides literals while the
  // cleared form applies no overrides. The eye toggle off means no body is
  // applied; otherwise custom markup emits verbatim, unset the canonical
  // TextInput.
  const bodyIndent = '    '
  const childLines = !childrenEnabled
    ? []
    : children
      ? children.split('\n').map(line => (line ? `${bodyIndent}${escapeRawLine(line)}` : line))
      : [`${bodyIndent}${buildEditBodyMarkup({ type: '', label: '' })}`]
  // The actions snippet sits first inside the dialog so its buttons land
  // before OK. The committed line carries the label only; the formatting
  // handler is fixed, matching the static demo's Format button.
  const actionLabel = actionsEnabled ? (parseEditActionsLabel(actions) ?? 'Format') : null
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
    headerOn && header
      ? ['    {#snippet header()}', `      ${escapeActionsLabel(header)}`, '    {/snippet}']
      : []
  const labelLine = (name: string, value: string, scopeRef: string, on: boolean): string =>
    value && on ? `${bodyIndent}${name}="${escapeAttr(value)}"` : `${bodyIndent}${name}={${scopeRef}}`
  return [
    '<Button variant="primary" onClick={() => (open = true)}>{openDialogLabel}</Button>',
    '',
    '{#if open}',
    '  <EditDialog',
    labelLine('title', title, 'dialogTitle', titleOn),
    labelLine('closeLabel', closeLabel, 'closeLabel', closeLabelOn),
    labelLine('saveLabel', saveLabel, 'okLabel', saveLabelOn),
    labelLine('resetLabel', resetLabel, 'resetLabel', resetLabelOn),
    labelLine('discardTitle', discardTitle, 'discardTitle', discardTitleOn),
    labelLine('discardMessage', discardMessage, 'discardMessage', discardMessageOn),
    labelLine('discardLabel', discardLabel, 'discardLabel', discardLabelOn),
    ...(widthVariantOn && widthVariant && widthVariant !== 'md' ? [`    widthVariant="${widthVariant}"`] : []),
    ...(heightVariantOn && heightVariant && heightVariant !== 'auto' ? [`    heightVariant="${heightVariant}"`] : []),
    ...(sizeOn && size ? [`    size="${size}"`] : []),
    ...(dirtyOn ? flagLine('dirty', dirty, 'no') : []),
    ...(pendingOn ? flagLine('pending', pending, 'no') : []),
    ...(saveDisabledOn ? flagLine('saveDisabled', saveDisabled, 'no') : []),
    '    onSave={() => (open = false)}',
    '    onReset={() => (draft = saved)}',
    ...(childLines.length > 0 || actionLines.length > 0 || headerLines.length > 0
      ? ['    onClose={() => (open = false)}>', ...actionLines, ...headerLines, ...childLines, '  </EditDialog>']
      : ['    onClose={() => (open = false)} />']),
    '{/if}',
  ].join('\n')
}
