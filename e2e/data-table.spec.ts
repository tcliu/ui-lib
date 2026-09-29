import { expect, test } from '@playwright/test'
import { editorContains } from './helpers'

test('showcase: DataTable toolbar hosts search plus column selector and reset', async ({ page }) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const section = page.getByRole('region', { name: 'Default' })

  // The search box precedes the column selector and reset icons in DOM order.
  const search = section.getByRole('searchbox', { name: 'Search rows' })
  await expect(search).toBeVisible()
  const order = await section.evaluate(sectionEl => {
    const pos = (name: string) =>
      [...sectionEl.querySelectorAll('*')].findIndex(el => el.getAttribute('aria-label') === name)
    return [pos('Search rows'), pos('Choose columns'), pos('Reset columns')]
  })
  expect(order[0]).toBeGreaterThanOrEqual(0)
  expect(order[0]).toBeLessThan(order[1])
  expect(order[1]).toBeLessThan(order[2])

  // Searching narrows the rows; the selector hides a column; reset restores it.
  const statusCell = section.locator('tbody td', { hasText: 'Active' }).first()
  await search.fill('Viewer')
  await expect(section.locator('tbody tr')).toHaveCount(1)
  await search.fill('')
  await expect(section.locator('tbody tr')).toHaveCount(10)
  await section.getByRole('button', { name: 'Choose columns' }).click()
  // The panel is portaled to the body by positionPanel, so it is no longer a
  // descendant of the section; select it by role instead.
  const panel = page.locator('.panel[role="group"]')
  await expect(panel).toBeVisible()
  // The panel drops below the trigger, fully inside the viewport.
  const inViewport = await panel.evaluate(el => {
    const r = el.getBoundingClientRect()
    return r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth
  })
  expect(inViewport).toBe(true)
  await panel.locator('label', { hasText: 'Status' }).click()
  await expect(statusCell).toHaveCount(0)
  await section.getByRole('button', { name: 'Reset columns' }).click()
  await expect(section.locator('tbody td', { hasText: 'Active' }).first()).toBeVisible()

  // Resizable columns are off by default; the settings panel enables them.
  await expect(section.getByRole('button', { name: /^Resize / })).toHaveCount(0)

  // The row total rides at the pagination row's right edge.
  await expect(section.locator('nav').getByText('30 rows')).toBeVisible()
})

test('showcase: DataTable settings panel drives the demo table', async ({ page }) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  // The settings panel is a plain div below the demo: its controls are
  // located page-wide while demo assertions stay inside the demo region,
  // whose title flips between Default and Customized with the form state.
  const demo = (name: string) => page.getByRole('region', { name })

  // Pristine: every field unset, the section reads Default.
  await expect(demo('Default')).toBeVisible()
  await expect(demo('Default').getByRole('searchbox', { name: 'Search rows' })).toBeVisible()
  await expect(demo('Default').locator('tbody input[type="checkbox"]')).toHaveCount(0)

  // Yes/No/unset tri-state: picking Yes enables selection and retitles.
  await page.getByRole('combobox', { name: 'Selectable rows' }).click()
  await page.getByRole('option', { name: 'Yes' }).click()
  await expect(demo('Customized').locator('tbody input[type="checkbox"]')).toHaveCount(10)
  await expect(demo('Customized')).toBeVisible()

  // The clear cross is smaller than standard icons and returns focus.
  const clearBox = await page.getByRole('button', { name: 'Clear selectable rows' }).locator('svg').boundingBox()
  expect(clearBox?.width).toBe(12)
  expect(clearBox?.height).toBe(12)

  // The option panel spans at least the trigger width.
  await page.getByRole('combobox', { name: 'Dense padding' }).click()
  const panelWidths = await page.evaluate(() => {
    const panel = document.querySelector('[role="listbox"]')
    const trigger = document.querySelector('[aria-label="Dense padding"]')
    return {
      panel: panel?.getBoundingClientRect().width ?? 0,
      trigger: trigger?.getBoundingClientRect().width ?? 0,
    }
  })
  expect(panelWidths.trigger).toBeGreaterThan(0)
  expect(panelWidths.panel).toBeGreaterThanOrEqual(panelWidths.trigger - 1)
  await page.keyboard.press('Escape')

  // The cross clears back to unset; the section reads Default again.
  await page.getByRole('button', { name: 'Clear selectable rows' }).click()
  await expect(demo('Default').locator('tbody input[type="checkbox"]')).toHaveCount(0)
  await expect(demo('Default')).toBeVisible()

  // Placeholder text flows into the demo and the regenerated snippet source.
  await page.getByLabel('Search placeholder').fill('Find rows')
  await expect(demo('Customized').getByRole('searchbox', { name: 'Search rows' })).toHaveAttribute(
    'placeholder',
    'Find rows',
  )
  await demo('Customized').getByRole('button', { name: 'Show code' }).click()
  await expect(demo('Customized').locator('.cm-content')).toBeVisible()
  expect(await editorContains(page, demo('Customized'), 'searchPlaceholder="Find rows"')).toBe(true)
  await demo('Customized').getByRole('button', { name: 'Hide code' }).click()

  // Reset returns every field to unset.
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(demo('Default')).toBeVisible()
  await expect(demo('Default').getByRole('searchbox', { name: 'Search rows' })).toHaveAttribute('placeholder', 'Search')
})

test('showcase: the data-table demo stage has no resize handle', async ({ page }) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const section = page.locator('main > div > section').first()
  await expect(section.locator('[role="separator"]')).toHaveCount(0)
})
