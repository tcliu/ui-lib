import { expect, test } from '@playwright/test'
import { replaceSnippet } from './helpers'

// TagInput follows the converted showcase layout: the code toggle sits beside
// the component title, the demo sits in a borderless width-only resizable
// frame, and the props table appends an editable Value column.
test('showcase: TagInput hosts its code toggle in the title row beside a resizable demo', async ({ page }) => {
  await page.goto('/components/tag-input')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const toggle = page.locator('main header').getByRole('button')

  await expect(page.getByRole('heading', { level: 1, name: 'TagInput' })).toBeVisible()
  await expect(toggle).toHaveCount(1)

  // The demo sits in a width-only resizable frame (one right-edge handle), with
  // no pane padding so its left edge lines up with the config panel below.
  await expect(demo.locator('[role="separator"]')).toHaveCount(1)

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the stage snippet, which reproduces the demo.
  const before = (await demo.innerText()).replace(/\s+/g, ' ').trim()
  await toggle.click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  await expect.poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 }).toBe(before)
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})

test('showcase: the TagInput value cell edits JSON through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/tag-input')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await expect(demo).toContainText('tags: svelte, kit')

  await page.getByRole('button', { name: 'Edit value' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit value' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await expect(dialog.getByRole('button', { name: 'Reset', exact: true })).toBeVisible()

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid list applies on OK and the demo follows it.
  await replaceSnippet(page, dialog, '["svelte", "forms"]')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(demo).toContainText('tags: svelte, forms')
})
