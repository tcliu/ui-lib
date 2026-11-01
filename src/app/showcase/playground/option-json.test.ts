import { describe, expect, it } from 'vitest'
import { parseOptionArrayJson } from './option-json'

describe('parseOptionArrayJson', () => {
  it('parses bare strings and label-optional objects', () => {
    expect(parseOptionArrayJson('["one", {"value": "two", "label": "Two"}, {"value": "three"}]')).toEqual([
      'one',
      { value: 'two', label: 'Two' },
      { value: 'three' },
    ])
  })

  it('rejects unparseable text and misshapen entries', () => {
    expect(parseOptionArrayJson('not json')).toBeNull()
    expect(parseOptionArrayJson('{"value": "one"}')).toBeNull()
    expect(parseOptionArrayJson('[42]')).toBeNull()
    expect(parseOptionArrayJson('[{"label": "One"}]')).toBeNull()
    expect(parseOptionArrayJson('[{"value": "one", "label": 42}]')).toBeNull()
  })
})
