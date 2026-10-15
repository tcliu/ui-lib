import { describe, expect, it } from 'vitest'
import { DEFAULT_CONTENT, buildCodeEditorSnippet } from './demo-snippet'

describe('buildCodeEditorSnippet', () => {
  it('keeps the json baseline and omits unset flags', () => {
    const source = buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, theme: '', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(source).toContain('<div class="h-64 w-full max-w-xl">')
    expect(source).toContain('bind:content={content}')
    expect(source).toContain('docType="json"')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('theme=')
    expect(source).not.toContain('containerClass=')
    expect(source).not.toContain('editorClass=')
    expect(source).not.toContain('maxContentLength=')
    expect(source).not.toContain('selectionEnabled')
  })

  it('emits the chosen document type', () => {
    const source = buildCodeEditorSnippet({ docType: 'markdown', docTypeOn: true, editable: '', editableOn: true, theme: '', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(source).toContain('docType="markdown"')
    expect(source).not.toContain('docType="json"')
  })

  it('omits the component-default flags and caps (the Value column prefills them)', () => {
    const on = buildCodeEditorSnippet({ docType: 'text', docTypeOn: true, editable: 'yes', editableOn: true, theme: 'dark', themeOn: true, containerClass: 'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950', containerClassOn: false, editorClass: 'h-full', editorClassOn: false, maxContentLength: '0', maxContentLengthOn: true, selectionEnabled: 'yes', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(on).not.toContain('docType=')
    expect(on).not.toContain('editable')
    expect(on).not.toContain('theme=')
    expect(on).not.toContain('containerClass=')
    expect(on).not.toContain('editorClass=')
    expect(on).not.toContain('maxContentLength=')
    expect(on).not.toContain('selectionEnabled')
  })

  it('omits the default editable flag and emits ={false} for no', () => {
    expect(buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: 'yes', editableOn: true, theme: '', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })).not.toContain('editable')
    expect(buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: 'no', editableOn: true, theme: '', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })).toContain('editable={false}')
  })

  it('emits the chosen theme', () => {
    const source = buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, theme: 'light', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(source).toContain('theme="light"')
  })

  it('emits the wrapper and editor classes when set', () => {
    const source = buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, theme: '', themeOn: true, containerClass: 'h-full overflow-hidden', containerClassOn: true, editorClass: 'h-full', editorClassOn: true, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(source).toContain('containerClass="h-full overflow-hidden"')
    expect(source).toContain('editorClass="h-full"')
  })

  it('emits maxContentLength as a numeric expression and omits non-numeric input', () => {
    const source = buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, theme: '', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '500', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(source).toContain('maxContentLength={500}')
    expect(buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, theme: '', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: 'long', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })).not.toContain('maxContentLength=')
  })

  it('omits the default selectionEnabled flag and emits ={false} for no', () => {
    expect(buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, theme: '', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: 'yes', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })).not.toContain('selectionEnabled')
    expect(buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, theme: '', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: 'no', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })).toContain('selectionEnabled={false}')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildCodeEditorSnippet({ docType: 'markdown', docTypeOn: false, editable: '', editableOn: true, theme: 'light', themeOn: false, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(off).not.toContain('docType=')
    expect(off).not.toContain('theme=')
  })

  it('omits staged primitive props while their eyes are off and emits them while on', () => {
    const off = buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: 'no', editableOn: false, theme: '', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '500', maxContentLengthOn: false, selectionEnabled: 'no', selectionEnabledOn: false, autoFocus: 'yes', autoFocusOn: false, editorAriaLabel: 'Code', editorAriaLabelOn: false, recreateKey: 'v2', recreateKeyOn: false })
    expect(off).not.toContain('editable=')
    expect(off).not.toContain('maxContentLength=')
    expect(off).not.toContain('selectionEnabled=')
    expect(off).not.toContain('autoFocus')
    expect(off).not.toContain('editorAriaLabel=')
    expect(off).not.toContain('recreateKey=')
    const on = buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: 'no', editableOn: true, theme: '', themeOn: true, containerClass: '', containerClassOn: false, editorClass: '', editorClassOn: false, maxContentLength: '500', maxContentLengthOn: true, selectionEnabled: 'no', selectionEnabledOn: true, autoFocus: 'yes', autoFocusOn: true, editorAriaLabel: 'Code', editorAriaLabelOn: true, recreateKey: 'v2', recreateKeyOn: true })
    expect(on).toContain('editable={false}')
    expect(on).toContain('maxContentLength={500}')
    expect(on).toContain('selectionEnabled={false}')
    expect(on).toContain('    autoFocus\n')
    expect(on).toContain('editorAriaLabel="Code"')
    expect(on).toContain('recreateKey="v2"')
  })

  it('omits staged classes while the eye is off and emits them while on', () => {
    const off = buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, theme: '', themeOn: true, containerClass: 'h-full overflow-hidden', containerClassOn: false, editorClass: 'h-full', editorClassOn: false, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(off).not.toContain('containerClass=')
    expect(off).not.toContain('editorClass=')
    const on = buildCodeEditorSnippet({ docType: '', docTypeOn: true, editable: '', editableOn: true, theme: '', themeOn: true, containerClass: 'h-full overflow-hidden', containerClassOn: true, editorClass: 'h-full', editorClassOn: true, maxContentLength: '', maxContentLengthOn: true, selectionEnabled: '', selectionEnabledOn: true, autoFocus: '', autoFocusOn: false, editorAriaLabel: '', editorAriaLabelOn: false, recreateKey: '', recreateKeyOn: false })
    expect(on).toContain('containerClass="h-full overflow-hidden"')
    expect(on).toContain('editorClass="h-full"')
  })
})

describe('DEFAULT_CONTENT', () => {
  it('is a valid JSON document', () => {
    const parsed = JSON.parse(DEFAULT_CONTENT) as { name?: string }
    expect(parsed.name).toBe('ui-lib')
  })
})
