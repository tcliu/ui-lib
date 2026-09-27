import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
  it('joins truthy class values and drops falsy ones', () => {
    expect(cn('a', false && 'b', ['c', null, undefined], { d: true, e: false })).toBe('a c d')
  })

  it('keeps the last conflicting utility per group', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('preserves non-conflicting utilities', () => {
    expect(cn('flex items-center', 'gap-2')).toBe('flex items-center gap-2')
  })

  it('lets a later arbitrary value override a scale utility in the same group', () => {
    expect(cn('text-sm', 'text-(length:--text-md)')).toBe('text-(length:--text-md)')
  })
})
