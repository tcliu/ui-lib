import { expect, test } from '@playwright/test'

test('showcase: the Toast closeLabel Value cell renames the dismiss button', async ({ page }) => {
  await page.goto('/components/toast')
  await page.waitForLoadState('networkidle')

  await page.getByRole('textbox', { name: 'closeLabel value', exact: true }).fill('Dismiss now')
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const toast = page.getByRole('status')
  await expect(toast).toBeVisible()
  await expect(toast.getByRole('button', { name: 'Dismiss now' })).toBeVisible()
})
