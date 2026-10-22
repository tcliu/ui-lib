import { expect, test } from '@playwright/test'
import { replaceSnippet, showcaseDemo } from './helpers'

test('showcase: the Tooltip children cell edits text through a dialog with a reset eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/tooltip')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  // The required children carry a reset eye beside the edit icon.
  await expect(page.getByRole('button', { name: 'Unapply children' })).toBeVisible()

  // The dialog commits text applied at once.
  await page.getByRole('button', { name: 'Edit children' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit children' }) })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, 'Custom tip', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(demo.getByRole('button', { name: 'Custom tip' })).toBeVisible()

  // Unapplying resets to the default label; committing re-applies.
  await page.getByRole('button', { name: 'Unapply children' }).click()
  await expect(demo.getByRole('button', { name: 'Apply' })).toBeVisible()

  // Hovering the trigger reveals the tooltip with the same text. The tooltip
  // box portals to document.body, so anchor on the page.
  await demo.getByRole('button', { name: 'Apply' }).hover()
  await expect(page.getByRole('tooltip')).toHaveText('Apply')
})
