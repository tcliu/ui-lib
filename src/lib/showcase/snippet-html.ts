// Basic HTML validation for the showcase's verbatim children rows (plain-HTML
// segments beside component lines). Pure string scanning, so it unit-tests
// without a browser.
//
// Accepts well-formed balanced markup whose constructs the browser and the
// Svelte compiler render identically through `{@html}` and the seed. Rejects
// the outlier cases that would render differently once compiled: a `{…}`
// expression, comment, `<script>`/`<style>`/`<slot>`, a capitalized
// (component) tag, a Svelte directive (`bind:`, `class:`, …), or an `on*=`
// handler. Empty markup counts as valid here; callers reject it themselves
// (the eye toggle covers removal).
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

// One HTML tag: opening, closing, or self-closing. Quoted attribute values may
// contain `<`/`>` without ending the tag.
const TAG_RE = /<\/?([a-zA-Z][\w.-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g

export function isBasicHtmlMarkup(markup: string): boolean {
  if (/[{}]/.test(markup) || markup.includes('<!--')) {
    return false
  }
  if (/<\/?(?:script|style|slot)(?=[\s>/])/i.test(markup) || /<svelte:/i.test(markup)) {
    return false
  }
  const stack: string[] = []
  let cursor = 0
  for (const match of markup.matchAll(TAG_RE)) {
    const raw = match[0]!
    const at = match.index ?? cursor
    if (markup.slice(cursor, at).includes('<')) {
      return false
    }
    cursor = at + raw.length
    const name = match[1]!
    const lower = name.toLowerCase()
    if (raw.startsWith('</')) {
      if (stack.pop() !== lower) {
        return false
      }
      continue
    }
    // A capitalized tag is a Svelte component in the seed, not an element.
    if (/^[A-Z]/.test(name)) {
      return false
    }
    // Attribute names: a `:` is a Svelte directive and `on*=` an event
    // handler; both compile in the seed but stay literal under `{@html}`.
    // Quoted values are stripped first so a name word inside a value never
    // trips the check.
    const attrs = (match[2] ?? '').replace(/"[^"]*"|'[^']*'/g, ' ')
    if (attrs.includes(':') || /\son\w+\s*=/i.test(attrs)) {
      return false
    }
    if (match[3] === '/') {
      // HTML ignores `/>` on a non-void element, so it would not reproduce.
      if (!VOID_ELEMENTS.has(lower)) {
        return false
      }
    } else if (!VOID_ELEMENTS.has(lower)) {
      stack.push(lower)
    }
  }
  if (markup.slice(cursor).includes('<') || stack.length > 0) {
    return false
  }
  return true
}
