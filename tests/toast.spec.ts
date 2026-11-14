import { expect, test } from '@playwright/test'

test('showcase: the Toast variant Value cell switches the surface treatment', async ({ page }) => {
  await page.goto('/components/toast')
  await page.waitForLoadState('networkidle')

  const toast = page.getByRole('status')
  const openToast = () => page.getByRole('button', { name: 'Open dialog' }).click()
  const closeToast = () => toast.getByRole('button', { name: 'Close', exact: true }).click()
  const chooseVariant = async (name: string) => {
    await page.getByRole('combobox', { name: 'variant value', exact: true }).click()
    await page.getByRole('option', { name, exact: true }).click()
  }

  // Soft (default): the type tint fills the surface and the accent edge is wide.
  await openToast()
  await expect(toast).toBeVisible()
  await expect(toast).toHaveCSS('border-left-width', '8px')
  await expect(toast).toHaveCSS('background-color', 'rgb(24, 164, 184)')
  await closeToast()
  await expect(toast).toHaveCount(0)

  // Solid: the type color fills the whole surface, so every border is the
  // type-colored frame rather than the soft look's wide accent edge.
  await chooseVariant('solid')
  await openToast()
  await expect(toast).toHaveCSS('border-left-width', '1px')
  await expect(toast).toHaveCSS('background-color', 'rgb(24, 164, 184)')
  await closeToast()
  await expect(toast).toHaveCount(0)

  // Outline: the page surface returns behind a type-colored frame.
  await chooseVariant('outline')
  await openToast()
  await expect(toast).toHaveCSS('border-left-width', '8px')
  const outlineBackground = await toast.evaluate(node => getComputedStyle(node).backgroundColor)
  expect(outlineBackground).not.toBe('rgb(24, 164, 184)')
  await closeToast()
  await expect(toast).toHaveCount(0)
})

test('showcase: the Toast closeLabel Value cell renames the dismiss button', async ({ page }) => {
  await page.goto('/components/toast')
  await page.waitForLoadState('networkidle')

  await page.getByRole('textbox', { name: 'closeLabel value', exact: true }).fill('Dismiss now')
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const toast = page.getByRole('status')
  await expect(toast).toBeVisible()
  await expect(toast.getByRole('button', { name: 'Dismiss now' })).toBeVisible()
})
