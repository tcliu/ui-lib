import { describe, expect, it } from 'vitest'
import { STAGE_PANE, STAGE_ROW } from '$lib/showcase/resizable-stage'
import { DEMO_VALUE, buildDataGridSnippet } from './demo-snippet'

describe('buildDataGridSnippet', () => {
  it('omits every flag while unset', () => {
    const source = buildDataGridSnippet({ editable: '', showHeaders: '', hideHeaderToggle: '' })
    expect(source).toContain('value={value}')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('showHeaders')
    expect(source).not.toContain('hideHeaderToggle')
  })

  it('emits bare flags for yes', () => {
    const source = buildDataGridSnippet({ editable: 'yes', showHeaders: 'yes', hideHeaderToggle: 'yes' })
    expect(source).toContain('\n      editable\n')
    expect(source).toContain('\n      showHeaders\n')
    expect(source).toContain('\n      hideHeaderToggle\n')
  })

  it('emits ={false} for no', () => {
    const source = buildDataGridSnippet({ editable: 'no', showHeaders: '', hideHeaderToggle: 'no' })
    expect(source).toContain('editable={false}')
    expect(source).toContain('hideHeaderToggle={false}')
    expect(source).not.toContain('showHeaders')
  })

  it('wraps the grid in the resizable stage the page renders', () => {
    const source = buildDataGridSnippet({ editable: '', showHeaders: '', hideHeaderToggle: '' })
    expect(source).toContain('let stageWidth = $state(100)')
    expect(source).toContain(`<div class="${STAGE_ROW}">`)
    expect(source).toContain(`<div class="${STAGE_PANE} h-72 w-full" style={\`flex-basis:\${stageWidth}%\`}>`)
    expect(source).toContain('value={stageWidth}')
    expect(source).toContain('onChange={next => (stageWidth = next)}')
    expect(source).toContain('ariaLabel={resizeLabel}')
    expect(source).toContain('onChange={next => (value = next)}')
  })
})

describe('DEMO_VALUE', () => {
  it('starts with a header row and at least one data row', () => {
    expect(DEMO_VALUE[0]).toEqual(['Name', 'Role', 'Team'])
    expect(DEMO_VALUE.length).toBeGreaterThan(1)
    expect(DEMO_VALUE.every(row => row.length === DEMO_VALUE[0].length)).toBe(true)
  })
})
