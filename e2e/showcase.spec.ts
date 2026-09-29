import { expect, test } from '@playwright/test'

test('showcase: index redirects to the two-pane component browser', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/components\/base-dialog$/)
  await expect(page.getByRole('searchbox', { name: 'Search components' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'BaseDialog' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'SelectDropdown' })).toBeVisible()
})

test('showcase: the left-pane search filters the component list', async ({ page }) => {
  await page.goto('/components/base-dialog')
  // Hydration binds the search input; wait for it before interacting.
  await page.waitForLoadState('networkidle')
  await page.getByRole('searchbox', { name: 'Search components' }).fill('spin')
  await expect(page.getByRole('link', { name: 'Spinner' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'BaseDialog' })).toHaveCount(0)
})

test('showcase: the theme icon menu changes the document theme', async ({ page }) => {
  await page.goto('/components/base-dialog')
  // Hydration attaches the menu trigger handler; wait for it before clicking.
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Theme' }).click()
  await page.getByRole('menuitemradio', { name: 'Light' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('showcase: a deep link selects its component in the picker', async ({ page }) => {
  await page.goto('/components/tabs')
  await expect(page.getByRole('heading', { level: 1, name: 'Tabs' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Tabs' })).toHaveAttribute('aria-current', 'page')
})

test('showcase: an unknown slug renders the localized not-found state', async ({ page }) => {
  await page.goto('/components/nope')
  await expect(page.getByRole('heading', { level: 1, name: 'Component not found' })).toBeVisible()
})
