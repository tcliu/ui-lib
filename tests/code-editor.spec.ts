import { expect, test } from '@playwright/test'
import { replaceSnippet } from './helpers'

test('showcase: the CodeEditor containerClass Value cell styles the demo wrapper', async ({ page }) => {
  await page.goto('/components/code-editor')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const marker = demo.locator('.demo-class-marker')
  await expect(marker).toHaveCount(0)

  await page.getByRole('textbox', { name: 'containerClass value', exact: true }).fill('demo-class-marker')
  await expect(marker).toHaveCount(1)

  await page.getByRole('textbox', { name: 'containerClass value', exact: true }).fill('')
  await expect(marker).toHaveCount(0)
})

test('showcase: the LazyCodeEditor containerClass Value cell styles the demo wrapper', async ({ page }) => {
  await page.goto('/components/lazy-code-editor')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const marker = demo.locator('.demo-class-marker')
  await expect(marker).toHaveCount(0)

  await page.getByRole('textbox', { name: 'containerClass value', exact: true }).fill('demo-class-marker')
  await expect(marker).toHaveCount(1)

  await page.getByRole('textbox', { name: 'containerClass value', exact: true }).fill('')
  await expect(marker).toHaveCount(0)
})

test('showcase: the CodeEditor content cell edits the document through an HTML dialog', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/code-editor')
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()

  await page.getByRole('button', { name: 'Edit content' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit content' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })

  // Free-form text commits as-is (no JSON-validity gate): the demo editor
  // below shows the committed document.
  await replaceSnippet(page, dialog, '{\n  "hello": "world-123"\n}')
  await expect(dialog.locator('.cm-content')).toContainText('world-123')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(demo.locator('.cm-content')).toContainText('world-123')
})

test('showcase: the CodeEditor content eye resets to the default document', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/code-editor')
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()

  // Commit a custom document through the dialog.
  await page.getByRole('button', { name: 'Edit content' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit content' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, dialog, '{\n  "hello": "world-123"\n}')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.locator('.cm-content')).toContainText('world-123')

  // Unapplying resets to the default document.
  await page.getByRole('button', { name: 'Unapply content' }).click()
  await expect(demo.locator('.cm-content')).toContainText('"name": "ui-lib"')
  await expect(demo.locator('.cm-content')).not.toContainText('world-123')
})

test('showcase: the LazyCodeEditor content eye resets to the default document', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/lazy-code-editor')
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()

  // Commit a custom document through the dialog.
  await page.getByRole('button', { name: 'Edit content' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit content' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, dialog, '# custom-123')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.locator('.cm-content')).toContainText('custom-123')

  // Unapplying resets to the default document.
  await page.getByRole('button', { name: 'Unapply content' }).click()
  await expect(demo.locator('.cm-content')).toContainText('Lazy editor')
  await expect(demo.locator('.cm-content')).not.toContainText('custom-123')
})
