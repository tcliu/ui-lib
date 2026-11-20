import { expect, test } from '@playwright/test'
import { showcaseDemo } from './helpers'

test('showcase: ClearButton defaults to the shared Clear label and fires its handler', async ({ page }) => {
  await page.goto('/components/clear-button')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const button = demo.getByRole('button', { name: 'Clear', exact: true })
  await expect(button).toBeVisible()
  await expect(demo).toContainText('0')

  await button.click()
  await expect(demo).toContainText('1')
})

test('showcase: the ariaLabel and disabled rows drive the demo', async ({ page }) => {
  await page.goto('/components/clear-button')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('textbox', { name: 'ariaLabel value', exact: true }).fill('Clear tag filters')
  const button = demo.getByRole('button', { name: 'Clear tag filters', exact: true })
  await expect(button).toBeVisible()

  await page.getByRole('checkbox', { name: 'disabled value', exact: true }).check({ force: true })
  await expect(button).toBeDisabled()
})
