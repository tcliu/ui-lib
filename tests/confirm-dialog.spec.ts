import { expect, test } from '@playwright/test'

test('showcase: the ConfirmDialog title Value cell edits the dialog heading', async ({ page }) => {
  await page.goto('/components/confirm-dialog')
  await page.waitForLoadState('networkidle')

  await page.getByRole('textbox', { name: 'title value', exact: true }).fill('Custom heading')
  await page.getByRole('button', { name: 'Delete' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Custom heading' })).toBeVisible()
  await page.keyboard.press('Escape')

  // Clearing restores the localized default heading.
  await page.getByRole('textbox', { name: 'title value', exact: true }).fill('')
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('dialog').getByRole('heading').first()).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('heading').first()).not.toHaveText('Custom heading')
  await page.keyboard.press('Escape')
})
