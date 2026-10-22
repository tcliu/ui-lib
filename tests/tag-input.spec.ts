import { expect, test } from '@playwright/test'
import { replaceSnippet, showCodeToggle, showcaseDemo, snippetEditor, snippetError } from './helpers'

// TagInput follows the converted showcase layout: the code toggle sits beside
// the component title, the demo sits in a borderless resizable frame, and the
// props table appends an editable Value column.
test('showcase: TagInput hosts its code toggle in the title row beside a resizable demo', async ({ page }) => {
  await page.goto('/components/tag-input')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const toggle = showCodeToggle(page)

  await expect(page.getByRole('heading', { level: 1, name: 'TagInput' })).toBeVisible()
  await expect(toggle).toHaveCount(1)

  // The demo sits in a resizable frame. Resizable renders its width, height,
  // and corner handles unconditionally.
  await expect(demo.locator('[role="separator"]')).toHaveCount(3)

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the stage snippet, which reproduces the demo.
  const before = (await demo.innerText()).replace(/\s+/g, ' ').trim()
  await toggle.click()
  await expect(snippetEditor(page)).toBeVisible()
  await expect.poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 }).toBe(before)
  await expect(snippetError(page)).toHaveCount(0)
})

test('showcase: the TagInput chip and option cells edit prefix text applied by the eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/tag-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('tags: svelte, kit')

  // The chip dialog commits prefix text but the eye stays off.
  await page.getByRole('button', { name: 'Edit chip', exact: true }).click()
  const chipDialog = page.getByRole('dialog', { name: 'Edit chip', exact: true })
  await expect(chipDialog).toBeVisible()
  await expect(chipDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '#', chipDialog)
  await chipDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(chipDialog).toHaveCount(0)
  await expect(demo).not.toContainText('#svelte')

  // Applying the eye renders the custom chips with the prefix.
  await page.getByRole('button', { name: 'Apply chip', exact: true }).click()
  await expect(demo).toContainText('#svelte')

  // The option dialog works the same way for suggestions. (Scoped by its
  // heading: reopening a dialog keeps the previous titleId-labelled name on
  // the portaled node, a BaseDialog quirk noted as follow-up.)
  await page.getByRole('button', { name: 'Edit option', exact: true }).click()
  const optionDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit option', exact: true }) })
  await expect(optionDialog).toBeVisible()
  await expect(optionDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '»', optionDialog)
  await optionDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(optionDialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Apply option', exact: true }).click()
  const input = demo.getByRole('combobox')
  await input.click()
  await input.pressSequentially('for')
  // The suggestion panel portals to document.body, so anchor on the page.
  await expect(page.getByRole('option', { name: '»forms' })).toBeVisible()

  // Unapplying restores the built-in renderers.
  await page.getByRole('button', { name: 'Unapply chip', exact: true }).click()
  await expect(demo).not.toContainText('#svelte')
})

test('showcase: the TagInput value cell edits JSON through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/tag-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('tags: svelte, kit')

  await page.getByRole('button', { name: 'Edit value' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit value' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await expect(dialog.getByRole('button', { name: 'Reset', exact: true })).toBeVisible()

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, 'nope', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid list applies on OK and the demo follows it.
  await replaceSnippet(page, '["svelte", "forms"]', dialog)
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(demo).toContainText('tags: svelte, forms')
})

test('showcase: the TagInput options and value eyes apply and unapply the lists', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/tag-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  // Commit a custom value list through the dialog.
  await page.getByRole('button', { name: 'Edit value' }).click()
  const valueDialog = page.getByRole('dialog', { name: 'Edit value' })
  await expect(valueDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '["solo"]', valueDialog)
  await valueDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo).toContainText('tags: solo')

  // Unapplying drops the list (and its readout); re-applying restores both.
  await page.getByRole('button', { name: 'Unapply value' }).click()
  await expect(demo).not.toContainText('tags:')
  await page.getByRole('button', { name: 'Apply value' }).click()
  await expect(demo).toContainText('tags: solo')

  // The options eye behaves the same way.
  await page.getByRole('button', { name: 'Unapply options' }).click()
  await expect(page.getByRole('button', { name: 'Apply options' })).toBeVisible()
  await page.getByRole('button', { name: 'Apply options' }).click()
  await expect(page.getByRole('button', { name: 'Unapply options' })).toBeVisible()
})

test('showcase: the TagInput defaultValue cell stages a clear baseline through a dialog', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/tag-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('tags: svelte, kit')

  // Enabling clearable shows the cross: the value differs from the component
  // default (empty).
  const clearableBox = page.getByRole('checkbox', { name: 'clearable value' })
  await clearableBox.focus()
  await page.keyboard.press('Space')
  const clearButton = demo.getByRole('button', { name: 'Clear' })
  await expect(clearButton).toBeVisible()

  // The defaultValue dialog commits a list but the eye stays off, so the demo
  // keeps the component default and the cross stays.
  await page.getByRole('button', { name: 'Edit defaultValue' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit default value' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, 'nope', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid list applies on OK, staging the baseline: the lists match, so
  // the cross hides and the eye offers unapply.
  await replaceSnippet(page, '["svelte", "kit"]', dialog)
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(clearButton).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Unapply defaultValue', exact: true })).toBeVisible()

  // Diverge the value and the cross returns; clicking it resets to the
  // staged baseline and the cross hides again. (Scoped by heading: reopening
  // a dialog keeps the previous titleId-labelled name on the portaled node.)
  await page.getByRole('button', { name: 'Edit value' }).click()
  const valueDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit value', exact: true }) })
  await expect(valueDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '["solo"]', valueDialog)
  await valueDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo).toContainText('tags: solo')
  await expect(clearButton).toBeVisible()
  await clearButton.click()
  await expect(demo).toContainText('tags: svelte, kit')
  await expect(clearButton).toHaveCount(0)

  // Unapplying the eye drops the baseline: the cross returns against the
  // component default.
  await page.getByRole('button', { name: 'Unapply defaultValue', exact: true }).click()
  await expect(clearButton).toBeVisible()
})
