import { expect, test } from '@playwright/test'

test('showcase: the FormField size Value cell scales the label', async ({ page }) => {
  await page.goto('/components/form-field')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await page.getByRole('combobox', { name: 'size value' }).click()
  await page.getByRole('option', { name: 'lg' }).click()

  // lg = 18px dimension → a 15.75px label on the field wrapper.
  await expect(demo.locator('[style*="--ff-font"]').first()).toHaveAttribute('style', /--ff-font:\s*15\.75px/)
})
