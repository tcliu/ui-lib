import { expect, test } from '@playwright/test'

test('showcase: ChipDropdown search selects its text with Shift+Home', async ({ page }) => {
  await page.goto('/components/chip-dropdown')
  // Hydration binds the playground controls; wait before interacting.
  await page.waitForLoadState('networkidle')

  // Turn on the filterable search field via the playground.
  await page.getByRole('combobox', { name: 'Filterable' }).click()
  await page.getByRole('option', { name: 'Yes' }).click()

  // Open the chip menu; the header search input mounts and takes focus.
  await page.getByRole('button', { name: 'Set status' }).click()
  const search = page.getByRole('combobox', { name: 'Search…' })
  await expect(search).toBeVisible()

  await search.fill('act')
  await expect(search).toHaveValue('act')
  const highlight = await search.getAttribute('aria-activedescendant')

  // Shift+Home belongs to the text field: it selects the whole query and must
  // not move the list highlight.
  await page.keyboard.press('Shift+Home')
  const selection = await search.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd])
  expect(selection).toEqual([0, 3])
  await expect(search).toHaveAttribute('aria-activedescendant', highlight ?? '')

  // Plain ArrowDown still drives the list highlight.
  await page.keyboard.press('ArrowDown')
  await expect(search).toHaveAttribute('aria-activedescendant', /-option-\d+/)
})
