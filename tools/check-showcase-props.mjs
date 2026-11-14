#!/usr/bin/env node

// Gate: the showcase props table documents the whole component surface.
//
// Every prop a component destructures in `$props()` must have a `FieldConfig`
// row on its showcase page, and every primitive-typed row must be editable (a
// shared row helper or an explicit `editor`). Function props, data objects, DOM
// refs, and snippets stay read-only; the same rule is stated in `AGENTS.md`.
//
// The component list and each page's rows are the two inventories compared
// here, so a page cannot drift from its component: a new prop without a row,
// or a requested-type audit that leaves a primitive row editor-less, fails
// `npm run check`.
//
// Args: [project-dir] (defaults to cwd). Exit 1 on any violation.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const COMPONENTS_FILE = 'src/app/showcase/index/showcase-components.ts'
const PAGES_ROOT = 'src/routes/components'
const COMPONENTS_ROOT = 'src/lib/components'
// The page indexes the glyph set rather than one component.
const SKIP_COMPONENTS = new Set(['Icons'])

// Strip line and block comments while keeping strings intact, so a bracket or
// comma inside a note or markup string cannot alter the structure.
function stripComments(source) {
  let out = ''
  let inStr = null
  for (let i = 0; i < source.length; i++) {
    const c = source[i]
    const next = source[i + 1]
    if (inStr) {
      out += c
      if (c === '\\') {
        out += source[++i] ?? ''
        continue
      }
      if (c === inStr) inStr = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      inStr = c
      out += c
      continue
    }
    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++
      out += '\n'
      continue
    }
    if (c === '/' && next === '*') {
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++
      i++
      continue
    }
    out += c
  }
  return out
}

// Split on top-level commas, respecting strings and nested brackets.
function splitTopLevel(body) {
  const parts = []
  let depth = 0
  let inStr = null
  let cur = ''
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (inStr) {
      cur += c
      if (c === '\\') {
        cur += body[++i] ?? ''
        continue
      }
      if (c === inStr) inStr = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      inStr = c
      cur += c
      continue
    }
    if (c === '(' || c === '[' || c === '{') depth++
    if (c === ')' || c === ']' || c === '}') depth--
    if (c === ',' && depth === 0) {
      parts.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  if (cur.trim()) parts.push(cur)
  return parts
}

// Slice the array whose opening bracket is at `openIndex`, ignoring brackets in
// strings and comments. Returns the inner text or null when unterminated.
export function sliceArray(source, openIndex) {
  let depth = 0
  let inStr = null
  let line = false
  let block = false
  for (let i = openIndex; i < source.length; i++) {
    const c = source[i]
    const next = source[i + 1]
    if (line) {
      if (c === '\n') line = false
      continue
    }
    if (block) {
      if (c === '*' && next === '/') {
        block = false
        i++
      }
      continue
    }
    if (inStr) {
      if (c === '\\') {
        i++
        continue
      }
      if (c === inStr) inStr = null
      continue
    }
    if (c === '/' && next === '/') {
      line = true
      i++
      continue
    }
    if (c === '/' && next === '*') {
      block = true
      i++
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      inStr = c
      continue
    }
    if (c === '[' || c === '(' || c === '{') depth++
    else if (c === ']' || c === ')' || c === '}') {
      depth--
      if (depth === 0) return source.slice(openIndex + 1, i)
    }
  }
  return null
}

// The props a component destructures from `$props()`, in declaration order.
// Rest elements (`...rest`) are forwarded untouched and carry no row of their
// own; a rename (`state: tabState`) keeps the public prop name.
export function destructuredProps(source) {
  const match = source.match(/let\s*\{([\s\S]*?)\}\s*(?::[^=]*)?=\s*\$props\(\)/)
  if (!match) return null
  const names = []
  for (const raw of splitTopLevel(stripComments(match[1]))) {
    const entry = raw.trim()
    if (!entry || entry.startsWith('...')) continue
    const quoted = entry.match(/^'([^']+)'\s*(?:[:=]|$)/)
    if (quoted) {
      names.push(quoted[1])
      continue
    }
    const key = entry.match(/^([A-Za-z_$][\w$]*)\s*(?:[:=]|$)/)
    if (key) names.push(key[1])
  }
  return names
}

// The page's `fields` array body: `$derived([...])` or a plain array literal.
export function fieldsBody(source) {
  const derived = source.search(/const\s+fields\b[^=]*=\s*\$derived\(\[/)
  if (derived >= 0) {
    const open = source.indexOf('$derived([', derived) + '$derived('.length
    return sliceArray(source, open)
  }
  const plain = source.search(/const\s+fields\b[^=]*=\s*\[/)
  if (plain >= 0) return sliceArray(source, source.indexOf('[', plain))
  return null
}

const ROW_HELPERS = new Set(['sizeField', 'componentRatiosField', 'snippetField', 'jsonField', 'textField', 'boolField', 'enumField'])
const HELPER_NAMES = { sizeField: 'size', componentRatiosField: 'ratios' }

// One entry per props-table row: its prop name, whether it carries an editor,
// and its declared type when the row spells one out.
export function fieldRows(body) {
  return splitTopLevel(stripComments(body))
    .map(row => row.trim())
    .filter(Boolean)
    .map(row => {
      const helper = row.match(/^([A-Za-z_$][\w$]*)\s*\(/)
      const nameMatch = row.match(/name:\s*'([^']+)'/) || row.match(/name:\s*"([^"]+)"/)
      const name = nameMatch?.[1] ?? nameMatch?.[2] ?? HELPER_NAMES[helper?.[1]] ?? null
      const typeMatch = row.match(/type:\s*'([^']*)'/) || row.match(/type:\s*"([^"]*)"/)
      const helperName = helper && ROW_HELPERS.has(helper[1]) ? helper[1] : null
      return {
        name,
        type: typeMatch?.[1] ?? null,
        hasEditor: Boolean(helperName) || /editor:\s*'/.test(row),
      }
    })
}

// A row whose declared type is a string, number, boolean, or a union of those
// literals must be editable; anything compound (functions, arrays, objects,
// DOM refs, snippets) is read-only.
export function isPrimitiveType(type) {
  if (!type) return false
  const bare = type.trim().replace(/\?$/, '')
  if (bare === 'string' || bare === 'number' || bare === 'boolean') return true
  if (/[(){}[\]<>=]/.test(bare)) return false
  const parts = bare.split('|').map(part => part.trim()).filter(Boolean)
  if (!parts.length) return false
  return parts.every(
    part =>
      /^'[^']*'$/.test(part) ||
      /^"[^"]*"$/.test(part) ||
      /^-?\d+$/.test(part) ||
      part === 'true' ||
      part === 'false',
  )
}

// Registered showcase components, from the index's single source of truth.
export function readComponents(source) {
  return [...source.matchAll(/\{\s*slug:\s*'([^']+)',\s*name:\s*'([^']+)'\s*\}/g)].map(match => ({
    slug: match[1],
    component: match[2],
  }))
}

// Compare every registered page's rows to its component's declared props.
// Returns `{ pages, props, violations }` where a violation names the page and
// the missing or editor-less prop.
export function collectViolations(root) {
  const components = readComponents(readFileSync(join(root, COMPONENTS_FILE), 'utf8'))
  const violations = []
  let pages = 0
  let props = 0
  for (const { slug, component } of components) {
    if (SKIP_COMPONENTS.has(component)) continue
    const pagePath = join(root, PAGES_ROOT, slug, '+page.svelte')
    const componentPath = join(root, COMPONENTS_ROOT, `${component}.svelte`)
    if (!existsSync(pagePath) || !existsSync(componentPath)) {
      violations.push({ page: slug, reason: `missing ${existsSync(pagePath) ? componentPath : pagePath}` })
      continue
    }
    const declared = destructuredProps(readFileSync(componentPath, 'utf8'))
    if (declared === null) {
      violations.push({ page: slug, reason: `${component} declares no $props() destructure` })
      continue
    }
    const body = fieldsBody(readFileSync(pagePath, 'utf8'))
    if (body === null) {
      violations.push({ page: slug, reason: 'page declares no fields array' })
      continue
    }
    pages++
    props += declared.length
    const rows = fieldRows(body)
    const names = new Set(rows.map(row => row.name).filter(Boolean))
    for (const prop of declared) {
      if (!names.has(prop)) violations.push({ page: slug, reason: `${prop} has no props-table row` })
    }
    for (const row of rows) {
      if (row.name && !row.hasEditor && isPrimitiveType(row.type)) {
        violations.push({ page: slug, reason: `${row.name} (${row.type}) has no editor` })
      }
    }
  }
  return { pages, props, violations }
}

export function formatReport({ pages, props, violations }) {
  if (!violations.length) return `showcase-props: ${pages} page(s) cover all ${props} declared prop(s)`
  return [
    'showcase-props: the props table does not match the component surface:',
    ...violations.map(({ page, reason }) => `  - ${page}: ${reason}`),
  ].join('\n')
}

function main() {
  const root = process.argv[2] ?? process.cwd()
  let report
  try {
    report = collectViolations(root)
  } catch (error) {
    console.error(`showcase-props: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
  const text = formatReport(report)
  if (report.violations.length) {
    console.error(text)
    process.exit(1)
  }
  console.log(text)
}

const isCli = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href
if (isCli) main()
