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
})
