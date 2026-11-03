import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import DateInput from './DateInput.svelte'
import RangeHarness from './date-range.harness.svelte'
import RangeTimeHarness from './date-range-time.harness.svelte'
import ValueHarness from './date-value.harness.svelte'
import { todayIso } from './date-input-core'
import { PICKER_RATIOS } from './date-input-metrics'

// jsdom lacks ResizeObserver (positionPanel), matchMedia, and scrollIntoView.
function installDomStubs(): void {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  )
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
  }))
  if (typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = () => {}
  }
}

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  installDomStubs()
  target = document.createElement('div')
  document.body.appendChild(target)
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  target.remove()
  vi.unstubAllGlobals()
})

function openTrigger(): void {
  // A field renders exactly one button while its panel is closed: its calendar
  // affordance (the first field's, in a range pair).
  const trigger = target.querySelector('button') as HTMLButtonElement
  trigger.click()
  flushSync()
}

function field(index = 0): HTMLInputElement {
  const input = target.querySelectorAll('input')[index]
  if (!(input instanceof HTMLInputElement)) throw new Error(`no field ${index}`)
  return input
}

function dayButton(label: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find(node => node.textContent?.trim() === label)
  if (!(button instanceof HTMLButtonElement)) throw new Error(`no day button ${label}`)
  return button
}

describe('DateInput', () => {
  it('hugs the pattern text and the chrome the field carries', () => {
    instance = mount(DateInput, { target, props: { value: '' } })
    flushSync()
    // The field is exactly as wide as its text plus its own padding and the
    // calendar gutter, so no slack opens between the value and the affordance.
    expect(field().style.width).toBe(
      'calc(10ch + var(--input-pad-x) + var(--pick-pad-x) + var(--pick-icon) + var(--pick-gap) + 2px)',
    )
    expect(field().style.minWidth).toBe('')
    unmount(instance)
    instance = mount(DateInput, { target, props: { value: '', time: true } })
    flushSync()
    expect(field().style.width).toContain('calc(19ch')
    unmount(instance)
    // A custom prompt names the field; it never widens it past the text.
    instance = mount(DateInput, { target, props: { value: '', placeholder: 'Choose a start date' } })
    flushSync()
    expect(field().getAttribute('placeholder')).toBe('Choose a start date')
    expect(field().style.width).toContain('calc(10ch')
  })

  it('carries a stepped time segment into the next unit and rolls the date', () => {
    let next = ''
    instance = mount(DateInput, {
      target,
      props: { time: true, value: '2026-09-05T10:59:30', onChange: (v: string) => (next = v) },
    })
    flushSync()
    openTrigger()
    const minute = document.querySelector('input[aria-label="Minute"]') as HTMLInputElement
    minute.focus()
    minute.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    flushSync()
    expect(next).toBe('2026-09-05T11:00:30')

    unmount(instance)
    // The top of the day rolls the date, so the clock never clamps or rewinds.
    instance = mount(DateInput, {
      target,
      props: { time: true, value: '2026-09-05T23:59:59', onChange: (v: string) => (next = v) },
    })
    flushSync()
    openTrigger()
    const second = document.querySelector('input[aria-label="Second"]') as HTMLInputElement
    second.focus()
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    flushSync()
    expect(next).toBe('2026-09-06T00:00:00')
  })

  it('reads an appended segment entry as its last two digits', () => {
    let next = ''
    instance = mount(DateInput, {
      target,
      props: { time: true, value: '2026-09-05T10:08:00', onChange: (v: string) => (next = v) },
    })
    flushSync()
    openTrigger()
    const minute = document.querySelector('input[aria-label="Minute"]') as HTMLInputElement
    // The box shows two digits and typing appends after focus, so the entry
    // reads as its last two (85 minutes carries into the hour).
    minute.value = '085'
    minute.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    expect(next).toBe('2026-09-05T11:25:00')
  })

  it('scales the fields and the calendar from the size', () => {
    instance = mount(DateInput, { target, props: { value: '' } })
    flushSync()
    const root = target.firstElementChild as HTMLElement
    expect(root.getAttribute('style')).toContain(`--pick-font: ${16 * PICKER_RATIOS.font}px`)
    expect(root.getAttribute('style')).toContain('--pick-panel-width: 272px')
    expect(root.getAttribute('style')).toContain('--pick-cell-size: 32px')
  })

  it('merges a partial ratios override over the fields and the calendar', () => {
    instance = mount(DateInput, {
      target,
      props: { value: '', ratios: { font: 0.5, padX: 0.75, panelWidth: 10 } },
    })
    flushSync()
    const root = target.firstElementChild as HTMLElement
    expect(root.getAttribute('style')).toContain('--pick-font: 8px')
    expect(root.getAttribute('style')).toContain('--pick-pad-x: 12px')
    expect(root.getAttribute('style')).toContain('--pick-panel-width: 160px')
    // The field text follows the same font and padding.
    expect(target.querySelector('input')?.getAttribute('style')).toContain('--input-font: 8px')
  })

  it('selects a single date and reflects it in the field', () => {
    let next = ''
    instance = mount(DateInput, { target, props: { value: '', onChange: (v: string) => (next = v) } })
    flushSync()
    openTrigger()
    const today = document.querySelector('button[aria-current="date"]') as HTMLButtonElement
    today.click()
    flushSync()
    expect(next).toBe(todayIso())
    // A single pick closes the panel.
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('clears the committed value from the panel footer', () => {
    let next = 'x'
    instance = mount(DateInput, { target, props: { value: '2026-09-19', onChange: (v: string) => (next = v) } })
    flushSync()
    openTrigger()
    const clear = document.querySelector('button[aria-label="Clear date"]') as HTMLButtonElement
    clear.click()
    flushSync()
    expect(next).toBe('')
  })

  it('re-anchors the open calendar when the value is updated from outside', () => {
    instance = mount(ValueHarness, { target })
    flushSync()
    const input = field()
    const commitText = (text: string) => {
      input.value = text
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      flushSync()
    }

    commitText('2026-09-19')
    openTrigger()
    const panel = document.querySelector('[role="dialog"]') as HTMLElement
    expect(panel.textContent).toContain('September 2026')

    // A commit in another month changes the value from outside the panel, and
    // the still-open grid follows it rather than keeping the old month.
    commitText('2027-03-04')
    expect(target.querySelector('[data-value]')?.textContent).toBe('2027-03-04')
    expect(panel.textContent).toContain('March 2027')
  })

  it('previews a valid typed date in the open calendar before it commits', () => {
    instance = mount(ValueHarness, { target })
    flushSync()
    const input = field()
    const type = (text: string) => {
      input.value = text
      input.dispatchEvent(new Event('input', { bubbles: true }))
      flushSync()
    }
    type('2026-09-19')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    openTrigger()
    const panel = document.querySelector('[role="dialog"]') as HTMLElement
    expect(panel.textContent).toContain('September 2026')

    // Retyping the year moves the grid as soon as the text is a valid date,
    // and the previewed day is highlighted in it, while the value itself stays
    // uncommitted until the field commits.
    type('2025-10-22')
    expect(panel.textContent).toContain('October 2025')
    expect(target.querySelector('[data-value]')?.textContent).toBe('2026-09-19')
    const selected = panel.querySelector('[role="gridcell"][aria-selected="true"]')
    expect(selected?.textContent?.trim()).toBe('22')
  })

  it('keeps a time segment focused when a step rolls the date', async () => {
    instance = mount(ValueHarness, { target, props: { time: true } })
    flushSync()
    const input = field()
    input.value = '2026-09-05 23:59:59'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    openTrigger()
    // The panel hands focus to its anchor day after the flush; wait for that
    // before moving into the time row.
    await new Promise(resolve => setTimeout(resolve, 0))

    const second = document.querySelector('input[aria-label="Second"]') as HTMLInputElement
    second.focus()
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    flushSync()
    // A focus hand-off would land after the flush, so wait for it before
    // asserting that the segment still holds the focus.
    await new Promise(resolve => setTimeout(resolve, 0))
    // The step rolled the date, and the segment keeps the focus: only a day
    // grid that had it hands it to the new day.
    expect(target.querySelector('[data-value]')?.textContent).toBe('2026-09-06T00:00:00')
    expect(document.activeElement).toBe(second)
  })

  it('formats the field text with the format pattern', () => {
    instance = mount(DateInput, { target, props: { value: '2026-09-19', format: 'MMM D, YYYY', onChange: () => {} } })
    flushSync()
    const field = target.querySelector('input') as HTMLInputElement
    expect(field.value).toContain('Sep 19, 2026')
  })

  it('commits a typed date and reverts an impossible one', () => {
    let next = 'seed'
    instance = mount(DateInput, { target, props: { value: '2026-09-19', onChange: (v: string) => (next = v) } })
    flushSync()
    const field = target.querySelector('input') as HTMLInputElement
    field.value = '2026-10-05'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    expect(next).toBe('2026-10-05')
    // A rollover (Feb 31) is rejected, not normalized: the text reverts.
    next = 'seed'
    field.value = '2026-02-31'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    expect(next).toBe('seed')
    expect(field.value).toBe('2026-09-19')
  })

  it('defaults the time when a date-time field is typed a date alone', () => {
    let next = 'seed'
    instance = mount(DateInput, { target, props: { time: true, value: '', onChange: (v: string) => (next = v) } })
    flushSync()
    const field = target.querySelector('input') as HTMLInputElement
    field.value = '2026-10-14'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    // The date commits with the time defaulted to midnight.
    expect(next).toBe('2026-10-14T00:00:00')
    // The field shows the pattern's own text again.
    expect(field.value).toBe('2026-10-14 00:00:00')
  })

  it('defaults the missing clock units when a partial time is typed', () => {
    let next = 'seed'
    instance = mount(DateInput, { target, props: { time: true, value: '', onChange: (v: string) => (next = v) } })
    flushSync()
    const field = target.querySelector('input') as HTMLInputElement
    field.value = '2026-01-12 03'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    // The hours commit with the minutes and seconds defaulted to zero.
    expect(next).toBe('2026-01-12T03:00:00')
    expect(field.value).toBe('2026-01-12 03:00:00')
  })

  it('still reverts a date-only entry in a date field', () => {
    let next = 'seed'
    instance = mount(DateInput, { target, props: { value: '2026-09-19', onChange: (v: string) => (next = v) } })
    flushSync()
    const field = target.querySelector('input') as HTMLInputElement
    // A date field has no clock to default, so an entry that does not parse
    // still reverts.
    field.value = '2026-10'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    expect(next).toBe('seed')
    expect(field.value).toBe('2026-09-19')
  })

  it('keeps the field free of characters the pattern cannot contain', () => {
    instance = mount(DateInput, { target, props: { value: '', onChange: () => {} } })
    flushSync()
    const field = target.querySelector('input') as HTMLInputElement
    field.value = '2026-09-19abc'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    expect(field.value).toBe('2026-09-19')
  })

  it('carries the size metrics on the portalled panel so it resizes with size', () => {
    instance = mount(DateInput, { target, props: { value: '', size: 'lg' } })
    flushSync()
    openTrigger()
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog.style.getPropertyValue('--pick-font')).toBe(`${18 * PICKER_RATIOS.font}px`)
    expect(dialog.style.getPropertyValue('--pick-panel-width')).toBe('306px')
  })
})

describe('DateInput range', () => {
  const rangeProps = { range: true, from: '', to: '', onFrom: () => {}, onTo: () => {} }

  it('renders one editable field per range end, each self-labelled', () => {
    instance = mount(DateInput, {
      target,
      props: { ...rangeProps, from: '2026-09-01', to: '2026-09-19' },
    })
    flushSync()
    expect(field(0).value).toBe('2026-09-01')
    expect(field(1).value).toBe('2026-09-19')
    expect(field(0).getAttribute('aria-label')).toBe('From: 2026-09-01')
    expect(field(1).getAttribute('aria-label')).toBe('To: 2026-09-19')
  })

  it('applies the format pattern to both range ends', () => {
    instance = mount(DateInput, {
      target,
      props: { ...rangeProps, from: '2026-09-01', to: '2026-09-19', format: 'D MMM' },
    })
    flushSync()
    expect(field(0).value).toBe('1 Sep')
    expect(field(1).value).toBe('19 Sep')
  })

  it('carries the shared calendar metrics on the root', () => {
    instance = mount(DateInput, { target, props: rangeProps })
    flushSync()
    const root = target.firstElementChild as HTMLElement
    expect(root.getAttribute('style')).toContain(`--pick-font: ${16 * PICKER_RATIOS.font}px`)
  })

  it('picks each end in its own panel', () => {
    instance = mount(RangeHarness, { target, props: {} })
    flushSync()
    openTrigger()
    dayButton('10').click()
    flushSync()
    // The filled end hands the focus over, so the empty end's own panel is the
    // one open now: the pick lands in that end.
    const panel = document.querySelector('[role="dialog"]') as HTMLElement
    expect(panel.textContent).toContain('To')
    dayButton('20').click()
    flushSync()
    const [year, month] = todayIso().split('-')
    expect(target.querySelector('[data-range]')?.textContent).toBe(`${year}-${month}-10 – ${year}-${month}-20`)
  })

  it('hands the focus and the calendar to the empty end when the other one is filled', async () => {
    instance = mount(RangeHarness, { target, props: {} })
    flushSync()
    const input = field(0)
    input.value = '2026-09-10'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    // The focus hand-off lands after the flush.
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(target.querySelector('[data-range]')?.textContent).toBe('2026-09-10 – ')
    expect(document.activeElement).toBe(field(1))
    const panel = document.querySelector('[role="dialog"]') as HTMLElement
    expect(panel.textContent).toContain('To')
  })

  it('hands the focus back to the empty start when the end is filled', async () => {
    instance = mount(RangeHarness, { target, props: {} })
    flushSync()
    const input = field(1)
    input.value = '2026-09-19'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(target.querySelector('[data-range]')?.textContent).toBe(' – 2026-09-19')
    expect(document.activeElement).toBe(field(0))
    const panel = document.querySelector('[role="dialog"]') as HTMLElement
    expect(panel.textContent).toContain('From')
  })

  it('keeps the focus in the filled end once the pair is complete', async () => {
    instance = mount(DateInput, {
      target,
      props: { ...rangeProps, from: '2026-09-01', to: '2026-09-19' },
    })
    flushSync()
    const input = field(0)
    input.focus()
    input.value = '2026-09-05'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))
    // The other end already holds a value, so nothing hands the focus over.
    expect(document.activeElement).toBe(field(0))
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('keeps the panel and the focus in a time field when a day is picked', () => {
    instance = mount(RangeTimeHarness, { target, props: {} })
    flushSync()
    openTrigger()
    // The start is filled while the end is empty, yet a time field keeps the
    // panel open after a pick, so nothing hands the focus to the other end.
    dayButton('10').click()
    flushSync()
    const [year, month] = todayIso().split('-')
    expect(target.querySelector('[data-range]')?.textContent).toBe(`${year}-${month}-10T00:00:00 – `)
    expect(field(0).value).toBe(`${year}-${month}-10 00:00:00`)
    // The start's own panel stays open and the end takes no focus.
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(field(1).value).toBe('')
    expect(document.activeElement).not.toBe(field(1))
  })

  it('highlights the days between the two ends', () => {
    instance = mount(DateInput, {
      target,
      props: { ...rangeProps, from: '2026-09-01', to: '2026-09-19', highlightRange: true },
    })
    flushSync()
    openTrigger()
    const panel = document.querySelector('[role="dialog"]') as HTMLElement
    const day = (label: string) =>
      [...panel.querySelectorAll('button[aria-label]')].find(node => node.textContent?.trim() === label)
    // The ends read as the selected days, the days between them as one span.
    expect(day('1')?.className).toContain('text-onaccent')
    expect(day('19')?.className).toContain('text-onaccent')
    expect(day('10')?.className).toContain('bg-cyan-500/15')
    expect(day('2')?.className).toContain('bg-cyan-500/15')
    // The span carries a shape cue beside the tint, so it is not color alone.
    expect(day('10')?.className).toContain('underline')
    // AT reads the whole span as selected cells, not just the field's own day.
    const cell = (label: string) => day(label)?.closest('[role="gridcell"]')
    expect(cell('1')?.getAttribute('aria-selected')).toBe('true')
    expect(cell('10')?.getAttribute('aria-selected')).toBe('true')
    expect(cell('19')?.getAttribute('aria-selected')).toBe('true')
    expect(panel.querySelector('[role="grid"]')?.getAttribute('aria-multiselectable')).toBe('true')
    // A day outside the span keeps the plain day color.
    expect(day('25')?.className).not.toContain('bg-cyan-500')
    expect(cell('25')?.getAttribute('aria-selected')).toBe('false')
  })

  it('leaves the days plain until the range highlight is on', () => {
    instance = mount(DateInput, {
      target,
      props: { ...rangeProps, from: '2026-09-01', to: '2026-09-19' },
    })
    flushSync()
    openTrigger()
    const panel = document.querySelector('[role="dialog"]') as HTMLElement
    const day = (label: string) =>
      [...panel.querySelectorAll('button[aria-label]')].find(node => node.textContent?.trim() === label)
    expect(day('10')?.className).not.toContain('bg-cyan-500')
    // The other end's day reads as a plain day, not as a selected one.
    expect(day('19')?.className).not.toContain('text-onaccent')
    // Without a highlight there is no span to announce.
    expect(panel.querySelector('[role="grid"]')?.hasAttribute('aria-multiselectable')).toBe(false)
  })

  it('swaps the two days when the end commits one before the start', async () => {
    instance = mount(RangeHarness, { target, props: {} })
    flushSync()
    const start = field(0)
    start.value = '2026-09-19'
    start.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    start.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))

    // An end committed before the start becomes the start, and the old start
    // becomes the end: the pair keeps its days in order.
    const end = field(1)
    end.value = '2026-09-01'
    end.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    end.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(target.querySelector('[data-range]')?.textContent).toBe('2026-09-01 – 2026-09-19')
    expect(field(0).value).toBe('2026-09-01')
    expect(field(1).value).toBe('2026-09-19')
  })

  it('swaps the two days when the start commits one after the end', async () => {
    instance = mount(RangeHarness, { target, props: {} })
    flushSync()
    const end = field(1)
    end.value = '2026-09-10'
    end.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    end.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))

    const start = field(0)
    start.value = '2026-09-25'
    start.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    start.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(target.querySelector('[data-range]')?.textContent).toBe('2026-09-10 – 2026-09-25')
  })

  it('swaps the two days when a pick lands before the start', async () => {
    instance = mount(RangeHarness, { target, props: {} })
    flushSync()
    const start = field(0)
    start.value = '2026-09-19'
    start.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    start.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))
    // The end's own calendar is open on the start's month; a pick before the
    // start becomes the start, and the old start becomes the end.
    dayButton('5').click()
    flushSync()
    expect(target.querySelector('[data-range]')?.textContent).toBe('2026-09-05 – 2026-09-19')
  })

  it('keeps a commit that already sits in order', async () => {
    instance = mount(RangeHarness, { target, props: {} })
    flushSync()
    const start = field(0)
    start.value = '2026-09-01'
    start.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    start.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))

    const end = field(1)
    end.value = '2026-09-19'
    end.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    end.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(target.querySelector('[data-range]')?.textContent).toBe('2026-09-01 – 2026-09-19')
  })

  it('keeps a date-time range valid when the ends swap', async () => {
    instance = mount(RangeTimeHarness, {
      target,
      props: { from: '2026-09-05T00:00:00', to: '2026-09-05T00:00:00' },
    })
    flushSync()
    // The end's own panel, with the time row.
    const buttons = [...target.querySelectorAll('button')]
    buttons[1]!.click()
    flushSync()
    const hour = document.querySelector('input[aria-label="Hour"]') as HTMLInputElement
    hour.focus()
    // Stepping the hour below midnight rolls the date back a day, so the end
    // lands before the start.
    hour.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))
    // The two instants exchange, so both values stay date-times the fields can
    // read (a bare day would read as unset).
    expect(target.querySelector('[data-range]')?.textContent).toBe('2026-09-04T23:00:00 – 2026-09-05T00:00:00')
    expect(field(0).value).toBe('2026-09-04 23:00:00')
    expect(field(1).value).toBe('2026-09-05 00:00:00')
  })

  it('swaps the ends when a clock steps past the other end', async () => {
    instance = mount(RangeTimeHarness, {
      target,
      props: { from: '2026-10-14T00:00:00', to: '2026-10-14T00:05:00' },
    })
    flushSync()
    // The start's own panel, with the time row.
    const buttons = [...target.querySelectorAll('button')]
    buttons[0]!.click()
    flushSync()
    const hour = document.querySelector('input[aria-label="Hour"]') as HTMLInputElement
    hour.focus()
    // The start's hour steps past the end's clock, so the two ends exchange.
    hour.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(target.querySelector('[data-range]')?.textContent).toBe('2026-10-14T00:05:00 – 2026-10-14T01:00:00')
    expect(field(0).value).toBe('2026-10-14 00:05:00')
    expect(field(1).value).toBe('2026-10-14 01:00:00')
  })

  it('keeps a time adjustment in order when it stays inside the other end', async () => {
    instance = mount(RangeTimeHarness, {
      target,
      props: { from: '2026-09-05T10:00:00', to: '2026-09-05T10:00:00' },
    })
    flushSync()
    const buttons = [...target.querySelectorAll('button')]
    buttons[1]!.click()
    flushSync()
    const hour = document.querySelector('input[aria-label="Hour"]') as HTMLInputElement
    hour.focus()
    // The hour steps down within the same day, so the end lands before the
    // start: the two instants exchange and the pair stays in order.
    hour.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    flushSync()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(target.querySelector('[data-range]')?.textContent).toBe('2026-09-05T09:00:00 – 2026-09-05T10:00:00')
  })

  it('checks a range and a time coexist as two date-time fields', () => {
    instance = mount(DateInput, {
      target,
      props: {
        ...rangeProps,
        time: true,
        from: '2026-09-01T08:30:00',
        to: '2026-09-19T17:00:00',
      },
    })
    flushSync()
    expect(field(0).value).toBe('2026-09-01 08:30:00')
    expect(field(1).value).toBe('2026-09-19 17:00:00')
    expect(field(0).getAttribute('aria-label')).toBe('From: 2026-09-01 08:30:00')
    // Each panel carries its own time row, down to the second.
    openTrigger()
    expect((document.querySelector('input[aria-label="Hour"]') as HTMLInputElement).value).toBe('08')
    expect((document.querySelector('input[aria-label="Minute"]') as HTMLInputElement).value).toBe('30')
    expect((document.querySelector('input[aria-label="Second"]') as HTMLInputElement).value).toBe('00')
  })

  it('moves the roving focus with the arrow keys', () => {
    instance = mount(RangeHarness, { target, props: {} })
    flushSync()
    openTrigger()
    const focusable = document.querySelector('button[tabindex="0"]') as HTMLButtonElement
    const start = focusable.getAttribute('aria-label')
    focusable.focus()
    focusable.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    flushSync()
    const moved = document.querySelector('button[tabindex="0"]') as HTMLButtonElement
    expect(moved.getAttribute('aria-label')).not.toBe(start)
  })
})
