// Show-code source for the Buttons demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import { escapeRawLine } from '$lib/showcase/snippet-build'
import { sizeAttributeFragment } from '$lib/showcase/size-input'

export type ButtonsButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'

const BUTTON_VARIANTS: readonly string[] = ['primary', 'secondary', 'danger', 'outline', 'ghost']

export interface ButtonsSnippetState {
  align: string
  alignOn: boolean
  className: string
  classNameOn: boolean
  // The row's scale (a step name or a pixel number); empty is the `md` default.
  size: string
  sizeOn: boolean
  // The size every button in the row takes (demo data: the buttons are the
  // page's own markup, so the size rides them, not the row).
  buttonSize: string
  // Raw children markup committed from the row's code dialog; empty renders
  // the canonical pair below.
  children: string
  // The eye toggle off means the children snippet is not applied.
  childrenEnabled: boolean
}

export type ButtonsHtmlTag = 'div' | 'span' | 'p'

export type ButtonsChildSegment =
  | { kind: 'button'; variant: ButtonsButtonVariant; label: string }
  | { kind: 'html'; tag: ButtonsHtmlTag; text: string }
  | { kind: 'text'; text: string }

// The canonical children pair behind the default demo. Uses the resolved
// labels so the row's code dialog reads like the rendered markup.
export function buttonsChildrenSnippet(okLabel: string, cancelLabel: string): string {
  return [`<Button variant="primary">${okLabel}</Button>`, `<Button variant="outline">${cancelLabel}</Button>`].join(
    '\n',
  )
}

// Parse an edited children snippet into its buttons, plain elements, and
// text; null unless the draft is nothing but well-formed markup in any mix.
// Buttons take an optional known variant and plain `div`/`span`/`p` elements
// take text content only: attributes and nesting cannot render in the static
// demo, so they stay invalid. Labels and content cannot carry markup or
// expressions — neither survives verbatim emission. An absent Button variant
// renders as the Button default.
const TAG_RE = /<(div|span|p)>([^{<}]*)<\/\1>|<Button(?:\s+variant="([^"]*)")?\s*>([^{<}]*)<\/Button>/g

export function parseButtonsList(draft: string): ButtonsChildSegment[] | null {
  const segments: ButtonsChildSegment[] = []
  let buttons = 0
  let cursor = 0
  for (const match of draft.matchAll(TAG_RE)) {
    const gap = draft.slice(cursor, match.index ?? cursor)
    if (gap.includes('<') || gap.includes('{')) {
      return null
    }
    // Collapse internal runs so the static text matches the compiled seed,
    // where HTML collapses them the same way.
    const text = gap.trim().replace(/\s+/g, ' ')
    if (text !== '') {
      segments.push({ kind: 'text', text })
    }
    if (match[1] !== undefined) {
      segments.push({ kind: 'html', tag: match[1] as ButtonsHtmlTag, text: match[2]!.trim().replace(/\s+/g, ' ') })
    } else {
      const variant = match[3]
      if (variant !== undefined && !BUTTON_VARIANTS.includes(variant)) {
        return null
      }
      buttons += 1
      segments.push({
        kind: 'button',
        variant: (variant ?? 'secondary') as ButtonsButtonVariant,
        label: match[4]!.trim().replace(/\s+/g, ' '),
      })
    }
    cursor = (match.index ?? cursor) + match[0].length
  }
  const tail = draft.slice(cursor)
  if (tail.includes('<') || tail.includes('{')) {
    return null
  }
  const tailText = tail.trim().replace(/\s+/g, ' ')
  if (tailText !== '') {
    segments.push({ kind: 'text', text: tailText })
  }
  // A button-less row has nothing to lay out.
  return buttons > 0 ? segments : null
}

// Normalize a committed draft for storage: one trimmed button per line.
export function normalizeButtonsDraft(draft: string): string {
  return draft
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}

// Verbatim children lines carry the user's literal labels, so `&` is escaped
// for compilation; `<`/`{` cannot appear (validation rejects them), and the
// tags themselves carry no `&`.

// The size every button in the row takes rides each button, not the row: the
// buttons are the page's own markup, so the `Buttons` prop cannot reach them.
// The attribute is injected after the `<Button` tag, where it stays a plain
// attribute; `<Buttons` never appears in a committed draft (validation
// rejects it), so the lookahead keeps the tag boundary exact.
function withButtonSize(children: string, sizeAttr: string): string {
  if (!sizeAttr) return children
  return children.replace(/<Button(?=[\s>])/g, `<Button${sizeAttr}`)
}

export function buildButtonsSnippet({ align, alignOn, className, classNameOn, size, sizeOn, buttonSize, children, childrenEnabled }: ButtonsSnippetState): string {
  // A custom className replaces the default row, so align is omitted with it.
  const appliedClassName = classNameOn && className ? className : ''
  const attrs = [
    ...(!appliedClassName && alignOn && align && align !== 'left' ? [` align="${align}"`] : []),
    // The size drives the row's gap, which the custom className replaces too.
    ...(!appliedClassName && sizeOn && size !== '' && size !== 'md' ? [sizeAttributeFragment(size)] : []),
    ...(appliedClassName ? [` className="${appliedClassName}"`] : []),
  ].join('')
  // The buttons' own size is a separate knob: it rides each button, and the
  // `md` default is left implicit (a button at its default carries no size).
  const buttonSizeAttr = buttonSize && buttonSize !== 'md' ? sizeAttributeFragment(buttonSize) : ''
  // The eye toggle off means no children are applied: the layout renders empty.
  // Otherwise custom children emit verbatim; unset, the pair reads the localized
  // defaults from scope. `buildSource` drops the same-named scope key once
  // the snippet declares it, so a local value wins.
  const childLines = !childrenEnabled
    ? []
    : children
      ? withButtonSize(children, buttonSizeAttr)
          .split('\n')
          .map(line => (line ? `  ${escapeRawLine(line)}` : line))
      : [
          `  <Button${buttonSizeAttr} variant="primary">{okLabel}</Button>`,
          `  <Button${buttonSizeAttr} variant="outline">{cancelLabel}</Button>`,
        ]
  return [`<Buttons${attrs}>`, ...childLines, '</Buttons>'].join('\n')
}
