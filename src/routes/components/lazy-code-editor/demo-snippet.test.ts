import { describe, expect, it } from 'vitest'
import { DEFAULT_CONTENT, buildLazyCodeEditorSnippet } from './demo-snippet'

describe('buildLazyCodeEditorSnippet', () => {
  it('keeps the markdown baseline and omits the unset flag', () => {
    const source = buildLazyCodeEditorSnippet({ docType: '', editable: '' })
    expect(source).toContain('<div class="h-64 w-full max-w-xl">')
    expect(source).toContain('bind:content={content}')
    expect(source).toContain('docType="markdown"')
    expect(source).not.toContain('editable')
  })

  it('emits the chosen document type', () => {
    const source = buildLazyCodeEditorSnippet({ docType: 'yaml', editable: '' })
    expect(source).toContain('docType="yaml"')
    expect(source).not.toContain('docType="markdown"')
  })

  it('emits a bare editable flag and ={false} for no', () => {
    const on = buildLazyCodeEditorSnippet({ docType: '', editable: 'yes' })
    const off = buildLazyCodeEditorSnippet({ docType: '', editable: 'no' })
    expect(on).toContain('\n    editable\n')
    expect(off).toContain('editable={false}')
  })

  it('keeps the bounded wrapper and editor classes', () => {
    const source = buildLazyCodeEditorSnippet({ docType: '', editable: '' })
    expect(source).toContain(
      'containerClass="h-full overflow-hidden rounded-md border border-slate-700 bg-slate-950"',
    )
    expect(source).toContain('editorClass="h-full"')
  })
})

describe('DEFAULT_CONTENT', () => {
  it('is a markdown document', () => {
    expect(DEFAULT_CONTENT.startsWith('# ')).toBe(true)
  })
})
