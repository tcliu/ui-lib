// Show-code source for the FormField demo section. Pure string building over
// the playground form state: the section regenerates the editor text from this,
// so the editor always shows the markup behind the demo above.
import { escapeAttr, escapeRawLine, unescapeAttr } from '$showcase/playground/snippet-build'
import { isBasicHtmlMarkup } from '$showcase/playground/snippet-html'
import { sizeAttributeFragment } from '$showcase/playground/size-input'
import type { Staged } from '$showcase/playground/staged'

export interface FormFieldSnippetState {
  label: Staged<string>
  htmlFor: Staged<string>
  className: Staged<string>
  layout: Staged<string>
  size: Staged<string>
  // Raw children markup committed from the row's code dialog; empty renders
  // the canonical TextInput below. Its eye off means the children snippet is
  // not applied.
  children: Staged<string>
}

export const STYLED_CLASS = 'rounded-md border border-cyan-500/40 p-3'

export interface FormFieldChildrenState {
  htmlFor: string
}

// The canonical child behind the default demo: the shared TextInput bound to
// the scope value, id-wired to the label while htmlFor is set. Unindented;
// the snippet builder indents committed lines at emit time.
export function buildFormFieldChildrenMarkup({ htmlFor }: FormFieldChildrenState): string {
  const idAttr = htmlFor ? ` id="${escapeAttr(htmlFor)}"` : ''
  return `<TextInput bind:value${idAttr} />`
}

// A TextInput line renders as a live control in the static demo; any other
// committed markup renders verbatim.
export type FormFieldChildSegment = { kind: 'textinput'; id: string } | { kind: 'html'; html: string }

const TEXTINPUT_RE = /^<TextInput bind:value(?: id="([^"]*)")? \/>$/

// Normalize a committed draft for storage: one trimmed line per row.
export function normalizeFormFieldChildrenDraft(draft: string): string {
  return draft
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}

// Parse an edited children draft into the normalized markup to store, or null
// unless every line is a TextInput control or basic plain HTML/text (see
// `isBasicHtmlMarkup`). Text without markup is valid (it renders verbatim);
// an empty draft is not (the eye toggle covers removal).
export function parseFormFieldChildrenMarkup(draft: string): string | null {
  const normalized = normalizeFormFieldChildrenDraft(draft)
  if (normalized === '') {
    return null
  }
  const htmlLines: string[] = []
  for (const line of normalized.split('\n')) {
    if (TEXTINPUT_RE.test(line)) {
      continue
    }
    htmlLines.push(line)
  }
  if (htmlLines.length > 0 && !isBasicHtmlMarkup(htmlLines.join('\n'))) {
    return null
  }
  return normalized
}

// Split validated children markup into the segments the static demo renders.
// Stored drafts are always valid, so the fallback only covers direct calls
// with unvalidated text.
export function parseFormFieldChildSegments(markup: string): FormFieldChildSegment[] | null {
  if (parseFormFieldChildrenMarkup(markup) === null) {
    return null
  }
  const segments: FormFieldChildSegment[] = []
  let html: string[] = []
  const flush = () => {
    if (html.length > 0) {
      segments.push({ kind: 'html', html: html.join('\n') })
      html = []
    }
  }
  for (const line of normalizeFormFieldChildrenDraft(markup).split('\n')) {
    const match = line.match(TEXTINPUT_RE)
    if (match) {
      flush()
      segments.push({ kind: 'textinput', id: match[1] ? unescapeAttr(match[1]) : '' })
    } else {
      html.push(line)
    }
  }
  flush()
  return segments
}

// Verbatim children lines carry the user's literal text, so `&` is escaped
// for compilation; `<`/`{` cannot appear (validation rejects them).

export function buildFormFieldSnippet({
  label,
  htmlFor,
  className,
  layout,
  size,
  children,
}: FormFieldSnippetState): string {
  const labelAttr = label.on && label.value ? ` label="${escapeAttr(label.value)}"` : ' label={defaultLabel}'
  const forAttr = htmlFor.on && htmlFor.value ? ` htmlFor="${escapeAttr(htmlFor.value)}"` : ''
  // The layout prefills its component default in the Value column; the
  // builder omits the default so Show-code stays minimal.
  const layoutAttr = layout.on && layout.value && layout.value !== 'stacked' ? ` layout="${escapeAttr(layout.value)}"` : ''
  const classAttr = className.on && className.value ? ` className="${escapeAttr(className.value)}"` : ''
  // The size row prefills its `md` default; the builder omits it too.
  const sizeAttr = size.on && size.value && size.value !== 'md' ? sizeAttributeFragment(size.value) : ''
  // The eye toggle off means no children are applied. Otherwise custom
  // children emit verbatim; unset, the canonical TextInput reads the
  // localized default label from scope alongside its bound value.
  const canonicalHtmlFor = htmlFor.on && htmlFor.value ? htmlFor.value : ''
  const childLines = !children.on
    ? []
    : children.value
      ? children.value.split('\n').map(line => (line ? `  ${escapeRawLine(line)}` : line))
      : [`  ${buildFormFieldChildrenMarkup({ htmlFor: canonicalHtmlFor })}`]
  if (childLines.length === 0) {
    return [`<FormField${labelAttr}${forAttr}${layoutAttr}${classAttr}${sizeAttr}></FormField>`].join('\n')
  }
  return [`<FormField${labelAttr}${forAttr}${layoutAttr}${classAttr}${sizeAttr}>`, ...childLines, '</FormField>'].join('\n')
}
