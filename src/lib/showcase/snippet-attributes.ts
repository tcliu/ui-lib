// Shared snippet-tag attribute extractor for the showcase playground. A page
// whose Show-code seed renders a demo component tag uses this to write a
// compiled edit's recognized attributes back into playground state, so snippet
// edits surface in the props table's Value column. Pure string scanning (no
// compiler import), so it unit-tests without a browser.

export type SnippetAttribute =
  { kind: 'string'; value: string } | { kind: 'expression'; value: string } | { kind: 'bare' }

// Extract the first `<Tag ... />` tag's attributes from snippet source.
// Returns null when no complete tag exists (a custom experiment the page must
// leave alone). The scan tracks quote/brace depth, so `=>` inside an expression
// never ends the tag early; anything not modeled (spreads, directives) also
// bails out rather than syncing a partial picture.
export function extractComponentAttributes(source: string, tag: string): Map<string, SnippetAttribute> | null {
  const start = source.indexOf(`<${tag}`)
  if (start < 0) {
    return null
  }
  const attrs = new Map<string, SnippetAttribute>()
  const isWs = (ch: string): boolean => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'
  let i = start + tag.length + 1
  while (i < source.length) {
    while (i < source.length && isWs(source[i]!)) {
      i += 1
    }
    if (source.startsWith('/>', i) || source[i] === '>') {
      return attrs
    }
    const name = /^[A-Za-z][A-Za-z0-9$]*/.exec(source.slice(i))?.[0]
    if (!name) {
      return null
    }
    i += name.length
    let j = i
    while (j < source.length && isWs(source[j]!)) {
      j += 1
    }
    if (source[j] !== '=') {
      // A bare attribute; the loop validates whatever follows.
      attrs.set(name, { kind: 'bare' })
      i = j
      continue
    }
    i = j + 1
    while (i < source.length && isWs(source[i]!)) {
      i += 1
    }
    const quote = source[i]
    if (quote === '"' || quote === "'") {
      let end = i + 1
      while (end < source.length && (source[end] !== quote || source[end - 1] === '\\')) {
        end += 1
      }
      if (end >= source.length) {
        return null
      }
      attrs.set(name, { kind: 'string', value: source.slice(i + 1, end) })
      i = end + 1
      continue
    }
    if (source[i] === '{') {
      let depth = 0
      let k = i
      let openQuote: string | null = null
      while (k < source.length) {
        const ch = source[k]!
        if (openQuote) {
          if (ch === openQuote) {
            openQuote = null
          }
        } else if (ch === '"' || ch === "'") {
          openQuote = ch
        } else if (ch === '{') {
          depth += 1
        } else if (ch === '}') {
          depth -= 1
          if (depth === 0) {
            break
          }
        }
        k += 1
      }
      if (depth !== 0) {
        return null
      }
      attrs.set(name, { kind: 'expression', value: source.slice(i + 1, k).trim() })
      i = k + 1
      continue
    }
    return null
  }
  return null
}

// Read a script-local `let <name> = $state("...")` back out of snippet
// declarations (the shape demo builders emit via JSON.stringify). Returns null
// when absent or unparseable, so hand-written state the page did not author
// never syncs.
export function extractScriptValue(declarations: string, name = 'value'): string | null {
  const match = new RegExp(`let\\s+${name}\\s*=\\s*\\$state\\(\\s*("(?:[^"\\\\]|\\\\.)*")\\s*\\)`).exec(declarations)
  if (!match) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(match[1]!)
    return typeof parsed === 'string' ? parsed : null
  } catch {
    return null
  }
}

// Read a script-local `let <name> = $state(<const>)` JSON literal back out of
// snippet declarations (the shape demo builders emit for seeded collections and
// objects). `open` selects the literal's opening delimiter, so an array seed and
// an object seed share one quote/escape-aware balanced-bracket scan. Returns the
// parsed JSON (validate its shape at the call site), or null when absent,
// unbalanced, or unparseable, so hand-written state the page did not author
// never syncs.
export function extractScriptConst(
  declarations: string,
  name: string,
  open: '[' | '{' = '[',
): unknown | null {
  const close = open === '[' ? ']' : '}'
  const head = new RegExp(`let\\s+${name}\\s*=\\s*\\$state\\(\\s*\\${open}`).exec(declarations)
  if (!head) {
    return null
  }
  let depth = 0
  let openQuote: string | null = null
  let k = head.index + head[0].length - 1
  while (k < declarations.length) {
    const ch = declarations[k]!
    if (openQuote) {
      if (ch === '\\') {
        k += 2
        continue
      }
      if (ch === openQuote) {
        openQuote = null
      }
    } else if (ch === '"' || ch === "'") {
      openQuote = ch
    } else if (ch === open) {
      depth += 1
    } else if (ch === close) {
      depth -= 1
      if (depth === 0) {
        break
      }
    }
    k += 1
  }
  if (depth !== 0) {
    return null
  }
  try {
    return JSON.parse(declarations.slice(head.index + head[0].length - 1, k + 1))
  } catch {
    return null
  }
}

// An array seed: `let <name> = $state([...])`.
export function extractScriptJsonConst(declarations: string, name: string): unknown | null {
  return extractScriptConst(declarations, name, '[')
}
