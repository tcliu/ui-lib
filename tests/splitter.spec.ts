import { expect, test } from '@playwright/test'
import { showcaseDemo } from './helpers'

test('showcase: the Splitter value Value cell moves the divider', async ({ page }) => {
  await page.goto('/components/splitter')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const separator = demo.getByRole('separator')
  await expect(separator).toBeVisible()
  await expect(separator).toHaveAttribute('aria-valuenow', '160')

  // The NumberInput is controlled, so select-all + type instead of fill
  // (fill races its re-render and appends).
  const value = page.getByRole('textbox', { name: 'value value', exact: true })
  await value.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('200')
  await expect(separator).toHaveAttribute('aria-valuenow', '200')
})

test('showcase: the Splitter min/max Value cells re-clamp the demo', async ({ page }) => {
  await page.goto('/components/splitter')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const separator = demo.getByRole('separator')
  await expect(separator).toBeVisible()
  await expect(separator).toHaveAttribute('aria-valuemin', '120')
  await expect(separator).toHaveAttribute('aria-valuemax', '320')

  await page.getByRole('textbox', { name: 'min value', exact: true }).fill('100')
  await expect(separator).toHaveAttribute('aria-valuemin', '100')

  await page.getByRole('textbox', { name: 'max value', exact: true }).fill('400')
  await expect(separator).toHaveAttribute('aria-valuemax', '400')
})

test('showcase: the Splitter className Value cell styles the separator', async ({ page }) => {
  await page.goto('/components/splitter')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const separator = demo.getByRole('separator')
  await expect(separator).toBeVisible()

  await page.getByRole('textbox', { name: 'className value', exact: true }).fill('handle-x')
  await expect(separator).toHaveClass(/handle-x/)
})
