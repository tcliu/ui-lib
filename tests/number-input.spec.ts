import { expect, test } from '@playwright/test'
import { editorContains, showCodeToggle, showcaseDemo } from './helpers'

// The Steppers preset overrides only `showControls` and `hideOutline`: the
// field keeps its box and metrics but loses the stepper overlay and the
// outline, so the page needs no className workaround.
test('showcase: the NumberInput steppers preset hides the steppers and outline', async ({ page }) => {
  await page.goto('/components/number-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const input = demo.getByRole('textbox')
  await expect(demo.getByRole('button', { name: 'Increment', exact: true })).toHaveCount(1)
  await expect(input).toHaveCSS('border-top-width', '1px')

  await page.getByRole('combobox', { name: 'Steppers', exact: true }).click()
  await page.getByRole('option', { name: 'Hide steppers', exact: true }).click()

  await expect(demo.getByRole('button', { name: 'Increment', exact: true })).toHaveCount(0)
  await expect(input).toHaveCSS('border-top-width', '0px')
  // The box stays: the field keeps the bordered chrome's padding and metrics.
  const padding = await input.evaluate(element => getComputedStyle(element).paddingLeft)
  expect(padding).not.toBe('0px')

  // Show-code carries the two prop overrides and no className.
  await showCodeToggle(page).click()
  expect(await editorContains(page, 'showControls={false}')).toBe(true)
  expect(await editorContains(page, 'hideOutline')).toBe(true)
  expect(await editorContains(page, 'className')).toBe(false)
})
