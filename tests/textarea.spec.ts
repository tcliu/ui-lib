import { expect, test } from '@playwright/test'
import { snippetEditor } from './helpers'

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
