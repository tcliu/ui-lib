import { describe, expect, it } from 'vitest'
import type { TriState } from './snippet-build'
import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from './staged'

describe('staged', () => {
  it('starts off unless told otherwise', () => {
    expect(staged('md')).toEqual({ value: 'md', on: false })
    expect(staged('lg', true)).toEqual({ value: 'lg', on: true })
  })

  it('survives the reset clone with its shape intact', () => {
    const initial = { size: staged('md'), label: staged('Apply', true) }
    expect(structuredClone(initial)).toEqual(initial)
  })
})

describe('applied', () => {
  it('reads undefined while the eye is off', () => {
    expect(applied(staged('lg'))).toBeUndefined()
  })

  it('reads the value while the eye is on, including falsy values', () => {
    expect(applied(staged('lg', true))).toBe('lg')
    expect(applied(staged('', true))).toBe('')
    expect(applied(staged(0, true))).toBe(0)
  })
})

describe('appliedFlag', () => {
  it('gates the tri-state behind the eye', () => {
    expect(appliedFlag(staged('yes'))).toBeUndefined()
    expect(appliedFlag(staged('', true))).toBeUndefined()
    expect(appliedFlag(staged('yes', true))).toBe(true)
    expect(appliedFlag(staged('no', true))).toBe(false)
  })
})

describe('stage', () => {
  it('commits in place and re-applies the eye', () => {
    const pair = staged('md')
    stage(pair, 'lg')
    expect(pair).toEqual({ value: 'lg', on: true })
  })
})

describe('eye', () => {
  it('reads the pair and writes its halves in place', () => {
    const pair = staged('md', true)
    const props = eye(pair)
    expect(props).toMatchObject({ value: 'md', enabled: true })

    props.onChange('lg')
    expect(pair.value).toBe('lg')

    props.setEnabled(false)
    expect(pair.on).toBe(false)
  })
})

describe('eyeFlag', () => {
  it('reads the pair and writes a tri-state back to it in place', () => {
    const pair = staged<TriState>('', true)
    const props = eyeFlag(pair)
    expect(props).toMatchObject({ value: '', enabled: true })

    props.onChange('yes')
    expect(pair.value).toBe('yes')

    props.setEnabled(false)
    expect(pair.on).toBe(false)
  })
})

describe('eyeToggle', () => {
  it('wires the toggle to the pair', () => {
    const pair = staged('md', true)
    const toggle = eyeToggle(pair)
    expect(toggle.enabled).toBe(true)
    toggle.onToggle(false)
    expect(pair.on).toBe(false)
    toggle.onToggle(true)
    expect(pair.on).toBe(true)
  })
})

describe('eyeResetToggle', () => {
  it('resets the committed data only while turning off', () => {
    const pair = staged('Apply', true)
    let resets = 0
    const toggle = eyeResetToggle(pair, () => {
      resets += 1
      pair.value = 'Apply'
    })

    toggle.onToggle(true)
    expect(resets).toBe(0)

    pair.value = 'Changed'
    toggle.onToggle(false)
    expect(pair.on).toBe(false)
    expect(pair.value).toBe('Apply')
    expect(resets).toBe(1)
  })
})
