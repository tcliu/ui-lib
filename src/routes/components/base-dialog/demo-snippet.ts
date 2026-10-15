// Show-code source for the BaseDialog demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

export interface BaseDialogSnippetState {
  widthVariant: string
  widthVariantOn: boolean
  heightVariant: string
  heightVariantOn: boolean
  size: string
  sizeOn: boolean
  className: string
  classNameOn: boolean
  children: string
  childrenOn: boolean
  title: string
  titleOn: boolean
  closeLabel: string
  closeLabelOn: boolean
  // Raw header markup committed from the row's code dialog; empty renders the
  // title fallback below.
  header: string
  // The eye toggle off means no header snippet is applied.
  headerOn: boolean
  // Raw footer markup committed from the row's code dialog; empty renders no
  // footer below the body.
  footer: string
  // The eye toggle off means no footer snippet is applied.
  footerOn: boolean
}

export const STYLED_PANEL = 'border-cyan-500/40'

// The default body paragraph and buttons, resolved from locale for the
// dialog seed; committing this canonical shape resets to unset.
export interface BaseBodyButton {
  variant: BaseBodyButtonVariant
  label: string
  // Click handler: the exact `onClick={() => (open = false)}` dismiss literal
  // closes directly; any other balanced-brace expression runs verbatim (the
  // demo dispatches it, the seed compiles it); absent renders no handler.
  // Free-form text outside a balanced expression stays invalid — the static
  // demo could not reproduce it.
  onClick: string | null
}

// The dismiss handler literal, shared by the dialog seed, the demo shortcut,
// and the canonical compare below.
export const DISMISS_HANDLER = '() => (open = false)'

export type BaseBodyButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'

export interface BaseBodyContent {
  body: string
  buttons: BaseBodyButton[]
}

const BASE_BUTTON_VARIANTS: readonly BaseBodyButtonVariant[] = ['primary', 'secondary', 'danger', 'outline', 'ghost']

// Canonical children lines from literals: the paragraph, then the
// right-aligned button row. Used for the dialog seed and for comparing a
// commit back to the resolved default. `&` escapes for compilation; `<`/`>`
// cannot appear (validation rejects them).
export function buildBaseBodyLines({ body, buttons }: BaseBodyContent): string {
  return [
    `<p>${escapeRawLine(body)}</p>`,
    '<Buttons align="right">',
    ...buttons.map(
      ({ variant, label, onClick }) =>
        `  <Button variant="${variant}"${onClick ? ` onClick={${onClick}}` : ''}>${escapeRawLine(label)}</Button>`,
    ),
    '</Buttons>',
  ].join('\n')
}

// Capture a balanced-brace `{…}` expression starting at the given offset
// (quotes respected). Null when unbalanced, so the dialog blocks OK instead
// of applying markup the row cannot reproduce.
function captureBalanced(text: string, offset: string | number): string | null {
  const start = typeof offset === 'number' ? offset : text.indexOf(offset)
  if (start < 0 || text[start] !== '{') {
    return null
  }
  let depth = 0
  let quote: string | null = null
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]!
    if (quote) {
      if (char === '\\') {
        index += 1
      } else if (char === quote) {
        quote = null
      }
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char
    } else if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(start + 1, index)
      }
    }
  }
  return null
}

// Parse a children draft into its paragraph text and buttons. Null unless the
// draft is exactly the paragraph plus the fixed button row: labels and text
// cannot carry markup or expressions (neither survives verbatim emission),
// and only known Button variants apply. An absent variant reads as the Button
// default; an absent handler reads as a no-op button.
export function parseBaseBodyMarkup(draft: string): BaseBodyContent | null {
  const lines = draft
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  if (lines.length < 4) {
    return null
  }
  const bodyMatch = lines[0]?.match(/^<p>([^{<>]*)<\/p>$/)
  if (!bodyMatch || lines[1] !== '<Buttons align="right">' || lines[lines.length - 1] !== '</Buttons>') {
    return null
  }
  const buttons: BaseBodyButton[] = []
  for (const line of lines.slice(2, -1)) {
    const openMatch = line.match(/^<Button((?: variant="[^"]*")?)( onClick=\{)?/)
    if (!openMatch) {
      return null
    }
    const variantMatch = openMatch[1]?.match(/^ variant="([^"]*)"$/)
    const variant = (variantMatch?.[1] ?? 'secondary') as BaseBodyButtonVariant
    let onClick: string | null = null
    let rest = line.slice(openMatch[0].length)
    if (openMatch[2]) {
      const at = line.indexOf(' onClick={')
      const expression = captureBalanced(line, at + ' onClick='.length)
      if (expression === null || expression.trim() === '') {
        return null
      }
      onClick = expression
      rest = line.slice(at + ' onClick={'.length + expression.length + 1)
    }
    const labelMatch = rest.match(/^>([^{<>]*)<\/Button>$/)
    if (!BASE_BUTTON_VARIANTS.includes(variant) || !labelMatch || labelMatch[1]?.trim() === '') {
      return null
    }
    buttons.push({ variant, label: unescapeRawLine(labelMatch[1]!.trim()), onClick })
  }
  if (buttons.length === 0) {
    return null
  }
  return { body: unescapeRawLine(bodyMatch[1]!.trim()), buttons }
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// Verbatim children lines carry the user's literal labels, so `&` is escaped
// for compilation; `<`/`{` cannot appear (validation rejects them).
function escapeRawLine(value: string): string {
  return value.replace(/&/g, '&amp;')
}

function unescapeRawLine(value: string): string {
  return value.replace(/&amp;/g, '&')
}

// Footer buttons committed from the row's code dialog: variant plus label per
// line. The static demo replays the same buttons with dismiss handlers while
// committed markup renders verbatim in the seed, so the dialog rejects
// anything the demo cannot reproduce exactly.
export interface BaseFooterButton {
  variant: BaseBodyButtonVariant | null
  label: string
}

const FOOTER_OPEN = '<Buttons align="right">'
const FOOTER_CLOSE = '</Buttons>'

// Parse a footer draft into its buttons, or null unless it is exactly the
// Buttons block above with one or more plain-label Button lines (an absent
// variant reads as the Button default); an empty draft is not (the eye toggle
// covers removal).
export function parseFooterMarkup(draft: string): BaseFooterButton[] | null {
  const lines = draft
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  if (lines.length < 3 || lines[0] !== FOOTER_OPEN || lines[lines.length - 1] !== FOOTER_CLOSE) {
    return null
  }
  const buttons: BaseFooterButton[] = []
  for (const line of lines.slice(1, -1)) {
    const match = line.match(/^<Button(?: variant="([^"]*)")?>([^<>{}]*)<\/Button>$/)
    if (!match || match[2] === undefined) {
      return null
    }
    const variant = match[1] ?? null
    if (variant !== null && !BASE_BUTTON_VARIANTS.includes(variant as BaseBodyButtonVariant)) {
      return null
    }
    const label = unescapeRawLine(match[2].trim())
    if (label === '') {
      return null
    }
    buttons.push({ variant: variant as BaseBodyButtonVariant | null, label })
  }
  return buttons
}

// Canonical footer lines from literals: the Buttons block around the given
// buttons. Used for the row seed and for comparing a commit back to the
// resolved default. `&` escapes for compilation; `<`/`{` cannot appear
// (validation rejects them).
export function buildFooterLines(buttons: BaseFooterButton[]): string {
  return [
    FOOTER_OPEN,
    ...buttons.map(
      ({ variant, label }) =>
        `  <Button${variant ? ` variant="${variant}"` : ''}>${escapeRawLine(label)}</Button>`,
    ),
    FOOTER_CLOSE,
  ].join('\n')
}


export function buildBaseDialogSnippet({
  widthVariant,
  widthVariantOn,
  heightVariant,
  heightVariantOn,
  size,
  sizeOn,
  className,
  classNameOn,
  children,
  childrenOn,
  title,
  titleOn,
  closeLabel,
  closeLabelOn,
  header,
  headerOn,
  footer,
  footerOn,
}: BaseDialogSnippetState): string {
  // The eye toggle off means no children are applied. Otherwise custom
  // children render from their parsed segments (buttons gain the dismiss
  // The eye toggle off means no children are applied. Otherwise the page
  // feeds the dialog's exact markup (committed, or the canonical resolved
  // block when unset), so the editor text and the seed's inner content match
  // line-for-line modulo indent. Handlers emit verbatim, so the seed
  // compiles them.
  const parsed = childrenOn ? parseBaseBodyMarkup(children) : null
  // Slot snippets sit inside the dialog behind the body so the seed compiles
  // the same header/footer the static demo renders; committed lines emit
  // verbatim (validation at commit guarantees the shape).
  const headerLines =
    headerOn && header ? ['    {#snippet header()}', `      ${escapeRawLine(header)}`, '    {/snippet}'] : []
  const footerLines =
    footerOn && footer
      ? [
          '    {#snippet footer()}',
          ...footer.split('\n').map(line => (line ? `      ${escapeRawLine(line)}` : line)),
          '    {/snippet}',
        ]
      : []
  const slotLines = [...headerLines, ...footerLines]
  const childLines = parsed
    ? [
        '    onCancel={() => (open = false)}>',
        ...slotLines,
        ...buildBaseBodyLines(parsed)
          .split('\n')
          .map(line => `      ${line}`),
        '  </BaseDialog>',
      ]
    : slotLines.length > 0
      ? ['    onCancel={() => (open = false)}>', ...slotLines, '  </BaseDialog>']
      : ['    onCancel={() => (open = false)} />']
  const lines = [
    '<Button variant="primary" onClick={() => (open = true)}>{openDialogLabel}</Button>',
    '',
    '{#if open}',
    '  <BaseDialog',
    ...(titleOn && title ? [`    title="${escapeAttr(title)}"`] : ['    title={dialogTitle}']),
    ...(closeLabelOn && closeLabel ? [`    closeLabel="${escapeAttr(closeLabel)}"`] : []),
    ...(classNameOn && className ? [`    className="${className}"`] : []),
    ...(widthVariantOn && widthVariant && widthVariant !== 'md' ? [`    widthVariant="${widthVariant}"`] : []),
    ...(heightVariantOn && heightVariant && heightVariant !== 'auto' ? [`    heightVariant="${heightVariant}"`] : []),
    ...(sizeOn && size ? [`    size="${size}"`] : []),
    ...childLines,
    '{/if}',
  ]
  return lines.join('\n')
}
