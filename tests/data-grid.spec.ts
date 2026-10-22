import { expect, test } from '@playwright/test'
import { replaceSnippet, showcaseDemo } from './helpers'

// The DataGrid demo is the canonical spreadsheet control: a header row plus
// body cells, in-place editing with history, and keyboard navigation. These
// assertions pin those behaviors so the owned-node ref registry cannot regress
// focus or editing.
test('showcase: DataGrid renders its rows and tabs between cells', async ({ page }) => {
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const root = page.locator('[data-testid="data-grid"]')
  await expect(root).toBeVisible()

  // Header row (data-row="0") is a th row of 3; four body rows of 3 td cells.
  await expect(root.locator('textarea[data-row]')).toHaveCount(15)
  await expect(root.locator('th textarea')).toHaveCount(3)
  await expect(root.locator('td[role="gridcell"] textarea')).toHaveCount(12)
  await expect(root.locator('textarea[data-row="1"][data-col="0"]')).toHaveValue('Ada Lovelace')

  // Tab moves focus to the next cell, wrapping to the next row's first cell.
  await root.locator('textarea[data-row="1"][data-col="0"]').focus()
  await page.keyboard.press('Tab')
  await expect(root.locator('textarea[data-row="1"][data-col="1"]')).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(root.locator('textarea[data-row="2"][data-col="0"]')).toBeFocused()
})

test('showcase: DataGrid edits a cell and undoes the edit', async ({ page }) => {
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const root = page.locator('[data-testid="data-grid"]')
  const cell = root.locator('textarea[data-row="1"][data-col="0"]')

  await cell.click()
  await cell.fill('Ada L.')
  await expect(cell).toHaveValue('Ada L.')

  // The grid history shortcut is captured on the grid container.
  await page.keyboard.press('ControlOrMeta+z')
  await expect(cell).toHaveValue('Ada Lovelace')
})

test('showcase: DataGrid keeps grid focus when pasting into an appended row', async ({ page }) => {
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const root = page.locator('[data-testid="data-grid"]')
  // B4 is the last data row; copy it, then ArrowDown appends and focuses B5.
  await root.locator('textarea[data-row="4"][data-col="1"]').click()
  await page.keyboard.press('ControlOrMeta+c')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ControlOrMeta+v')
  await expect(root.locator('textarea[data-row="5"][data-col="1"]')).toHaveValue('Analyst')

  // Focus must stay on a grid cell (not fall to <body>), so arrow navigation
  // still reaches the grid's keydown handler after the paste.
  const pastedBox = root.locator('td[role="gridcell"]:has(textarea[data-row="5"][data-col="1"])')
  await expect(pastedBox).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(root.locator('td[role="gridcell"]:has(textarea[data-row="4"][data-col="1"])')).toBeFocused()

  // Undo reverts the paste and removes the appended row, keeping focus in-grid.
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ControlOrMeta+z')
  await expect(root.locator('textarea[data-row="5"]')).toHaveCount(0)
  await expect(root.locator('td[role="gridcell"]:has(textarea[data-row="4"][data-col="1"])')).toBeFocused()
})

test('showcase: DataGrid editable and showHeaders Value cells drive the grid', async ({ page }) => {
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const root = demo.locator('[data-testid="data-grid"]')

  // Pristine: editable, header row present.
  await expect(root.locator('td[role="gridcell"] textarea')).toHaveCount(12)
  await expect(root.locator('textarea').first()).toBeEditable()

  // The editable Value cell is a boolean toggle (default checked); clearing it
  // makes every cell read-only. Its input is clipped, so toggle from keyboard.
  const editableBox = page.getByRole('checkbox', { name: 'editable value' })
  await editableBox.focus()
  await page.keyboard.press('Space')
  await expect(root.locator('textarea').first()).not.toBeEditable()

  // A read-only grid refuses keyboard mutations: arrows move the box selection
  // but never append a row/column, and typing/Delete never edit or clear a cell.
  const ada = root.locator('textarea[data-row="1"][data-col="0"]')
  await ada.click()
  await page.keyboard.type('x')
  await page.keyboard.press('Backspace')
  await expect(ada).toHaveValue('Ada Lovelace')

  const lastBodyCell = root.locator('td[role="gridcell"] textarea[data-row="4"][data-col="0"]')
  await lastBodyCell.click()
  await page.keyboard.press('ArrowDown')
  await expect(root.locator('textarea[data-row="5"]')).toHaveCount(0)
  await expect(lastBodyCell).toHaveValue('Katherine Johnson')

  // Right-arrow on the last column must not append a column either.
  const lastColCell = root.locator('textarea[data-row="4"][data-col="2"]')
  await lastColCell.click()
  await page.keyboard.press('ArrowRight')
  await expect(root.locator('textarea[data-col="3"]')).toHaveCount(0)

  // Show headers off treats the first row as data (5 data rows, no th row).
  const headersBox = page.getByRole('checkbox', { name: 'showHeaders value' })
  await headersBox.focus()
  await page.keyboard.press('Space')
  await expect(root.locator('th textarea')).toHaveCount(0)
  await expect(root.locator('td[role="gridcell"] textarea')).toHaveCount(15)

  // Reset restores the component defaults.
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(root.locator('td[role="gridcell"] textarea')).toHaveCount(12)
})

test('showcase: DataGrid cuts a cell with ControlOrMeta+x and pastes it elsewhere', async ({ page }) => {
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const root = page.locator('[data-testid="data-grid"]')
  const source = root.locator('textarea[data-row="1"][data-col="0"]')
  await source.click()
  await page.keyboard.press('ControlOrMeta+x')
  await expect(source).toHaveValue('')

  // The cut value stays in the clipboard buffer: pasting elsewhere moves it.
  const target = root.locator('textarea[data-row="2"][data-col="0"]')
  await target.click()
  await page.keyboard.press('ControlOrMeta+v')
  await expect(target).toHaveValue('Ada Lovelace')
})

test('showcase: the DataGrid columnLabels Value cell relabels the header row', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const root = page.locator('[data-testid="data-grid"]')

  // Pristine: the label row falls back to column letters.
  await expect(root.getByText('A', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Edit columnLabels' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit column labels' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, 'nope', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid list applies on OK: the label row shows it while the header-row
  // cells keep their own values.
  await replaceSnippet(page, '["Alpha", "Beta", "Gamma"]', dialog)
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(root.getByText('Alpha', { exact: true })).toBeVisible()
  await expect(root.locator('textarea[data-row="0"][data-col="0"]')).toHaveValue('Name')
})

test('showcase: the DataGrid value Value cell edits grid data through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const root = page.locator('[data-testid="data-grid"]')
  await expect(root.locator('textarea[data-row="1"][data-col="0"]')).toHaveValue('Ada Lovelace')

  await page.getByRole('button', { name: 'Edit value' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit grid data' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, 'nope', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // Valid grid data applies on OK and renders in the grid.
  await replaceSnippet(page, '[["Name", "Role"], ["Ada", "Engineer"]]', dialog)
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(root.locator('textarea[data-row]')).toHaveCount(4)
  await expect(root.locator('textarea[data-row="1"][data-col="0"]')).toHaveValue('Ada')
})

test('showcase: DataGrid lets Tab leave the grid at its boundary cells', async ({ page }) => {
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const root = page.locator('[data-testid="data-grid"]')
  const activeTagInGrid = () =>
    page.evaluate(() => {
      const el = document.activeElement
      if (!el || el.closest('[data-testid="data-grid"]') === null) return 'outside'
      return el.tagName
    })

  // Forward Tab from the last body cell exits the grid instead of trapping
  // focus on the edge cell. Focus the editor directly: a click would land on
  // the cell box, whose key handler ignores Tab.
  await root.locator('textarea[data-row="4"][data-col="2"]').focus()
  await page.keyboard.press('Tab')
  await expect(await activeTagInGrid()).toBe('outside')

  // Shift+Tab from the first header cell steps back into the toolbar above the
  // cells (still in-grid UI, but tabbable, so focus can keep moving).
  await root.locator('textarea[data-row="0"][data-col="0"]').focus()
  await page.keyboard.press('Shift+Tab')
  await expect(await activeTagInGrid()).toBe('BUTTON')
})

test('showcase: the DataGrid value eye applies and unapplies the data', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  const root = page.locator('[data-testid="data-grid"]')

  // Commit custom grid data through the dialog.
  await page.getByRole('button', { name: 'Edit value' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit grid data' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '[["Name", "Role"], ["Ada", "Engineer"]]', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(root.locator('textarea[data-row="1"][data-col="0"]')).toHaveValue('Ada')

  // Unapplying drops the data (the grid renders empty); re-applying restores it.
  await page.getByRole('button', { name: 'Unapply value' }).click()
  await expect(root.locator('textarea[data-row]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Apply value' }).click()
  await expect(root.locator('textarea[data-row="1"][data-col="0"]')).toHaveValue('Ada')
})
