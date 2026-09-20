import { describe, expect, it } from 'vitest'
import { DEFAULT_CHIP_CLASS, buildChipSnippet } from './demo-snippet'

describe('buildChipSnippet', () => {
  it('renders a static chip with the default class while unset', () => {
    const source = buildChipSnippet({ mode: '', label: '', chipClass: '', active: '' })
    expect(source).toContain('label={defaultLabel}')
    expect(source).toContain(`chipClass="${DEFAULT_CHIP_CLASS}"`)
    expect(source).not.toContain('onRemove=')
    expect(source).not.toContain('onclick=')
  })

  it('wraps the removable chip in a removed guard', () => {
    const source = buildChipSnippet({ mode: 'removable', label: 'Draft', chipClass: '', active: '' })
    expect(source).toContain('{#if !removed}')
    expect(source).toContain('label="Draft"')
    expect(source).toContain('onRemove={() => (removed = true)}')
  })

  it('emits the toggle wiring with the active flag', () => {
    const source = buildChipSnippet({ mode: 'toggle', label: '', chipClass: 'text-cyan-200', active: 'yes' })
    expect(source).toContain('chipClass="text-cyan-200"')
    expect(source).toContain('  active\n')
    expect(source).toContain('onclick={() => (chipActive = !chipActive)}')
  })
})
