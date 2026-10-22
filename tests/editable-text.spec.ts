import { expect, test } from '@playwright/test'
import { showcaseDemo } from './helpers'

test('showcase: the EditableText maxWidth Value cell caps the editing input width', async ({ page }) => {
  await page.goto('/components/editable-text')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('Untitled project')

  // The NumberInput is controlled and prefilled, so select-all + type
  // instead of fill (fill races its re-render and appends). The cap binds
  // exactly while it stays above the input's own padding floor (a smaller
  // cap still applies, but the browser floors the width at the padding
  // instead of the capped value).
  const maxWidth = page.getByRole('textbox', { name: 'maxWidth value', exact: true })
  await maxWidth.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('60')
  await demo.getByRole('button', { name: 'Edit', exact: true }).click()
  const input = demo.getByRole('textbox', { name: 'Edit text' })
  await expect(input).toBeVisible()
  await expect(input).toHaveCSS('width', '60px')
})
