// Shared grammar for dialog header-slot rows: a single Copyable title line,
// so every dialog page drives the slot with the same constrained shape its
// static demo reproduces exactly. Pure string building and parsing (no runes),
// so it unit-tests without a browser.

export interface HeaderContent {
  /** Copy source and accessible text behind the title. */
  text: string
  /** Visible title label inside the Copyable. */
  inner: string
}

const HEADER_RE = /^<Copyable text="([^"]+)"><span>([^<>{}]*)<\/span><\/Copyable>$/

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function unescapeAttr(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

// Canonical header line from literals. Unindented; the snippet builder
// indents it at emit time. `&` escapes for compilation; `<`/`{` cannot appear
// (validation rejects them) and `"` cannot appear in the attribute.
export function buildHeaderLine({ text, inner }: HeaderContent): string {
  return `<Copyable text="${escapeAttr(text)}"><span>${inner.replace(/&/g, '&amp;')}</span></Copyable>`
}

// Parse a header draft into its copy text and inner label, or null unless it
// is exactly the single Copyable line above with non-blank facets; an empty
// draft is not (the eye toggle covers removal).
export function parseHeaderMarkup(draft: string): HeaderContent | null {
  const line = draft
    .split('\n')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .join('\n')
  const match = line.match(HEADER_RE)
  if (!match || match[1] === undefined || match[2] === undefined) {
    return null
  }
  const text = unescapeAttr(match[1]).trim()
  const inner = match[2].replace(/&amp;/g, '&').trim()
  if (text === '' || inner === '') {
    return null
  }
  return { text, inner }
}
