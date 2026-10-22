import { expect, test } from '@playwright/test'
import { showCodeToggle, showcaseDemo, snippetEditor, snippetError } from './helpers'

// DateInput follows the converted showcase layout: the code toggle sits beside
// the component title, the demo sits in a resizable frame, and the props table
// appends a Value column.
test('showcase: DateInput reproduces its demo from Show code', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(page.getByRole('heading', { level: 1, name: 'DateInput' })).toBeVisible()
  // The demo sits in a resizable frame (Resizable renders width/height/corner).
  await expect(demo.locator('[role="separator"]')).toHaveCount(3)

  const before = (await demo.innerText()).replace(/\s+/g, ' ').trim()
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  await expect.poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 }).toBe(before)
  await expect(snippetError(page)).toHaveCount(0)
})

test('showcase: picking a DateInput day updates the demo readout', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await demo.getByRole('button', { name: 'Choose a date' }).click()
  await page.locator('[role="dialog"] button[aria-current="date"]').click()
  await expect(demo).toContainText(/value: \d{4}-\d{2}-\d{2}/)
})

test('showcase: typing in the DateInput field commits a valid date and reverts a bad one', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const field = demo.getByRole('textbox')
  await field.fill('2026-10-05')
  await field.blur()
  await expect(demo).toContainText('value: 2026-10-05')
  // An impossible date is rejected and the field reverts to the committed value.
  await field.fill('2026-02-31')
  await field.blur()
  await expect(field).toHaveValue('2026-10-05')
  await expect(demo).toContainText('value: 2026-10-05')
})

test('showcase: a date typed in a date-time field defaults the time to midnight', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('checkbox', { name: 'time value', exact: true }).check({ force: true })
  const field = demo.getByRole('textbox')
  // The date alone commits with the time defaulted to midnight.
  await field.fill('2026-10-14')
  await field.press('Enter')
  await expect(demo).toContainText('value: 2026-10-14T00:00:00')
  await expect(field).toHaveValue('2026-10-14 00:00:00')

  // A partial clock commits with the units it leaves out defaulted.
  await field.fill('2026-01-12 03')
  await field.press('Enter')
  await expect(demo).toContainText('value: 2026-01-12T03:00:00')
  await expect(field).toHaveValue('2026-01-12 03:00:00')
})

test('showcase: the open calendar follows a value typed into the field', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const field = demo.getByRole('textbox')
  // The field's own key opens the panel without moving focus out of it.
  await field.click()
  await field.press('ArrowDown')
  const panel = page.locator('[role="dialog"]')
  await expect(panel).toBeVisible()

  // A valid entry moves the grid as it is typed, before anything is committed,
  // and highlights the previewed day in it.
  await field.fill('2027-03-04')
  await expect(panel).toContainText('March 2027')
  const selectedCell = panel.locator('[role="gridcell"][aria-selected="true"]')
  await expect(selectedCell.getByRole('button', { name: /March 4, 2027/ })).toBeVisible()
  await expect(demo).not.toContainText('value: 2027-03-04')

  // Committing the same text keeps the grid and the highlight there, and lands
  // the value.
  await field.press('Enter')
  await expect(demo).toContainText('value: 2027-03-04')
  await expect(panel).toContainText('March 2027')
  await expect(selectedCell.getByRole('button', { name: /March 4, 2027/ })).toBeVisible()
})

test('showcase: the range toggle turns the field into a from/to pair', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo.getByRole('textbox')).toHaveCount(1)

  await page.getByRole('checkbox', { name: 'range value', exact: true }).check({ force: true })
  // Two independent fields, each with its own calendar affordance.
  await expect(demo.getByRole('textbox')).toHaveCount(2)
  await expect(demo.getByRole('button', { name: 'From: Choose a date' })).toBeVisible()
  // A pick in the end field writes that end only.
  await demo.getByRole('button', { name: 'To: Choose a date' }).click()
  await page.locator('[role="dialog"] button[aria-current="date"]').click()
  await expect(demo).toContainText(/range: — – \d{4}-\d{2}-\d{2}/)
})

test('showcase: filling one end of the range hands the focus to the empty one', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('checkbox', { name: 'range value', exact: true }).check({ force: true })

  const from = demo.getByRole('textbox').first()
  await from.fill('2026-09-10')
  await from.press('Enter')
  // The empty end takes the focus and opens its own calendar.
  await expect(demo.getByRole('textbox').nth(1)).toBeFocused()
  await expect(page.locator('[role="dialog"]')).toBeVisible()
  await expect(demo).toContainText('range: 2026-09-10 –')
})

test('showcase: a pick before the start becomes the start', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('checkbox', { name: 'range value', exact: true }).check({ force: true })

  const from = demo.getByRole('textbox').first()
  await from.fill('2026-09-19')
  await from.press('Enter')
  // The end's own calendar is open on the start's month; a pick before the
  // start becomes the start, and the old start becomes the end.
  await page.locator('[role="dialog"] button', { hasText: /^5$/ }).click()
  await expect(demo).toContainText('range: 2026-09-05 – 2026-09-19')
})

test('showcase: a clock stepped past the other end swaps the ends', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('checkbox', { name: 'range value', exact: true }).check({ force: true })
  await page.getByRole('checkbox', { name: 'time value', exact: true }).check({ force: true })
  await page.getByRole('textbox', { name: 'from value', exact: true }).fill('2026-10-14T00:00:00')
  await page.getByRole('textbox', { name: 'to value', exact: true }).fill('2026-10-14T00:05:00')

  await demo.getByRole('button', { name: 'From: Choose a date' }).click()
  // The start's clock steps past the end's, so the two ends exchange.
  const hour = page.locator('[role="dialog"] input[aria-label="Hour"]')
  await hour.focus()
  await hour.press('ArrowUp')
  await expect(demo).toContainText('range: 2026-10-14T00:05:00 – 2026-10-14T01:00:00')
})

test('showcase: the range highlight paints the days between the ends', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('checkbox', { name: 'range value', exact: true }).check({ force: true })
  await page.getByRole('checkbox', { name: 'highlightRange value', exact: true }).check({ force: true })
  await page.getByRole('textbox', { name: 'from value', exact: true }).fill('2026-09-01')
  await page.getByRole('textbox', { name: 'to value', exact: true }).fill('2026-09-19')

  await demo.getByRole('button', { name: 'From: Choose a date' }).click()
  // The panel is portalled to document.body, so it is asserted page-wide.
  const panel = page.locator('[role="dialog"]')
  await expect(panel).toContainText('September 2026')
  // The days between the ends read as one highlighted span.
  await expect(panel.locator('button', { hasText: /^10$/ })).toHaveClass(/bg-cyan-500\/15/)
  await expect(panel.locator('button', { hasText: /^25$/ })).not.toHaveClass(/bg-cyan-500\/15/)
})

test('showcase: the time row carries a stepped segment and rolls the date', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('checkbox', { name: 'time value', exact: true }).check({ force: true })
  // Seed the day the row edits: a date-only value carries no time yet.
  await page.getByRole('textbox', { name: 'value value', exact: true }).fill('2026-09-05')
  await demo.getByRole('button', { name: 'Choose a date' }).click()

  // The panel is portalled to document.body, so the row is asserted page-wide.
  const hour = page.locator('[role="dialog"] input[aria-label="Hour"]')
  const minute = page.locator('[role="dialog"] input[aria-label="Minute"]')
  const second = page.locator('[role="dialog"] input[aria-label="Second"]')
  await expect(hour).toHaveValue('00')
  await expect(minute).toHaveValue('00')
  await expect(second).toHaveValue('00')

  // A minute stepped past 59 carries into the hour.
  await minute.fill('59')
  await minute.press('ArrowUp')
  await expect(minute).toHaveValue('00')
  await expect(hour).toHaveValue('01')
  await expect(demo).toContainText('value: 2026-09-05T01:00:00')

  // The top of the day rolls the date, so the clock never clamps or rewinds.
  await hour.fill('23')
  await expect(demo).toContainText('value: 2026-09-05T23:00:00')
  await minute.fill('59')
  await expect(demo).toContainText('value: 2026-09-05T23:59:00')
  await second.fill('59')
  await expect(demo).toContainText('value: 2026-09-05T23:59:59')
  await second.press('ArrowUp')
  await expect(demo).toContainText('value: 2026-09-06T00:00:00')
  // The rolled date does not steal the focus from the segment being stepped.
  await expect(second).toBeFocused()
})

test('showcase: the DateInput size Value cell scales the picker', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('combobox', { name: 'size value' }).click()
  await page.getByRole('option', { name: 'lg' }).click()

  // lg = 18px dimension → a 14.625px field font.
  await expect(demo.locator('[style*="--pick-font"]').first()).toHaveAttribute('style', /--pick-font:\s*14\.625px/)
})

test('showcase: the DateInput format Value cell drives the field text', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('textbox', { name: 'value value', exact: true }).fill('2026-09-19')
  await page.getByRole('textbox', { name: 'format value', exact: true }).fill('D MMM YYYY')
  await expect(demo.getByRole('textbox')).toHaveValue('19 Sep 2026')
})

test('showcase: the open calendar carries the size metrics on the portalled panel', async ({ page }) => {
  await page.goto('/components/date-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await demo.getByRole('button', { name: 'Choose a date' }).click()
  // The panel is portalled to document.body, so it must carry its own
  // `--pick-*` set (not inherit the picker root's).
  await expect(page.locator('[role="dialog"]')).toHaveAttribute('style', /--pick-panel-width:\s*272px/)
})
