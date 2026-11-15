import { expect, test } from '@playwright/test'
import { showcaseDemo } from './helpers'

test('showcase: the Tabs ariaLabel Value cell renames the nav', async ({ page }) => {
  await page.goto('/components/tabs')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo.getByRole('navigation')).toBeVisible()

  await page.getByRole('textbox', { name: 'ariaLabel value', exact: true }).fill('Custom tabs')
  await expect(demo.getByRole('navigation', { name: 'Custom tabs' })).toBeVisible()

  await page.getByRole('textbox', { name: 'ariaLabel value', exact: true }).fill('')
  await expect(demo.getByRole('navigation', { name: 'Custom tabs' })).toHaveCount(0)
})

test('showcase: the Tabs pathname Value cell switches the tabs to links', async ({ page }) => {
  await page.goto('/components/tabs')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo.getByRole('link')).toHaveCount(0)

  await page.getByRole('textbox', { name: 'pathname value', exact: true }).fill('details')
  await expect(demo.getByRole('link')).toHaveCount(2)
  await expect(demo.locator('a[aria-current="page"]')).toHaveCount(1)

  await page.getByRole('textbox', { name: 'pathname value', exact: true }).fill('')
  await expect(demo.getByRole('link')).toHaveCount(0)
  await expect(demo.getByRole('button').first()).toBeVisible()
})

test('showcase: the Tabs size Value cell scales the tab bar', async ({ page }) => {
  await page.goto('/components/tabs')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('combobox', { name: 'size value' }).click()
  await page.getByRole('option', { name: 'lg' }).click()

  // lg = 18px dimension → a 15.75px label on the tab root.
  await expect(demo.locator('[style*="--tabs-font"]').first()).toHaveAttribute('style', /--tabs-font:\s*15\.75px/)
})

test('showcase: the Tabs variant Value cell switches to the segmented pill row', async ({ page }) => {
  await page.goto('/components/tabs')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const activeTab = demo.getByRole('button', { name: 'Default', exact: true })

  // The default is the underline strip: a bottom accent on the active tab.
  await expect(activeTab).toHaveCSS('border-bottom-width', '2px')

  await page.getByRole('combobox', { name: 'variant value', exact: true }).click()
  await page.getByRole('option', { name: 'segmented' }).click()
  await expect(activeTab).toHaveCSS('border-bottom-width', '0px')
})
