import { expect, test } from '@playwright/test'
import { replaceSnippet, showcaseDemo, snippetEditor } from './helpers'

// The `ratios` prop is a dialog-backed JSON row shared by every sized input
// page: committing an override must reach the live demo, the Show-code line,
// and the eye must drop both again. A composite must also forward the field
// subset it advertises to its inner field.
test('showcase: the TextInput ratios row drives the demo and Show code', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/text-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const field = demo.getByRole('textbox', { name: 'Apply' })
  // md = 16px dimension → the shared padX ratio (0.5625) is 9px.
  await expect(field).toHaveCSS('padding-left', '9px')

  await page.getByRole('button', { name: 'Edit ratios' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit ratios' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{"padX":0.75}', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()

  // Committing applies the eye, and the demo rides the overridden padding.
  await expect(field).toHaveCSS('padding-left', '12px')
  await page.getByRole('button', { name: 'Show code' }).click()
  const editor = snippetEditor(page)
  await expect(editor).toBeVisible({ timeout: 15000 })
  await expect(editor).toContainText('ratios={{"padX":0.75}}')

  // Unapplying returns the field to the shared default and drops the line.
  await page.getByRole('button', { name: 'Unapply ratios' }).click()
  await expect(field).toHaveCSS('padding-left', '9px')
  await expect(editor).not.toContainText('ratios=')
})

test('showcase: a composite forwards an overridden field ratio to its inner field', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/search-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const field = demo.getByRole('searchbox', { name: 'Apply' })
  // The search icon owns the left gutter, so the field's `padX` shows on the
  // right edge only.
  await expect(field).toHaveCSS('padding-right', '9px')

  await page.getByRole('button', { name: 'Edit ratios' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit ratios' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{"padX":0.75}', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()

  // `padX` is part of the composite's set, so it must reach the inner TextInput
  // instead of falling back to the shared default.
  await expect(field).toHaveCSS('padding-right', '12px')
})
