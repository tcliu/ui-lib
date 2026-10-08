import { expect, test } from '@playwright/test'

// DateRangePicker follows the converted showcase layout: the code toggle sits
// beside the component title, the demo sits in a borderless width-only
// resizable frame, and the props table appends an editable Value column.
test('showcase: DateRangePicker hosts its code toggle in the title row beside a resizable demo', async ({ page }) => {
  await page.goto('/components/date-range-picker')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const toggle = page.locator('main header').getByRole('button')

  await expect(page.getByRole('heading', { level: 1, name: 'DateRangePicker' })).toBeVisible()
  await expect(toggle).toHaveCount(1)

  // The demo sits in a width-only resizable frame (one right-edge handle), with
  // no pane padding so its left edge lines up with the config panel below.
  await expect(demo.locator('[role="separator"]')).toHaveCount(1)

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the stage snippet, which reproduces the demo.
  const before = (await demo.innerText()).replace(/\s+/g, ' ').trim()
  await toggle.click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  await expect.poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 }).toBe(before)
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})

test('showcase: the DateRangePicker Value edits track the demo and the snippet', async ({ page }) => {
  await page.goto('/components/date-range-picker')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()

  // Editing the range in the Value column updates the demo readout.
  await page.getByRole('textbox', { name: 'from value' }).fill('2026-09-01')
  await page.getByRole('textbox', { name: 'to value' }).fill('2026-09-19')
  await expect(demo).toContainText('range: 2026-09-01 – 2026-09-19')

  // The committed range is seeded as script-local state, so opening Show code
  // shows the edit in the editor text too.
  await page.locator('main header button').click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  await expect(page.locator('main .cm-content').first()).toContainText('let from = $state("2026-09-01")')
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})
