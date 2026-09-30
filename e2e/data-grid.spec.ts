import { expect, test } from '@playwright/test'

// The DataGrid demo is the canonical spreadsheet control: a header row plus
// body cells, in-place editing with history, and keyboard navigation. These
// assertions pin those behaviors so the owned-node ref registry cannot regress
// focus or editing.
test('showcase: DataGrid renders its rows and tabs between cells', async ({ page }) => {
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const root = page.locator('[data-testid="data-grid"]')
  await expect(root).toBeVisible()

  // Header row (data-row="0") is a th row of 3; four body rows of 3 td cells.
  await expect(root.locator('textarea[data-row]')).toHaveCount(15)
  await expect(root.locator('th textarea')).toHaveCount(3)
  await expect(root.locator('td[role="gridcell"] textarea')).toHaveCount(12)
  await expect(root.locator('textarea[data-row="1"][data-col="0"]')).toHaveValue('Ada Lovelace')

  // Tab moves focus to the next cell, wrapping to the next row's first cell.
  await root.locator('textarea[data-row="1"][data-col="0"]').focus()
  await page.keyboard.press('Tab')
  await expect(root.locator('textarea[data-row="1"][data-col="1"]')).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(root.locator('textarea[data-row="2"][data-col="0"]')).toBeFocused()
})

test('showcase: DataGrid edits a cell and undoes the edit', async ({ page }) => {
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const root = page.locator('[data-testid="data-grid"]')
  const cell = root.locator('textarea[data-row="1"][data-col="0"]')

  await cell.click()
  await cell.fill('Ada L.')
  await expect(cell).toHaveValue('Ada L.')

  // The grid history shortcut is captured on the grid container.
  await page.keyboard.press('ControlOrMeta+z')
  await expect(cell).toHaveValue('Ada Lovelace')
})

test('showcase: DataGrid settings panel drives editability and headers', async ({ page }) => {
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const demo = (name: string) => page.getByRole('region', { name })
  const root = demo('Default').locator('[data-testid="data-grid"]')

  // Pristine: editable, header row present.
  await expect(root.locator('td[role="gridcell"] textarea')).toHaveCount(12)
  await expect(root.locator('textarea').first()).toBeEditable()

  // Editable: No makes every cell read-only.
  await page.getByRole('combobox', { name: 'Editable' }).click()
  await page.getByRole('option', { name: 'No' }).click()
  await expect(demo('Customized').locator('[data-testid="data-grid"] textarea').first()).not.toBeEditable()

  // Show headers: No treats the first row as data (5 data rows, no th row).
  await page.getByRole('combobox', { name: 'Show headers' }).click()
  await page.getByRole('option', { name: 'No' }).click()
  const customized = demo('Customized').locator('[data-testid="data-grid"]')
  await expect(customized.locator('th textarea')).toHaveCount(0)
  await expect(customized.locator('td[role="gridcell"] textarea')).toHaveCount(15)

  // Reset restores the component defaults.
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(demo('Default').locator('[data-testid="data-grid"] td[role="gridcell"] textarea')).toHaveCount(12)
})
