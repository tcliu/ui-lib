import { expect, test } from '@playwright/test'

test('showcase: the Checkbox checked Value cell drives the demo', async ({ page }) => {
  await page.goto('/components/checkbox')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await expect(demo).toContainText('checked: true')

  // Unchecking the Value box unchecks the demo box and updates the readout.
  const checkedBox = page.getByRole('checkbox', { name: 'checked value', exact: true })
  await checkedBox.focus()
  await page.keyboard.press('Space')
  await expect(demo).toContainText('checked: false')
  await expect(demo.getByRole('checkbox').first()).not.toBeChecked()
})

test('showcase: the Checkbox name Value cell sets the input name', async ({ page }) => {
  await page.goto('/components/checkbox')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await page.getByRole('textbox', { name: 'name value', exact: true }).fill('confirm')
  await expect(demo.getByRole('checkbox').first()).toHaveAttribute('name', 'confirm')
})
