import { expect, test } from '@playwright/test'
import { showcaseDemo } from './helpers'

test('showcase: the Chip disabled Value cell disables the remove button', async ({ page }) => {
  await page.goto('/components/chip')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  // Switch to removable mode through the `removable` Value cell.
  const removableBox = page.getByRole('checkbox', { name: 'removable value', exact: true })
  await removableBox.focus()
  await page.keyboard.press('Space')
  await expect(removableBox).toBeChecked()
  const remove = demo.getByRole('button').first()
  await expect(remove).toBeEnabled()

  // Checking the disabled Value box disables the demo remove button.
  const disabledBox = page.getByRole('checkbox', { name: 'disabled value', exact: true })
  await disabledBox.focus()
  await page.keyboard.press('Space')
  await expect(remove).toBeDisabled()
})

test('showcase: the Chip tooltip Value cell wraps the pill', async ({ page }) => {
  await page.goto('/components/chip')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('textbox', { name: 'tooltip value', exact: true }).fill('Pill tip')
  await demo.getByText('Default', { exact: true }).hover()
  // The tooltip box portals to document.body, so anchor on the page.
  await expect(page.getByText('Pill tip')).toBeVisible()
})

test('showcase: the Chip size Value cell scales the pill', async ({ page }) => {
  await page.goto('/components/chip')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('combobox', { name: 'size value' }).click()
  await page.getByRole('option', { name: 'lg' }).click()

  // lg = 18px dimension → a 13.5px label on the chip root.
  await expect(demo.locator('[style*="--chip-font"]').first()).toHaveAttribute('style', /--chip-font:\s*13\.5px/)
})
