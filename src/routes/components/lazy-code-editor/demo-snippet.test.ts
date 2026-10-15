import { describe, expect, it } from 'vitest'
import { DEFAULT_CONTENT, buildLazyCodeEditorSnippet } from './demo-snippet'

describe('buildLazyCodeEditorSnippet', () => {
  it('keeps the markdown baseline and omits the unset flag', () => {
    const source = buildLazyCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(source).toContain('<div class="h-64 w-full max-w-xl">')
    expect(source).toContain('bind:content={content}')
    expect(source).toContain('docType="markdown"')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('containerClass=')
    expect(source).not.toContain('editorClass=')
    expect(source).not.toContain('maxContentLength=')
  })

  it('emits the chosen document type', () => {
    const source = buildLazyCodeEditorSnippet({ docType: 'yaml', docTypeOn: true, editable: '', editableOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(source).toContain('docType="yaml"')
    expect(source).not.toContain('docType="markdown"')
  })

  it('omits the component-default flags and caps (the Value column prefills them)', () => {
    const source = buildLazyCodeEditorSnippet({ docType: 'text', docTypeOn: true, editable: 'yes', editableOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '0', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(source).not.toContain('docType=')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('containerClass=')
    expect(source).not.toContain('editorClass=')
    expect(source).not.toContain('maxContentLength=')
  })

  it('omits the default editable flag and emits ={false} for no', () => {
    expect(buildLazyCodeEditorSnippet({ docType: '', docTypeOn: true, editable: 'yes', editableOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })).not.toContain('editable')
    expect(buildLazyCodeEditorSnippet({ docType: '', docTypeOn: true, editable: 'no', editableOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })).toContain('editable={false}')
  })

  it('emits the wrapper and editor classes when set', () => {
    const source = buildLazyCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, containerClass: 'h-full overflow-hidden', containerClassOn: true, editorClass: 'h-full', editorClassOn: true, maxContentLength: '', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(source).toContain('containerClass="h-full overflow-hidden"')
    expect(source).toContain('editorClass="h-full"')
  })

  it('emits maxContentLength as a numeric expression and omits non-numeric input', () => {
    const source = buildLazyCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '500', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(source).toContain('maxContentLength={500}')
    expect(buildLazyCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: 'long', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })).not.toContain('maxContentLength=')
  })

  it('omits staged classes while the eye is off and emits them while on', () => {
    const off = buildLazyCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, containerClass: 'h-full overflow-hidden', containerClassOn: false, editorClass: 'h-full', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(off).not.toContain('containerClass=')
    expect(off).not.toContain('editorClass=')
    const on = buildLazyCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, containerClass: 'h-full overflow-hidden', containerClassOn: true, editorClass: 'h-full', editorClassOn: true, maxContentLength: '', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(on).toContain('containerClass="h-full overflow-hidden"')
    expect(on).toContain('editorClass="h-full"')
  })

  it('omits the staged docType while its eye is off', () => {
    const off = buildLazyCodeEditorSnippet({ docType: 'yaml', docTypeOn: false, editable: '', editableOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(off).not.toContain('docType=')
  })

  it('omits staged primitive props while their eyes are off and emits them while on', () => {
    const off = buildLazyCodeEditorSnippet({ docType: '', docTypeOn: true, editable: 'no', editableOn: false, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '500', maxContentLengthOn: false, autoFocus: 'yes', autoFocusOn: false, editorAriaLabel: 'Code', editorAriaLabelOn: false, recreateKey: 'v2', recreateKeyOn: false })
    expect(off).not.toContain('editable=')
    expect(off).not.toContain('maxContentLength=')
    expect(off).not.toContain('autoFocus')
    expect(off).not.toContain('editorAriaLabel=')
    expect(off).not.toContain('recreateKey=')
    const on = buildLazyCodeEditorSnippet({ docType: '', docTypeOn: true, editable: 'no', editableOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '500', maxContentLengthOn: true, autoFocus: 'yes', autoFocusOn: true, editorAriaLabel: 'Code', editorAriaLabelOn: true, recreateKey: 'v2', recreateKeyOn: true })
    expect(on).toContain('editable={false}')
    expect(on).toContain('maxContentLength={500}')
    expect(on).toContain('    autoFocus\n')
    expect(on).toContain('editorAriaLabel="Code"')
    expect(on).toContain('recreateKey="v2"')
  })
})

describe('DEFAULT_CONTENT', () => {
  it('is a markdown document', () => {
    expect(DEFAULT_CONTENT.startsWith('# ')).toBe(true)
  })
})
