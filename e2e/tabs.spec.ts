import { expect, test } from '@playwright/test'

test('showcase: the Tabs ariaLabel Value cell renames the nav', async ({ page }) => {
  await page.goto('/components/tabs')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await expect(demo.getByRole('navigation')).toBeVisible()

  await page.getByRole('textbox', { name: 'ariaLabel value', exact: true }).fill('Custom tabs')
  await expect(demo.getByRole('navigation', { name: 'Custom tabs' })).toBeVisible()

  await page.getByRole('textbox', { name: 'ariaLabel value', exact: true }).fill('')
  await expect(demo.getByRole('navigation', { name: 'Custom tabs' })).toHaveCount(0)
})

test('showcase: the Tabs pathname Value cell switches the tabs to links', async ({ page }) => {
  await page.goto('/components/tabs')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await expect(demo.getByRole('link')).toHaveCount(0)

  await page.getByRole('textbox', { name: 'pathname value', exact: true }).fill('details')
  await expect(demo.getByRole('link')).toHaveCount(2)
  await expect(demo.locator('a[aria-current="page"]')).toHaveCount(1)

  await page.getByRole('textbox', { name: 'pathname value', exact: true }).fill('')
  await expect(demo.getByRole('link')).toHaveCount(0)
  await expect(demo.getByRole('button').first()).toBeVisible()
})
