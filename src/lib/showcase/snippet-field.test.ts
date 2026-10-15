import { describe, expect, it } from 'vitest'
import { jsonField, resetToggle, snippetDialog, snippetField, snippetToggle } from './snippet-field'

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
