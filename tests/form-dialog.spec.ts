import { expect, test } from '@playwright/test'
import { replaceSnippet } from './helpers'

test('showcase: the FormDialog children cell edits the body input through a dialog applied by the eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/form-dialog')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Edit children' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit children' }) })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Anything but TextInput lines and well-formed HTML blocks OK behind an error.
  await replaceSnippet(page, dialog, 'nope < {oops}')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid edit applies on OK; the opened dialog shows the new control plus
  // the verbatim note.
  await replaceSnippet(
    page,
    dialog,
    ['<TextInput bind:value={draft} type="number" ariaLabel="Count" />', '<span>note-123</span>'].join('\n'),
  )
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const demo = page.getByRole('dialog').filter({ has: page.getByLabel('Count') })
  await expect(demo.getByLabel('Count')).toHaveAttribute('type', 'number')
  await expect(demo).toContainText('note-123')
  await page.keyboard.press('Escape')

  // Unapplying drops the body from the dialog.
  await page.getByRole('button', { name: 'Unapply children' }).click()
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog').getByLabel('Count')).toHaveCount(0)
  await page.keyboard.press('Escape')
})

test('showcase: the FormDialog title Value cell edits the dialog heading', async ({ page }) => {
  await page.goto('/components/form-dialog')
  await page.waitForLoadState('networkidle')

  await page.getByRole('textbox', { name: 'title value', exact: true }).fill('Custom heading')
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Custom heading' })).toBeVisible()
  await page.keyboard.press('Escape')
})

test('showcase: the FormDialog actions cell edits footer buttons through a dialog applied by the eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/form-dialog')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Edit actions' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit actions' }) })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Anything but the single outline Button line blocks OK behind an error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid edit applies on OK; the opened dialog shows the custom button.
  await replaceSnippet(page, dialog, '<Button variant="outline" type="button">Tidy</Button>')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const demo = page.getByRole('dialog')
  await expect(demo.getByRole('button', { name: 'Tidy' })).toBeVisible()
  await page.keyboard.press('Escape')

  // Unapplying drops the actions from the dialog.
  await page.getByRole('button', { name: 'Unapply actions' }).click()
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Tidy' })).toHaveCount(0)
  await page.keyboard.press('Escape')
})

test('showcase: the FormDialog header cell edits the Copyable title through a dialog applied by the eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/form-dialog')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Edit header' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit header' }) })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Anything but the single Copyable line blocks OK behind an error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid edit applies on OK; the opened dialog shows the Copyable title.
  await replaceSnippet(page, dialog, '<Copyable text="$.user"><span>$.user</span></Copyable>')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const demo = page.getByRole('dialog')
  await expect(demo.getByText('$.user', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  // Unapplying restores the plain title heading.
  await page.getByRole('button', { name: 'Unapply header' }).click()
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Dialog title' })).toBeVisible()
  await page.keyboard.press('Escape')
})
