import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildSource } from './snippet-source'
import { SNIPPET_PREAMBLE_IMPORTS, createSnippetComponent } from './snippet-playground'

describe('snippet playground registry', () => {
  it('injects the ColumnsIcon import into the compiled preamble', () => {
    const source = buildSource({
      markup: '<ColumnsIcon />',
      declarations: '',
      scopeKeys: [],
      declaredNames: new Set<string>(),
      componentImports: SNIPPET_PREAMBLE_IMPORTS,
    })
    expect(source).toContain('import ColumnsIcon from "ui/ColumnsIcon.svelte"')
  })

  it('resolves the ColumnsIcon registry entry when compiling a snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent('<ColumnsIcon />', {})
    expect(typeof component).toBe('function')
  })

  // The icon gallery's seed names every glyph, so the preamble must import them
  // all: an unregistered glyph compiles to an undefined component and the
  // playground fails on open.
  it('registers every glyph under src/lib/icons in the preamble', () => {
    const glyphs = readdirSync(join(process.cwd(), 'src/lib/icons'))
      .filter(name => name.endsWith('Icon.svelte'))
      .sort()
    const registered = [...SNIPPET_PREAMBLE_IMPORTS.matchAll(/"ui\/([A-Za-z]+Icon\.svelte)"/g)]
      .map(match => match[1])
      .sort()
    expect(registered).toEqual(glyphs)
  })
})
