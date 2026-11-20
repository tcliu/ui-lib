#!/usr/bin/env node
// Markup-text gate. In a Svelte component's markup a `//` line is not a
// comment — Svelte emits it as a text node, so it renders on every page that
// mounts the component (a shared props table leaks it everywhere). A markup
// note is an HTML comment; `//` stays inside a `<script>` block or a `{...}`
// expression, which the AST does not report as text.
//
// Run from the project root:
//   node tools/check-markup-text.mjs
// Exits non-zero and names every leaking line, so `npm run check` fails on it.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'svelte/compiler'

const ROOT = process.cwd()
const DIRS = ['src/lib/components', 'src/app', 'src/routes']

function svelteFiles(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.svelte-kit') {
        svelteFiles(path, out)
      }
    } else if (entry.name.endsWith('.svelte')) {
      out.push(path)
    }
  }
  return out
}

function lineOf(source, offset) {
  let line = 1
  for (let index = 0; index < offset && index < source.length; index += 1) {
    if (source[index] === '\n') line += 1
  }
  return line
}

// Walks every child-bearing node without assuming one AST shape; the visited
// set keeps shared references from looping.
function textNodes(root) {
  const found = []
  const visited = new WeakSet()
  const stack = [root]
  while (stack.length > 0) {
    const node = stack.pop()
    if (!node || typeof node !== 'object' || visited.has(node)) continue
    visited.add(node)
    if (node.type === 'Text' && typeof node.data === 'string') {
      found.push(node)
      continue
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === 'object') stack.push(child)
        }
      } else if (value && typeof value === 'object') {
        stack.push(value)
      }
    }
  }
  return found
}

export function collectViolations(files) {
  const violations = []
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    let ast
    try {
      ast = parse(source, { modern: true })
    } catch (error) {
      violations.push(`${relative(ROOT, file)}: cannot parse (${error.message})`)
      continue
    }
    for (const node of textNodes(ast.fragment)) {
      let offset = node.start
      for (const line of node.data.split('\n')) {
        if (/^\s*\/\//.test(line)) {
          const index = offset + line.indexOf('//')
          violations.push(`${relative(ROOT, file)}:${lineOf(source, index)} — ${line.trim()}`)
        }
        offset += line.length + 1
      }
    }
  }
  return violations
}

function main() {
  const files = DIRS.flatMap(dir => svelteFiles(join(ROOT, dir)))
  const violations = collectViolations(files)
  if (violations.length === 0) {
    console.log(`markup-text: ${files.length} component(s), no comment text leaks into the DOM`)
    return
  }
  console.log(`markup-text: ${violations.length} comment line(s) rendered as text:`)
  for (const violation of violations) console.log(`  ${violation}`)
  console.log('\nUse an HTML comment (`<!-- ... -->`) in markup; `//` is text there.')
  process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
