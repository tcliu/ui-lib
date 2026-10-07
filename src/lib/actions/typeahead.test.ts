import { describe, expect, it, vi } from 'vitest'
import { createTypeahead } from './typeahead'

function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
}

// Minimal control: records the active index the way a real trigger would.
function harness<T>(options: T[], labelOf: (option: T) => string, initial = 0) {
  let current = initial
  const onMatch = vi.fn((option: T, index: number) => {
    void option
    current = index
  })
  const typeahead = createTypeahead(() => options, labelOf, onMatch, () => current)
  return { typeahead, onMatch }
}

const numbers = [
  { value: 'one', label: 'One' },
  { value: 'four', label: 'Four' },
  { value: 'fourteen', label: 'Fourteen' },
  { value: 'six', label: 'Six' },
]

describe('createTypeahead', () => {
  it('moves to the first match when the active item does not match', () => {
    const { typeahead, onMatch } = harness(numbers, option => option.label, 0) // One
    typeahead.handle(press('f'))
    expect(onMatch).toHaveBeenLastCalledWith(numbers[1], 1) // Four
  })

  it('advances past the active item when it already matches', () => {
    const { typeahead, onMatch } = harness(numbers, option => option.label, 1) // Four
    typeahead.handle(press('f'))
    expect(onMatch).toHaveBeenLastCalledWith(numbers[2], 2) // Fourteen
  })

  it('cycles through same-letter options and wraps', () => {
    const { typeahead, onMatch } = harness(numbers, option => option.label, 2) // Fourteen
    typeahead.handle(press('f')) // wraps -> Four
    typeahead.handle(press('f')) // -> Fourteen
    expect(onMatch.mock.calls.map(call => call[1])).toEqual([1, 2])
  })

  it('searches backwards to the previous match when Shift is held', () => {
    const { typeahead, onMatch } = harness(numbers, option => option.label, 1) // Four
    typeahead.handle(press('f', { shiftKey: true }))
    expect(onMatch).toHaveBeenLastCalledWith(numbers[2], 2) // Fourteen (wraps back)
  })

  it('cycles backwards through same-letter options with repeated Shift presses', () => {
    const { typeahead, onMatch } = harness(numbers, option => option.label, 1) // Four
    typeahead.handle(press('f', { shiftKey: true })) // -> Fourteen
    typeahead.handle(press('f', { shiftKey: true })) // -> Four
    expect(onMatch.mock.calls.map(call => call[1])).toEqual([2, 1])
  })

  it('advances from the active item for a different letter', () => {
    const options = [
      { value: 'edit', label: 'Edit' },
      { value: 'delete', label: 'Delete' },
    ]
    const { typeahead, onMatch } = harness(options, option => option.label, 0) // Edit
    typeahead.handle(press('d'))
    expect(onMatch).toHaveBeenLastCalledWith(options[1], 1) // Delete
    typeahead.handle(press('e'))
    expect(onMatch).toHaveBeenLastCalledWith(options[0], 0) // wraps -> Edit
  })

  it('ignores non-printable keys, space, and modifier combos', () => {
    const { typeahead, onMatch } = harness(numbers, option => option.label)
    expect(typeahead.handle(press('ArrowDown'))).toBe(false)
    expect(typeahead.handle(press('Enter'))).toBe(false)
    expect(typeahead.handle(press(' '))).toBe(false)
    expect(typeahead.handle(press('f', { ctrlKey: true }))).toBe(false)
    expect(onMatch).not.toHaveBeenCalled()
  })

  it('does nothing when no option starts with the letter', () => {
    const { typeahead, onMatch } = harness(numbers, option => option.label)
    expect(typeahead.handle(press('z'))).toBe(true)
    expect(onMatch).not.toHaveBeenCalled()
  })
})
