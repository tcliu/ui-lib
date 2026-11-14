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
