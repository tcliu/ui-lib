import { expect, test } from '@playwright/test'
import { replaceSnippet } from './helpers'

// ColumnChooser follows the converted showcase layout: the code toggle sits
// beside the component title, the demo sits in a borderless resizable frame,
// and the props table appends an editable Value column.
test('showcase: ColumnChooser hosts its code toggle in the title row beside a resizable demo', async ({ page }) => {
  await page.goto('/components/column-chooser')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const toggle = page.locator('main header').getByRole('button', { name: 'Show code' })

  await expect(page.getByRole('heading', { level: 1, name: 'ColumnChooser' })).toBeVisible()
  await expect(toggle).toHaveCount(1)

  // The demo sits in a resizable frame. Resizable renders its width, height,
  // and corner handles unconditionally.
  await expect(demo.locator('[role="separator"]')).toHaveCount(3)

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the stage snippet, which reproduces the demo.
  const before = (await demo.innerText()).replace(/\s+/g, ' ').trim()
  await toggle.click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  await expect.poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 }).toBe(before)
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})

test('showcase: the ColumnChooser columns cell edits JSON through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/column-chooser')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await expect(demo).toContainText('hidden: 0')

  await page.getByRole('button', { name: 'Edit columns' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit columns' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await expect(dialog.getByRole('button', { name: 'Reset', exact: true })).toBeVisible()

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // Unchecking an entry applies on OK and the hidden count follows.
  await replaceSnippet(
    page,
    dialog,
    '[{"key": "id", "header": "ID"}, {"key": "name", "header": "Name", "checked": false}]',
  )
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(demo).toContainText('hidden: 1')
})

test('showcase: ColumnChooser snippet edits flow back into the Value column', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/column-chooser')
  await page.waitForLoadState('networkidle')

  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  const editor = page.locator('main .cm-content').first()
  await expect(editor).toBeVisible()
  // Wait out the initial compile so the live instance is mounted.
  const demo = page.locator('[data-showcase-demo]').first()
  await expect
    .poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 })
    .toBe('hidden: 0')

  // Editing the snippet writes recognized values back into playground state:
  // the label cell and the demo follow while the editor keeps the typed text.
  await replaceSnippet(
    page,
    page.locator('main'),
    [
      '<script>',
      '  let columns = $state([',
      '    {"key": "id", "header": "ID", "checked": true},',
      '    {"key": "name", "header": "Name", "checked": false}',
      '  ]);',
      '</script>',
      '<ColumnChooser',
      '  triggerLabel="Team columns"',
      '  resetAriaLabel={resetLabel}',
      '  columns={columns}',
      '  onToggle={(key, checked) => {}}',
      '  onReset={() => {}} />',
      '<span class="text-sm text-slate-400">hidden: {columns.filter(column => !column.checked).length}</span>',
    ].join('\n'),
  )
  await expect(page.getByRole('textbox', { name: 'triggerLabel value', exact: true })).toHaveValue('Team columns')
  await expect
    .poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 })
    .toBe('hidden: 1')
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})

test('showcase: the ColumnChooser columns eye resets to the seeds', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/column-chooser')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()

  // Commit an unchecked entry through the dialog.
  await page.getByRole('button', { name: 'Edit columns' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit columns' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(
    page,
    dialog,
    '[{"key": "id", "header": "ID"}, {"key": "name", "header": "Name", "checked": false}]',
  )
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo).toContainText('hidden: 1')

  // Unapplying resets to the seed entries.
  await page.getByRole('button', { name: 'Unapply columns' }).click()
  await expect(demo).toContainText('hidden: 0')
})
