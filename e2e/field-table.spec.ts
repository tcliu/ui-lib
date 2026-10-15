import { expect, test } from '@playwright/test'
import { editorContains, replaceSnippet } from './helpers'

test('showcase: FieldTable demo edits sample values through built-in editors', async ({ page }) => {
  await page.goto('/components/field-table')
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()

  // Each editor kind renders in the demo's Value column.
  await expect(demo.getByRole('textbox', { name: 'name value' })).toBeVisible()
  await expect(demo.getByRole('combobox', { name: 'role value' })).toBeVisible()
  await expect(demo.getByRole('checkbox', { name: 'active value' })).toBeVisible()

  // Typing in the sample text editor updates the row.
  await demo.getByRole('textbox', { name: 'name value' }).fill('Ada')
  await expect(demo.getByRole('textbox', { name: 'name value' })).toHaveValue('Ada')
})

test('showcase: the FieldTable headers cell edits JSON through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/field-table')
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  const firstHeader = demo.getByRole('columnheader').first()
  await expect(firstHeader).toHaveText('Prop')

  // The `headers` prop is a plain object, so it edits through a JSON dialog
  // in the props table's Value column.
  await page.getByRole('button', { name: 'Edit headers' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit headers' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid object applies on OK and the demo follows it.
  await replaceSnippet(
    page,
    dialog,
    JSON.stringify(
      { prop: 'Field', type: 'Kind', default: 'Fallback', value: 'Entry', note: 'Remarks' },
      null,
      2,
    ),
  )
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(firstHeader).toHaveText('Field')

  await page.locator('main header').getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(firstHeader).toHaveText('Prop')
})

test('showcase: FieldTable dialog rows open and commit through the built-in editor', async ({ page }) => {
  await page.goto('/components/field-table')
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()

  await demo.getByRole('button', { name: 'Edit notes' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('showcase: the FieldTable headers eye omits and the notes eye resets', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/field-table')
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  const firstHeader = demo.getByRole('columnheader').first()

  // Commit custom headers through the dialog.
  await page.getByRole('button', { name: 'Edit headers' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit headers' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(
    page,
    dialog,
    JSON.stringify(
      { prop: 'Field', type: 'Kind', default: 'Fallback', value: 'Entry', note: 'Remarks' },
      null,
      2,
    ),
  )
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(firstHeader).toHaveText('Field')

  // Unapplying omits the object; the columns keep their default labels.
  await page.getByRole('button', { name: 'Unapply headers' }).click()
  await expect(firstHeader).toHaveText('Prop')

  // The notes eye resets the sample text instead of omitting: commit a note,
  // then unapply the eye and reopen the dialog. A reset reverts the seed to the
  // row default, while an omit-style eye would preserve the committed text.
  await page.getByRole('button', { name: 'Edit notes' }).click()
  const notesDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Edit notes' }) })
  await expect(notesDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, notesDialog, 'Note-123')
  await notesDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(notesDialog).toHaveCount(0)

  await page.getByRole('button', { name: 'Unapply notes' }).click()
  await page.getByRole('button', { name: 'Edit notes' }).click()
  const resetDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Edit notes' }) })
  await expect(resetDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  expect(await editorContains(page, resetDialog, 'Note-123')).toBe(false)
  await resetDialog.getByRole('button', { name: 'Close', exact: true }).click()

  // Re-applying the eye re-applies the required row with its reset default; it
  // does not resurrect the committed text.
  await page.getByRole('button', { name: 'Apply notes' }).click()
  await expect(page.getByRole('button', { name: 'Unapply notes' })).toBeVisible()
  await page.getByRole('button', { name: 'Edit notes' }).click()
  const reappliedDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Edit notes' }) })
  await expect(reappliedDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  expect(await editorContains(page, reappliedDialog, 'Note-123')).toBe(false)
  await reappliedDialog.getByRole('button', { name: 'Close', exact: true }).click()
})
