import { describe, expect, it } from 'vitest'
import {
  boolField,
  enumField,
  jsonField,
  resetToggle,
  sizeField,
  snippetDialog,
  snippetField,
  snippetToggle,
  textField,
} from './snippet-field'

describe('snippetToggle', () => {
  it('forwards the flag and the setter', () => {
    const set = () => {}
    expect(snippetToggle(true, set)).toEqual({ enabled: true, onToggle: set })
    expect(snippetToggle(false, set)).toEqual({ enabled: false, onToggle: set })
  })
})

describe('resetToggle', () => {
  it('resets the committed data only while turning off', () => {
    const seen: boolean[] = []
    let resets = 0
    const toggle = resetToggle(true, value => seen.push(value), () => {
      resets += 1
    })
    expect(toggle.enabled).toBe(true)
    toggle.onToggle(false)
    expect(seen).toEqual([false])
    expect(resets).toBe(1)
    toggle.onToggle(true)
    expect(seen).toEqual([false, true])
    expect(resets).toBe(1)
  })
})

describe('snippetDialog', () => {
  it('enables OK only while the parser accepts the draft', () => {
    const dialog = snippetDialog((draft: string) => (draft === 'ok' ? 'ok' : null), 'Use ok.')
    expect(dialog.invalidMessage).toBe('Use ok.')
    expect(dialog.valid?.('ok')).toBe(true)
    expect(dialog.valid?.('nope')).toBe(false)
  })

  it('treats an empty string result as valid (non-null)', () => {
    const dialog = snippetDialog((draft: string) => (draft === 'ok' ? '' : null), 'msg')
    expect(dialog.valid?.('ok')).toBe(true)
  })
})

describe('jsonField', () => {
  it('supplies the options-json row boilerplate and forwards the required fields', () => {
    const onChange = () => {}
    expect(jsonField({ name: 'rows', type: 'DemoRow[]', note: 'Rows.', value: '[]', onChange })).toEqual({
      name: 'rows',
      type: 'DemoRow[]',
      defaultValue: '—',
      note: 'Rows.',
      editor: 'options-json',
      value: '[]',
      onChange,
    })
  })

  it('attaches only the optionals it is given', () => {
    const field = jsonField({
      name: 'rows',
      type: 'DemoRow[]',
      note: 'Rows.',
      value: '',
      onChange: () => {},
      placeholder: 'Apply',
      dialog: snippetDialog(() => 'ok', 'msg'),
      toggle: snippetToggle(true, () => {}),
      sync: { kind: 'text' },
    })
    expect(field.placeholder).toBe('Apply')
    expect(field.dialog?.invalidMessage).toBe('msg')
    expect(field.toggle?.enabled).toBe(true)
    expect(field.sync).toEqual({ kind: 'text' })
    expect(
      jsonField({ name: 'x', type: 'Y[]', note: 'y', value: '', onChange: () => {} }),
    ).not.toHaveProperty('dialog')
  })
})

describe('snippetField', () => {
  it('supplies the Snippet row boilerplate and forwards the required fields', () => {
    const onChange = () => {}
    expect(snippetField({ name: 'children', note: 'Body.', value: '<p>Hi</p>', onChange })).toEqual({
      name: 'children',
      type: 'Snippet',
      defaultValue: '—',
      note: 'Body.',
      editor: 'snippet',
      value: '<p>Hi</p>',
      onChange,
    })
  })

  it('attaches only the optionals it is given', () => {
    const field = snippetField({
      name: 'children',
      note: 'Body.',
      value: '',
      onChange: () => {},
      placeholder: 'Apply',
      dialog: snippetDialog(() => 'ok', 'msg'),
      toggle: snippetToggle(true, () => {}),
      sync: { kind: 'text' },
    })
    expect(field.placeholder).toBe('Apply')
    expect(field.dialog?.invalidMessage).toBe('msg')
    expect(field.toggle?.enabled).toBe(true)
    expect(field.sync).toEqual({ kind: 'text' })
    expect(snippetField({ name: 'x', note: 'y', value: '', onChange: () => {} })).not.toHaveProperty('dialog')
  })
})

describe('primitive row helpers', () => {
  it('default each helper to its own sync kind', () => {
    expect(sizeField({ note: 'Scale.', value: '', onChange: () => {}, enabled: true, setEnabled: () => {} }).sync?.kind).toBe('custom')
    expect(boolField({ name: 'editable', defaultValue: 'true', note: 'Edit.', value: '', onChange: () => {} }).sync?.kind).toBe('tri')
    expect(textField({ name: 'label', type: 'string', defaultValue: '—', note: 'Label.', value: '', onChange: () => {} }).sync?.kind).toBe('text')
    expect(
      enumField({ name: 'align', type: 'string', defaultValue: "'left'", note: 'Align.', options: [], value: '', onChange: () => {} }).sync?.kind,
    ).toBe('text')
  })

  it('replaces the default sync when the caller supplies one', () => {
    const scopeText = { kind: 'scopeText' as const, scopeRef: 'sizeRef' }
    expect(
      sizeField({ note: 'Scale.', value: '', onChange: () => {}, enabled: true, setEnabled: () => {}, sync: scopeText }).sync,
    ).toEqual(scopeText)
    const scopeFlag = { kind: 'scopeFlag' as const, scopeRef: 'flagRef' }
    expect(
      boolField({ name: 'editable', defaultValue: 'true', note: 'Edit.', value: '', onChange: () => {}, sync: scopeFlag }).sync,
    ).toEqual(scopeFlag)
    const scopeReset = { kind: 'scopeReset' as const, scopeRef: 'paletteRef' }
    expect(
      textField({ name: 'label', type: 'string', defaultValue: '—', note: 'Label.', value: '', onChange: () => {}, sync: scopeReset }).sync,
    ).toEqual(scopeReset)
    const script = { kind: 'script' as const, unsetAbsent: true }
    expect(
      enumField({ name: 'align', type: 'string', defaultValue: "'left'", note: 'Align.', options: [], value: '', onChange: () => {}, sync: script }).sync,
    ).toEqual(script)
  })

  it('keeps the eye wiring while swapping the sync kind', () => {
    const seen: string[] = []
    const toggles: boolean[] = []
    const field = textField({
      name: 'title',
      type: 'string?',
      defaultValue: '—',
      note: 'Heading.',
      value: '',
      onChange: value => seen.push(value),
      enabled: false,
      setEnabled: enabled => toggles.push(enabled),
      sync: { kind: 'script' },
    })
    field.onChange?.('Body')
    expect(seen).toEqual(['Body'])
    expect(toggles).toEqual([true])
    expect(field.toggle?.enabled).toBe(false)
  })
})
