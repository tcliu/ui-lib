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

  // The dialog commits text and re-applies the eye, so the demo pins it.
  await page.getByRole('button', { name: 'Edit trailing' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit trailing' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '1–200 of 200', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)
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

// The active page cell is the jump field: it must be the same box as a page
// button holding the same text — square at one digit, wider only when its own
// label needs the room — with the accent color as the only styling difference.
test('showcase: pagination page cells are square and grow only for wider text', async ({ page }) => {
  await page.goto('/components/pagination')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const jump = demo.getByRole('textbox')
  const oneDigit = demo.getByRole('button', { name: '1', exact: true })
  const twoDigits = demo.getByRole('button', { name: '20', exact: true })

  const square = await jump.boundingBox()
  const oneBox = await oneDigit.boundingBox()
  expect(square).not.toBeNull()
  expect(square!.width).toBe(square!.height)
  expect(square!.width).toBeCloseTo(oneBox!.width, 0)

  // Same box metrics as a page button; only the accent (and the caret) differ.
  const metrics = await Promise.all(
    [jump, oneDigit].map(locator =>
      locator.evaluate(node => {
        const style = getComputedStyle(node)
        return [
          style.height,
          style.paddingLeft,
          style.paddingRight,
          style.borderRadius,
          style.borderWidth,
          style.fontSize,
          style.fontWeight,
        ].join('|')
      }),
    ),
  )
  expect(metrics[0]).toBe(metrics[1])

  // Typing a second digit widens the cell to a two-digit page button's box.
  const twoBox = await twoDigits.boundingBox()
  await jump.fill('12')
  await expect.poll(async () => (await jump.boundingBox())?.width ?? 0).toBeGreaterThan(square!.width)
  expect(Math.abs((await jump.boundingBox())!.width - twoBox!.width)).toBeLessThanOrEqual(1)
})

test('showcase: clicking the active page field puts the caret at the end', async ({ page }) => {
  await page.goto('/components/pagination')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  // Two digits, so the clicked position (the start) differs from the end.
  const currentPageCell = page.getByRole('textbox', { name: 'currentPage value', exact: true })
  await currentPageCell.click()
  await currentPageCell.fill('12')
  const jump = demo.getByRole('textbox')
  await expect(jump).toHaveValue('12')

  // Focus, then click inside the left padding: the browser would put the caret
  // at the start, the field moves it after the value.
  await jump.click()
  await jump.click({ position: { x: 3, y: 8 } })
  await expect
    .poll(() => jump.evaluate(element => (element as HTMLInputElement).selectionStart))
    .toBe(2)
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

// The compact variant replaces the numbered blocks with a previous/next pair
// around one "Page X of Y" summary and drops the page-size selector.
test('showcase: the Pagination variant Value cell switches to the compact summary', async ({ page }) => {
  await page.goto('/components/pagination')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('combobox', { name: 'variant value', exact: true }).click()
  await page.getByRole('option', { name: 'compact' }).click()

  await expect(demo).toContainText('Page 3 of 20')
  await expect(demo.getByRole('button', { name: '20', exact: true })).toHaveCount(0)
  await expect(demo.getByRole('combobox', { name: 'Page size' })).toHaveCount(0)

  // Back to the default numbered blocks restores the page buttons and selector.
  await page.getByRole('combobox', { name: 'variant value', exact: true }).click()
  await page.getByRole('option', { name: 'numbered' }).click()
  await expect(demo.getByRole('button', { name: '20', exact: true })).toBeVisible()
  await expect(demo.getByRole('combobox', { name: 'Page size' })).toBeVisible()
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
