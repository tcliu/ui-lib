import { expect, test } from '@playwright/test'
import { showcaseDemo, snippetEditor } from './helpers'

test('showcase: the Textarea rows eye stages the number in Show-code', async ({ page }) => {
  await page.goto('/components/textarea')
  await page.waitForLoadState('networkidle')

  // Editing the Value applies the eye; the seed carries the rows line. The
  // NumberInput is controlled, so select-all + type instead of fill (fill
  // races its re-render and appends).
  const rows = page.getByRole('textbox', { name: 'rows value', exact: true })
  await rows.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('5')
  await page.getByRole('button', { name: 'Show code' }).click()
  const editor = snippetEditor(page)
  await expect(editor).toBeVisible({ timeout: 15000 })
  await expect(editor).toContainText('rows={5}')

  // Unapplying drops the line.
  await page.getByRole('button', { name: 'Unapply rows' }).click()
  await expect(editor).not.toContainText('rows=')

  // Re-applying restores it.
  await page.getByRole('button', { name: 'Apply rows' }).click()
  await expect(editor).toContainText('rows={5}')
  await page.getByRole('button', { name: 'Hide code' }).click()
})

test('showcase: the Textarea variant cell switches to the embedded chrome', async ({ page }) => {
  await page.goto('/components/textarea')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const field = demo.locator('textarea')
  await expect(field).toHaveCSS('border-top-width', '1px')

  // `embedded` hands the box to the caller: no border and no surface.
  await page.getByRole('combobox', { name: 'variant value', exact: true }).click()
  await page.getByRole('option', { name: 'embedded' }).click()
  await expect(field).toHaveCSS('border-top-width', '0px')
  await expect(field).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')

  // `className` appends after the base chrome, so the embedded field takes the
  // caller's own text rules.
  await page.getByRole('textbox', { name: 'className value', exact: true }).fill('italic')
  await expect(field).toHaveCSS('font-style', 'italic')
})

test('showcase: the Textarea clear cross clears the value from the first line', async ({ page }) => {
  await page.goto('/components/textarea')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const field = demo.locator('textarea')
  await field.fill('note')

  // Enabling clearable shows the cross while the value is set.
  const clearableBox = page.getByRole('checkbox', { name: 'clearable value' })
  await clearableBox.focus()
  await page.keyboard.press('Space')
  const clear = demo.getByRole('button', { name: 'Clear' })
  await expect(clear).toBeVisible()

  const fieldRect = (await field.boundingBox())!
  const clearRect = (await clear.boundingBox())!
  // The cross rides the shared text-field clear slot (16px at md).
  expect(clearRect.width).toBeCloseTo(16, 0)
  expect(clearRect.height).toBeCloseTo(16, 0)
  // It stays on the first line instead of the middle of the three-row editor.
  expect(clearRect.y + clearRect.height / 2).toBeLessThan(fieldRect.y + fieldRect.height / 2 - 10)

  // Clearing empties the bound value, returns focus, and hides the cross.
  await clear.click()
  await expect(field).toHaveValue('')
  await expect(field).toBeFocused()
  await expect(clear).toHaveCount(0)

  // The page's Show-code carries the staged clearable prop.
  await page.getByRole('button', { name: 'Show code' }).click()
  const editor = snippetEditor(page)
  await expect(editor).toBeVisible({ timeout: 15000 })
  await expect(editor).toContainText('clearable')
})
