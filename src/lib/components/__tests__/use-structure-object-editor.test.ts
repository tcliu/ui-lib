import { describe, expect, it, vi } from 'vitest'
import { createStructureObjectEditor } from '../use-structure-object-editor.svelte'

function editor(value: object | unknown[], onChange?: (path: string[], next: unknown) => void) {
  return createStructureObjectEditor({
    getValue: () => value,
    getPath: () => ['nested'],
    getOnChange: () => onChange,
  })
}

describe('createStructureObjectEditor', () => {
  it('seeds the draft from the node value on open, formatted', () => {
    const api = editor({ a: 1 })
    expect(api.open).toBe(false)

    api.openEditor()
    expect(api.open).toBe(true)
    expect(api.draft).toBe('{\n  "a": 1\n}')
    expect(api.dirty).toBe(false)
  })

  it('tracks dirtiness and JSON validity as the draft changes', () => {
    const api = editor({ a: 1 })
    api.openEditor()

    api.draft = '{"a": 2}'
    expect(api.dirty).toBe(true)
    expect(api.valid).toBe(true)

    api.draft = 'nope'
    expect(api.valid).toBe(false)
  })

  it('commits the parsed draft at the node path and closes', () => {
    const onChange = vi.fn()
    const api = editor({ a: 1 }, onChange)
    api.openEditor()
    api.draft = '{"a": 2}'

    api.save()
    expect(onChange).toHaveBeenCalledWith(['nested'], { a: 2 })
    expect(api.open).toBe(false)
  })

  it('closes without committing when there is no change handler', () => {
    const api = editor({ a: 1 })
    api.openEditor()
    api.save()
    expect(api.open).toBe(false)
  })

  it('keeps the dialog open on invalid JSON and never half-applies', () => {
    const onChange = vi.fn()
    const api = editor({ a: 1 }, onChange)
    api.openEditor()
    api.draft = 'nope'

    api.save()
    expect(onChange).not.toHaveBeenCalled()
    expect(api.open).toBe(true)
  })

  it('formats the draft and reset restores the seed', () => {
    const api = editor({ a: 1 })
    api.openEditor()
    api.draft = '{"a":2}'
    api.format()
    expect(api.draft).toBe('{\n  "a": 2\n}')

    api.draft = '{"a": 3}'
    api.reset()
    expect(api.draft).toBe('{\n  "a": 1\n}')
    expect(api.dirty).toBe(false)
  })

  it('closes on demand', () => {
    const api = editor({ a: 1 })
    api.openEditor()
    api.close()
    expect(api.open).toBe(false)
  })
})
