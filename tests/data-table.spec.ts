import { expect, test } from '@playwright/test'
import { editorContains, hideCodeToggle, replaceSnippet, showCodeToggle, showcaseDemo, snippetEditor } from './helpers'

test('showcase: DataTable toolbar hosts search plus column selector and reset', async ({ page }) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const section = showcaseDemo(page)

  // The search box precedes the column selector and reset icons in DOM order.
  const search = section.getByRole('searchbox', { name: 'Search' })
  await expect(search).toBeVisible()
  const order = await section.evaluate(sectionEl => {
    const pos = (name: string) =>
      [...sectionEl.querySelectorAll('*')].findIndex(el => el.getAttribute('aria-label') === name)
    return [pos('Search'), pos('Choose columns'), pos('Reset columns')]
  })
  expect(order[0]).toBeGreaterThanOrEqual(0)
  expect(order[0]).toBeLessThan(order[1])
  expect(order[1]).toBeLessThan(order[2])

  // Searching narrows the rows; the selector hides a column; reset restores it.
  const statusCell = section.locator('tbody td', { hasText: 'Active' }).first()
  await search.fill('Viewer')
  await expect(section.locator('tbody tr')).toHaveCount(1)
  await search.fill('')
  await expect(section.locator('tbody tr')).toHaveCount(20)
  await section.getByRole('button', { name: 'Choose columns' }).click()
  // The panel is portaled to the body by positionPanel, so it is no longer a
  // descendant of the section; select it by role instead.
  const panel = page.locator('.panel[role="group"]')
  await expect(panel).toBeVisible()
  // The panel drops below the trigger, fully inside the viewport.
  const inViewport = await panel.evaluate(el => {
    const r = el.getBoundingClientRect()
    return r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth
  })
  expect(inViewport).toBe(true)
  await panel.locator('label', { hasText: 'Status' }).click()
  await expect(statusCell).toHaveCount(0)
  await section.getByRole('button', { name: 'Reset columns' }).click()
  await expect(section.locator('tbody td', { hasText: 'Active' }).first()).toBeVisible()

  // Resizable columns are off by default; the settings panel enables them.
  await expect(section.getByRole('button', { name: /^Resize / })).toHaveCount(0)

  // The row total rides at the pagination row's right edge.
  await expect(section.getByRole('navigation').getByText('75 rows')).toBeVisible()
})

test('showcase: DataTable Value cells drive the demo table', async ({ page }) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  // The converted page drives every override through the props table's Value
  // cells; the demo lives in the `[data-showcase-demo]` hook.
  const demo = showcaseDemo(page)

  // Pristine: search visible, no selection column.
  await expect(demo.getByRole('searchbox', { name: 'Search' })).toBeVisible()
  await expect(demo.locator('tbody input[type="checkbox"]')).toHaveCount(0)

  // The selectable Value cell (default off) adds the row checkboxes. Its input
  // is clipped, so toggle from the keyboard like a keyboard user would.
  const selectableBox = page.getByRole('checkbox', { name: 'selectable value' })
  await selectableBox.focus()
  await page.keyboard.press('Space')
  await expect(demo.locator('tbody input[type="checkbox"]')).toHaveCount(20)

  // Clearing it back restores the pristine table.
  await selectableBox.focus()
  await page.keyboard.press('Space')
  await expect(demo.locator('tbody input[type="checkbox"]')).toHaveCount(0)

  // Placeholder text flows into the demo and the regenerated snippet source.
  await page.getByRole('textbox', { name: 'searchPlaceholder value', exact: true }).fill('Find rows')
  await expect(demo.getByRole('searchbox', { name: 'Search' })).toHaveAttribute(
    'placeholder',
    'Find rows',
  )
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, 'searchPlaceholder="Find rows"')).toBe(true)
  await hideCodeToggle(page).click()

  // Reset returns every field to unset (the localized search placeholder).
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(demo.getByRole('searchbox', { name: 'Search' })).toHaveAttribute(
    'placeholder',
    'Search...',
  )
})

test('showcase: the data-table demo stage has no resize handle', async ({ page }) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  await expect(demo).toBeVisible()
  await expect(demo.locator('[role="separator"]')).toHaveCount(0)
})

test('showcase: the DataTable searchAriaLabel Value cell renames the search field', async ({ page }) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  // Unset renders the component default label.
  await expect(demo.getByRole('searchbox', { name: 'Search' })).toBeVisible()
  await page.getByRole('textbox', { name: 'searchAriaLabel value', exact: true }).fill('Find rows')
  await expect(demo.getByRole('searchbox', { name: 'Find rows' })).toBeVisible()

  // The regenerated snippet carries the literal.
  await page.getByRole('button', { name: 'Show code', exact: true }).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, 'searchAriaLabel="Find rows"')).toBe(true)
  await page.getByRole('button', { name: 'Hide code', exact: true }).click()

  // Reset restores the component default label.
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(demo.getByRole('searchbox', { name: 'Search' })).toBeVisible()
})

test('showcase: the DataTable searchKeys dialog feeds the snippet', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')

  // The searchKeys dialog seeds a script-local list behind the snippet.
  await page.getByRole('button', { name: 'Edit searchKeys' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit searchKeys' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '[\n  "name"\n]', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, 'searchKeys={searchKeys}')).toBe(true)
  expect(await editorContains(page, 'let searchKeys = $state(["name"]);')).toBe(true)
  await hideCodeToggle(page).click()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
})

test('showcase: the DataTable rows cell edits demo data through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  await expect(demo.locator('tbody tr').first()).toContainText('Catalog')

  // Invalid JSON blocks OK behind an inline error.
  await page.getByRole('button', { name: 'Edit rows' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit rows' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await replaceSnippet(page, 'nope', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid list applies on OK and the demo follows it.
  await replaceSnippet(page, '[{"id": "t1", "name": "Test row", "status": "Active"}]', dialog)
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(demo.locator('tbody tr')).toHaveCount(1)
  await expect(demo.locator('tbody tr').first()).toContainText('Test row')

  // Reset restores the default rows.
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(demo.locator('tbody tr').first()).toContainText('Catalog')
})

test('showcase: the DataTable chooserColumns dialog drives column visibility', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  await page.getByRole('button', { name: 'Edit chooserColumns' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit chooserColumns' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, 'nope', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // Renamed headers cannot round-trip (headers derive from the column defs),
  // so OK stays blocked.
  await replaceSnippet(page, '[{"key": "id", "header": "ID", "checked": true}, {"key": "name", "header": "Name", "checked": true}, {"key": "status", "header": "Renamed", "checked": true}]', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // Unchecking Status hides its column in the demo.
  await replaceSnippet(page, '[{"key": "id", "header": "ID", "checked": true}, {"key": "name", "header": "Name", "checked": true}, {"key": "status", "header": "Status", "checked": false}]', dialog)
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(demo.getByRole('columnheader', { name: 'Status' })).toHaveCount(0)

  // The demo's own reset restores the hidden column.
  await demo.getByRole('button', { name: 'Reset columns' }).click()
  await expect(demo.getByRole('columnheader', { name: 'Status' })).toBeVisible()
})

test('showcase: the DataTable sortKey and sortDirection Value cells drive sorting', async ({
  page,
}) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  // Unset renders insertion order (Catalog first).
  await expect(demo.locator('tbody tr').first()).toContainText('Catalog')

  // sortKey=name sorts ascending (Access first); desc flips it (Workflows first).
  await page.getByRole('textbox', { name: 'sortKey value', exact: true }).fill('name')
  await expect(demo.locator('tbody tr').first()).toContainText('Access')
  const direction = page.getByRole('combobox', { name: 'sortDirection value' })
  await direction.press('ArrowDown')
  await page.getByRole('option', { name: 'desc' }).click()
  await expect(demo.locator('tbody tr').first()).toContainText('Workflows')

  // Clearing sortKey restores insertion order.
  await page.getByRole('button', { name: 'Clear sortKey' }).click()
  await expect(demo.locator('tbody tr').first()).toContainText('Catalog')
})

test('showcase: the DataTable rows eye resets and the searchKeys eye omits', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  // Commit a custom row through the dialog.
  await page.getByRole('button', { name: 'Edit rows' }).click()
  const rowsDialog = page.getByRole('dialog', { name: 'Edit rows' })
  await expect(rowsDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '[{"id": "t1", "name": "Test row", "status": "Active"}]', rowsDialog)
  await rowsDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.locator('tbody tr').first()).toContainText('Test row')

  // Unapplying resets to the default rows.
  await page.getByRole('button', { name: 'Unapply rows' }).click()
  await expect(demo.locator('tbody tr').first()).toContainText('Catalog')

  // Committing searchKeys applies the eye; unapplying omits the prop.
  await page.getByRole('button', { name: 'Edit searchKeys' }).click()
  const keysDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit searchKeys' }) })
  await expect(keysDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '["name"]', keysDialog)
  await keysDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await page.getByRole('button', { name: 'Unapply searchKeys' }).click()
  await expect(page.getByRole('button', { name: 'Apply searchKeys' })).toBeVisible()
})

// The resizable prop turns each header into a column splitter: dragging one
// re-partitions the managed pixel widths rendered through the `<colgroup>`.
test('showcase: a DataTable column resize handle widens its column', async ({ page }) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  // Resizable is off by default; the settings-panel checkbox (its input is
  // screen-reader-only, so toggle from the keyboard) enables the splitters.
  const resizableBox = page.getByRole('checkbox', { name: 'resizable value' })
  await resizableBox.focus()
  await page.keyboard.press('Space')
  const handles = demo.getByRole('button', { name: /^Resize / })
  await expect(handles).toHaveCount(3)

  // The demo declares no storageKey, so the widths stay session-only.
  const handle = handles.first()
  await handle.scrollIntoViewIfNeeded()
  const box = (await handle.boundingBox())!
  // A splitter straddles its column's edge (translated by half its width), so
  // its outer half overlaps the next header: grab the inner half.
  const grabX = box.x + 1
  const grabY = box.y + box.height / 2
  await page.mouse.move(grabX, grabY)
  await page.mouse.down()

  // The drag captures every column into the managed pixel layout, which
  // renders a `<col>` per data column.
  const firstColumn = demo.locator('col').first()
  await expect.poll(async () => firstColumn.evaluate(el => el.style.width)).toMatch(/^\d+px$/)
  const startWidth = Number.parseFloat(await firstColumn.evaluate(el => el.style.width))

  await page.mouse.move(grabX + 40, grabY)
  await expect
    .poll(async () => Number.parseFloat(await firstColumn.evaluate(el => el.style.width)))
    .toBeGreaterThan(startWidth)
  await page.mouse.up()

  // The widened column keeps its width after the drag settles.
  const settled = Number.parseFloat(await firstColumn.evaluate(el => el.style.width))
  expect(settled).toBeGreaterThanOrEqual(startWidth + 30)
})


test('showcase: the DataTable variant Value cell switches to the docs layout', async ({ page }) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const header = demo.locator('thead th').first()

  // Data viewer: a sticky header and separated borders.
  await expect(header).toHaveCSS('position', 'sticky')
  await expect(demo.locator('table')).toHaveCSS('border-collapse', 'separate')

  await page.getByRole('combobox', { name: 'variant value', exact: true }).click()
  await page.getByRole('option', { name: 'docs' }).click()

  // Docs table: no sticky band, collapsed borders, no row hover.
  await expect(header).toHaveCSS('position', 'static')
  await expect(demo.locator('table')).toHaveCSS('border-collapse', 'collapse')
})

test('showcase: DataTable column filters open from the header and narrow the demo', async ({ page }) => {
  await page.goto('/components/data-table')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  // Off by default: the demo declares filterable columns but no triggers.
  await expect(demo.getByRole('button', { name: 'Filter Status' })).toHaveCount(0)

  // The columnFilters Value cell (its input is clipped, so toggle from the
  // keyboard) turns the triggers on.
  const columnFiltersBox = page.getByRole('checkbox', { name: 'columnFilters value' })
  await columnFiltersBox.focus()
  await page.keyboard.press('Space')
  const statusFilter = demo.getByRole('button', { name: 'Filter Status' })
  await expect(statusFilter).toBeVisible()
  await expect(demo.getByRole('button', { name: 'Filter Name' })).toBeVisible()

  // The sort arrows stay visible without hovering.
  await expect(demo.getByRole('button', { name: 'Sort Name ascending' })).toBeVisible()
  await expect(demo.getByRole('button', { name: 'Sort Name descending' })).toBeVisible()

  // The trigger opens a portalled panel whose input takes focus.
  await statusFilter.click()
  const panel = page.locator('[role="group"]', { has: page.getByRole('combobox', { name: 'Filter Status' }) })
  await expect(panel).toBeVisible()
  const input = panel.getByRole('combobox', { name: 'Filter Status' })
  await expect(input).toBeFocused()

  // A custom typed value narrows the caller's pipeline and its row total.
  await input.fill('Active')
  await expect(demo.getByRole('navigation').getByText('50 rows')).toBeVisible()
  await expect(demo.locator('tbody tr')).toHaveCount(20)

  // Clearing every filter restores the full set.
  await demo.getByRole('button', { name: 'Clear filters' }).click()
  await expect(demo.getByRole('navigation').getByText('75 rows')).toBeVisible()

  // The Name column suggests its own values; picking one filters to it and
  // leaves the filter panel open.
  await demo.getByRole('button', { name: 'Filter Name' }).click()
  const nameInput = page.locator('[role="group"]').getByRole('combobox', { name: 'Filter Name' })
  await nameInput.click()
  await page.getByRole('option', { name: 'Catalog', exact: true }).click()
  await expect(demo.getByRole('navigation').getByText('1 rows')).toBeVisible()
  await expect(demo.locator('tbody tr').first()).toContainText('Catalog')

  // The per-column clear empties that filter only.
  await page.locator('[role="group"]').getByRole('button', { name: 'Clear Name' }).click()
  await expect(demo.getByRole('navigation').getByText('75 rows')).toBeVisible()
})
