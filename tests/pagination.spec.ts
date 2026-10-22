import { expect, test } from '@playwright/test'
import { editorContains, replaceSnippet, showCodeToggle, showcaseDemo, snippetEditor } from './helpers'

test('showcase: the Pagination trailing cell edits text through a dialog applied by the eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/pagination')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  // The dialog commits text but the eye stays off, so the demo is unchanged.
  await page.getByRole('button', { name: 'Edit trailing' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit trailing' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '1–200 of 200', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(demo).not.toContainText('1–200 of 200')

  // Applying the eye pins the content to the row's right edge.
  await page.getByRole('button', { name: 'Apply trailing' }).click()
  await expect(demo).toContainText('1–200 of 200')

  // Unapplying removes it again.
  await page.getByRole('button', { name: 'Unapply trailing' }).click()
  await expect(demo).not.toContainText('1–200 of 200')
})

test('showcase: the Pagination total Value cell edits the page count', async ({ page }) => {
  await page.goto('/components/pagination')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  await expect(demo.getByRole('button', { name: '20', exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'total value', exact: true }).fill('35')
  await expect(demo.getByRole('button', { name: '20', exact: true })).toHaveCount(0)
  await expect(demo.getByRole('button', { name: '4', exact: true })).toBeVisible()
})

test('showcase: the Pagination currentPage Value cell jumps the demo', async ({ page }) => {
  await page.goto('/components/pagination')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const jump = demo.getByRole('textbox')

  await expect(jump).toHaveValue('3')
  const currentPageCell = page.getByRole('textbox', { name: 'currentPage value', exact: true })
  await currentPageCell.click()
  await currentPageCell.fill('7')
  await expect(jump).toHaveValue('7')
})

test('showcase: the Pagination pageSize Value cell resizes the demo pages', async ({ page }) => {
  await page.goto('/components/pagination')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  await expect(demo.getByRole('button', { name: '20', exact: true })).toBeVisible()
  const pageSizeCell = page.getByRole('textbox', { name: 'pageSize value', exact: true })
  await pageSizeCell.click()
  await pageSizeCell.fill('25')
  await expect(demo.getByRole('button', { name: '20', exact: true })).toHaveCount(0)
  await expect(demo.getByRole('button', { name: '8', exact: true })).toBeVisible()
})

// The labels JSON dialog round-trips every facet it presents: committing an
// override shows it in the demo and the snippet, and malformed JSON rejects
// the commit instead of applying it.
test('showcase: the Pagination labels editor updates the demo and snippet', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/pagination')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const editLabels = page.getByRole('button', { name: 'Edit labels' })

  // Dialog -> demo + snippet: a previous-label override renames the button
  // and lands verbatim in the editor.
  await editLabels.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(page, '{\n  "previous": "Back-123"\n}', dialog)
  await expect(dialog.locator('.cm-content')).toContainText('Back-123')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByRole('button', { name: 'Back-123' })).toBeVisible()
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, 'previous: "Back-123"')).toBe(true)

  // Malformed JSON rejects the commit: OK disables with guidance, and Reset
  // restores the committable draft.
  await editLabels.click()
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(page, 'not json', dialog)
  await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeDisabled()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await dialog.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('showcase: the Pagination labels eye applies and unapplies the map', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/pagination')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  // Commit a previous-label override through the dialog.
  await page.getByRole('button', { name: 'Edit labels' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(page, '{\n  "previous": "Back-123"\n}', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByRole('button', { name: 'Back-123' })).toBeVisible()

  // Unapplying drops the map (the i18n label renders); re-applying restores it.
  await page.getByRole('button', { name: 'Unapply labels' }).click()
  await expect(demo.getByRole('button', { name: 'Back-123' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Apply labels' }).click()
  await expect(demo.getByRole('button', { name: 'Back-123' })).toBeVisible()
})
