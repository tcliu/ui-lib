import { expect, test } from '@playwright/test'
import { replaceSnippet, showcaseDemo } from './helpers'

test('showcase: the Copyable containerClass Value cell applies to the demo wrapper', async ({ page }) => {
  await page.goto('/components/copyable')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('Copy me')

  await page.getByRole('textbox', { name: 'containerClass value', exact: true }).fill('demo-marker')
  await expect(demo.locator('.demo-marker')).toHaveCount(1)

  await page.getByRole('textbox', { name: 'containerClass value', exact: true }).fill('')
  await expect(demo.locator('.demo-marker')).toHaveCount(0)
})

test('showcase: the Copyable children cell edits text through a dialog applied by the eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/copyable')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('Copy me')

  // Committing applies the eye, so the demo renders the children instead of
  // the text.
  await page.getByRole('button', { name: 'Edit children' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit children' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, 'Custom content', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(demo).toContainText('Custom content')
  await expect(demo).not.toContainText('Copy me')

  // Unapplying restores the text rendering.
  await page.getByRole('button', { name: 'Unapply children' }).click()
  await expect(demo).not.toContainText('Custom content')
  await expect(demo).toContainText('Copy me')

  // Re-applying renders the children again.
  await page.getByRole('button', { name: 'Apply children' }).click()
  await expect(demo).toContainText('Custom content')
})
